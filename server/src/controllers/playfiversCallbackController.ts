import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { updateUserBalance } from "../services/transactionsService";
import { trackReferralBet } from "../services/referralService";

/**
 * Processa callbacks do PlayFivers para atualizar saldo quando usuário joga
 */
export async function playfiversCallbackController(req: Request, res: Response): Promise<void> {
  try {
    // Log completo do body recebido para debug
    console.log("📥 [PLAYFIVERS CALLBACK] Body completo recebido:", JSON.stringify(req.body, null, 2));
    console.log("📥 [PLAYFIVERS CALLBACK] Headers:", req.headers);

    // Tentar diferentes formatos de campos (PlayFivers pode usar diferentes nomes)
    const eventType = req.body.type || req.body.event_type || req.body.event;
    const userCode = req.body.user_code || req.body.userCode || req.body.username;
    const agentCode = req.body.agent_code || req.body.agentCode;
    const userBalance = req.body.user_balance || req.body.userBalance || req.body.balance;
    
    // Segundo a documentação oficial, bet e win estão dentro de slot
    // Formato: { type: "WinBet", slot: { bet: 50, win: 100 } }
    // Priorizar slot.bet e slot.win conforme documentação oficial
    const betAmount = slotBet || 
                     req.body.bet_amount || 
                     req.body.betAmount || 
                     req.body.bet || 
                     req.body.amount || 
                     req.body.stake || 
                     0;
    
    const winAmount = slotWin || 
                     req.body.win_amount || 
                     req.body.winAmount || 
                     req.body.win || 
                     req.body.payout || 
                     req.body.prize || 
                     0;
    
    const gameOriginal = req.body.game_original || req.body.gameOriginal;
    const gameType = req.body.game_type || req.body.gameType;
    const slot = req.body.slot;

    console.log("📥 [PLAYFIVERS CALLBACK] Dados extraídos:", {
      type: eventType,
      user_code: userCode,
      agent_code: agentCode,
      user_balance: userBalance,
      bet_amount: betAmount,
      win_amount: winAmount,
      game_original: gameOriginal,
      game_type: gameType,
      slot: slot
    });

    // Buscar usuário pelo user_code (que é o username conforme gamesController)
    let userId: number | null = null;
    
    if (userCode) {
      // Primeiro tentar pelo username (padrão usado no launchGame)
      const [userRows] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM users WHERE username = ?",
        [userCode]
      );
      if (userRows && userRows.length > 0) {
        userId = userRows[0].id;
      } else {
        // Se não encontrou pelo username, tentar pelo ID (caso o user_code seja numérico)
        if (!isNaN(Number(userCode))) {
          const [idRows] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE id = ?",
            [Number(userCode)]
          );
          if (idRows && idRows.length > 0) {
            userId = idRows[0].id;
          }
        }
      }
    }

    if (!userId) {
      console.error("❌ [PLAYFIVERS CALLBACK] Usuário não encontrado para user_code:", userCode);
      // Retornar saldo 0 se usuário não encontrado
      res.status(200).json({ 
        msg: "",
        balance: 0
      });
      return;
    }

    // Buscar saldo atual do usuário
    const [balanceRows] = await pool.query<RowDataPacket[]>(
      "SELECT balance, bonus_balance FROM users WHERE id = ?",
      [userId]
    );

    if (!balanceRows || balanceRows.length === 0) {
      console.error("❌ [PLAYFIVERS CALLBACK] Erro ao buscar saldo do usuário:", userId);
      res.status(200).json({ 
        msg: "",
        balance: 0
      });
      return;
    }

    let currentBalance = Number(balanceRows[0].balance || 0);

    // Processar diferentes tipos de eventos
    if (eventType === "BALANCE") {
      // Webhook de saldo - apenas retornar saldo atual
      console.log("💰 [PLAYFIVERS CALLBACK] Webhook de saldo para usuário:", userId);
      res.status(200).json({ 
        msg: "",
        balance: currentBalance
      });
      return;
    }

    // Verificar se é um evento de aposta (case-insensitive)
    const normalizedEventType = eventType?.toString().toLowerCase();
    const isBetEvent = normalizedEventType === "bet" || 
                      normalizedEventType === "winbet" || 
                      normalizedEventType === "win_bet" ||
                      normalizedEventType === "losebet" || 
                      normalizedEventType === "lose_bet" ||
                      (betValue > 0 && !eventType); // Se tem betValue mas não tem eventType, pode ser uma aposta

    if (isBetEvent) {
      // Processar aposta
      // Extrair valores (priorizar slot.bet e slot.win conforme documentação)
      let betValue = Number(slotBet || betAmount || 0);
      let winValue = Number(slotWin || winAmount || 0);

      console.log("🎰 [PLAYFIVERS CALLBACK] Processando aposta:", {
        userId,
        eventType,
        betAmount: betValue,
        winAmount: winValue,
        currentBalance,
        bodyKeys: Object.keys(req.body),
        bodyValues: Object.values(req.body)
      });

      // Função auxiliar para processar desconto de aposta
      async function processBet(bet: number) {
        if (bet > 0 && userId !== null) {
          await updateUserBalance(userId, -bet);
          currentBalance -= bet;
          
          // Atualizar total_bet_amount
          await pool.query(
            `UPDATE users 
             SET total_bet_amount = COALESCE(total_bet_amount, 0) + ?, 
                 last_bet_at = NOW()
             WHERE id = ?`,
            [bet, userId]
          );

          // Rastrear aposta para sistema de indicação
          try {
            await trackReferralBet(userId, bet);
          } catch (error) {
            console.error("Erro ao rastrear aposta de indicação:", error);
            // Não bloquear o processamento se houver erro no rastreamento
          }

          console.log(`✅ [PLAYFIVERS CALLBACK] Aposta de R$ ${bet} descontada do usuário ${userId}. Novo saldo: R$ ${currentBalance}`);
        }
      }

      // Normalizar eventType para comparação (case-insensitive)
      const normalizedEventType = eventType?.toString().toLowerCase();

      if (normalizedEventType === "bet") {
        // Apenas aposta (ainda não sabemos se ganhou ou perdeu)
        // Descontar valor da aposta
        console.log(`🎲 [PLAYFIVERS CALLBACK] Evento Bet detectado - descontando R$ ${betValue}`);
        await processBet(betValue);
      } else if (normalizedEventType === "winbet" || normalizedEventType === "win_bet") {
        // Usuário ganhou
        // Se betValue > 0, descontar a aposta primeiro (caso não tenha sido descontada no evento "Bet")
        if (betValue > 0) {
          await processBet(betValue);
        }
        
        // Adicionar ganho (win_amount geralmente já é o valor total que o usuário deve receber)
        if (winValue > 0 && userId !== null) {
          await updateUserBalance(userId, winValue);
          currentBalance += winValue;
          console.log(`✅ [PLAYFIVERS CALLBACK] Ganho de R$ ${winValue} creditado para usuário ${userId}. Novo saldo: R$ ${currentBalance}`);
        }
      } else if (normalizedEventType === "losebet" || normalizedEventType === "lose_bet") {
        // Usuário perdeu
        // Se betValue > 0, descontar a aposta (caso não tenha sido descontada no evento "Bet")
        console.log(`❌ [PLAYFIVERS CALLBACK] Evento LoseBet detectado - aposta perdida`);
        if (betValue > 0) {
          await processBet(betValue);
        } else {
          console.log(`✅ [PLAYFIVERS CALLBACK] Aposta perdida confirmada para usuário ${userId}. Saldo: R$ ${currentBalance}`);
        }
      } else {
        // Se chegou aqui, o eventType não foi reconhecido mas pode ser uma aposta
        // Tentar processar se houver betValue
        console.warn(`⚠️ [PLAYFIVERS CALLBACK] EventType não reconhecido: ${eventType}, mas tentando processar se houver betValue`);
        if (betValue > 0) {
          await processBet(betValue);
        }
        if (winValue > 0 && userId !== null) {
          await updateUserBalance(userId, winValue);
          currentBalance += winValue;
          console.log(`✅ [PLAYFIVERS CALLBACK] Ganho de R$ ${winValue} creditado (evento não reconhecido). Novo saldo: R$ ${currentBalance}`);
        }
      }

      // Retornar saldo atualizado
      res.status(200).json({ 
        msg: "",
        balance: currentBalance
      });
      return;
    }

    // Se não há eventType, pode ser um callback de saldo simples
    if (!eventType && userCode) {
      console.log("💰 [PLAYFIVERS CALLBACK] Callback sem tipo de evento - retornando saldo atual");
      res.status(200).json({ 
        msg: "",
        balance: currentBalance
      });
      return;
    }

    // Evento desconhecido - retornar saldo atual
    console.warn("⚠️ [PLAYFIVERS CALLBACK] Tipo de evento desconhecido:", eventType, "Body completo:", JSON.stringify(req.body, null, 2));
    res.status(200).json({ 
      msg: "",
      balance: currentBalance
    });
  } catch (error: any) {
    console.error("❌ [PLAYFIVERS CALLBACK] Erro ao processar callback:", error);
    // Sempre retornar 200 para não quebrar o fluxo do PlayFivers
    res.status(200).json({ 
      msg: "",
      balance: 0
    });
  }
}
