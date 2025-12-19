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
    const eventType = req.body.type;
    const userCode = req.body.user_code;
    const agentCode = req.body.agent_code;
    const userBalance = req.body.user_balance;
    const betAmount = req.body.bet_amount || req.body.bet || 0;
    const winAmount = req.body.win_amount || req.body.win || 0;
    const gameOriginal = req.body.game_original;
    const gameType = req.body.game_type;
    const slot = req.body.slot;

    console.log("📥 [PLAYFIVERS CALLBACK] Evento recebido:", {
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

    if (eventType === "Bet" || eventType === "LoseBet" || eventType === "WinBet") {
      // Processar aposta
      const betValue = Number(betAmount || req.body.bet || 0);
      const winValue = Number(winAmount || req.body.win || 0);

      console.log("🎰 [PLAYFIVERS CALLBACK] Processando aposta:", {
        userId,
        eventType,
        betAmount: betValue,
        winAmount: winValue,
        currentBalance,
        body: req.body
      });

      // Função auxiliar para processar desconto de aposta
      async function processBet(bet: number) {
        if (bet > 0) {
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

      if (eventType === "Bet") {
        // Apenas aposta (ainda não sabemos se ganhou ou perdeu)
        // Descontar valor da aposta
        await processBet(betValue);
      } else if (eventType === "WinBet") {
        // Usuário ganhou
        // Se betValue > 0, descontar a aposta primeiro (caso não tenha sido descontada no evento "Bet")
        if (betValue > 0) {
          await processBet(betValue);
        }
        
        // Adicionar ganho (win_amount geralmente já é o valor total que o usuário deve receber)
        if (winValue > 0) {
          await updateUserBalance(userId, winValue);
          currentBalance += winValue;
          console.log(`✅ [PLAYFIVERS CALLBACK] Ganho de R$ ${winValue} creditado para usuário ${userId}. Novo saldo: R$ ${currentBalance}`);
        }
      } else if (eventType === "LoseBet") {
        // Usuário perdeu
        // Se betValue > 0, descontar a aposta (caso não tenha sido descontada no evento "Bet")
        if (betValue > 0) {
          await processBet(betValue);
        } else {
          console.log(`✅ [PLAYFIVERS CALLBACK] Aposta perdida confirmada para usuário ${userId}. Saldo: R$ ${currentBalance}`);
        }
      }

      // Retornar saldo atualizado
      res.status(200).json({ 
        msg: "",
        balance: currentBalance
      });
      return;
    }

    // Evento desconhecido - retornar saldo atual
    console.warn("⚠️ [PLAYFIVERS CALLBACK] Tipo de evento desconhecido:", eventType);
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
