import { Request, Response } from "express";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";
import { processWeeklyCommissions } from "../services/commissionsService";

/**
 * Processar comissões semanais automaticamente (segunda-feira)
 */
export async function processWeeklyCommissionsController(req: Request, res: Response): Promise<void> {
  try {
    const result = await processWeeklyCommissions();
    res.json(result);
  } catch (error: any) {
    console.error("Erro ao processar comissões semanais:", error);
    res.status(500).json({ error: "Erro ao processar comissões semanais" });
  }
}

/**
 * Calcular comissões para um período
 */
export async function calculateCommissionsController(req: Request, res: Response): Promise<void> {
  const { periodStart, periodEnd } = req.body;

  if (!periodStart || !periodEnd) {
    res.status(400).json({ error: "periodStart e periodEnd são obrigatórios" });
    return;
  }

  try {
    // Buscar todos os afiliados ativos
    const [affiliates] = await pool.query<RowDataPacket[]>(
      `SELECT a.id as affiliate_id, a.manager_id, a.user_id as affiliate_user_id,
              ar.referred_user_id
       FROM affiliates a
       INNER JOIN affiliate_referrals ar ON a.id = ar.affiliate_id
       WHERE a.active = true`
    );

    const commissions: any[] = [];

    for (const affiliate of affiliates as any[]) {
      const referredUserId = affiliate.referred_user_id;
      const affiliateId = affiliate.affiliate_id;
      const managerId = affiliate.manager_id;

      // Calcular total de apostas e ganhos do usuário referenciado no período
      const [betStats] = await pool.query<RowDataPacket[]>(
        `SELECT 
          COALESCE(SUM(CASE WHEN payment_method = 'GAME_BET' AND amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_bet,
          COALESCE(SUM(CASE WHEN payment_method = 'GAME_BET' AND amount > 0 THEN amount ELSE 0 END), 0) as total_win
         FROM transactions
         WHERE user_id = ?
         AND payment_method = 'GAME_BET'
         AND status = 'COMPLETED'
         AND DATE(created_at) BETWEEN ? AND ?`,
        [referredUserId, periodStart, periodEnd]
      );

      const stats = (betStats as any[])[0];
      const totalBet = Number(stats.total_bet || 0);
      const totalWin = Number(stats.total_win || 0);
      const netResult = totalWin - totalBet; // Positivo = ganhou mais do que apostou

      // Só calcular comissão se houver resultado positivo
      if (netResult > 0) {
        // Comissão do afiliado: 5% do positivo
        const affiliateCommission = netResult * 0.05;

        // Comissão do gerente: 20% do positivo
        const managerCommission = netResult * 0.20;

        // Verificar se já existe comissão para este período
        const [existing] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM commissions
           WHERE affiliate_id = ?
           AND user_id = ?
           AND period_start = ?
           AND period_end = ?`,
          [affiliateId, referredUserId, periodStart, periodEnd]
        );

        if ((existing as any[]).length === 0) {
          // Criar registro de comissão
          await pool.query(
            `INSERT INTO commissions (
              affiliate_id, manager_id, user_id, period_start, period_end,
              total_bet, total_win, net_result,
              affiliate_commission, manager_commission, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
              affiliateId,
              managerId,
              referredUserId,
              periodStart,
              periodEnd,
              totalBet,
              totalWin,
              netResult,
              affiliateCommission,
              managerCommission
            ]
          );
        } else {
          // Atualizar comissão existente
          await pool.query(
            `UPDATE commissions SET
              total_bet = ?, total_win = ?, net_result = ?,
              affiliate_commission = ?, manager_commission = ?
             WHERE affiliate_id = ? AND user_id = ? AND period_start = ? AND period_end = ?`,
            [
              totalBet,
              totalWin,
              netResult,
              affiliateCommission,
              managerCommission,
              affiliateId,
              referredUserId,
              periodStart,
              periodEnd
            ]
          );
        }

        commissions.push({
          affiliateId,
          managerId,
          userId: referredUserId,
          totalBet,
          totalWin,
          netResult,
          affiliateCommission,
          managerCommission
        });
      }
    }

    res.json({
      success: true,
      message: "Comissões calculadas com sucesso",
      commissionsCalculated: commissions.length,
      commissions
    });
  } catch (error: any) {
    console.error("Erro ao calcular comissões:", error);
    res.status(500).json({ error: "Erro ao calcular comissões" });
  }
}

/**
 * Listar comissões de um gerente
 */
export async function listManagerCommissionsController(req: Request, res: Response): Promise<void> {
  const managerId = (req as any).userId;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.period_start as periodStart, c.period_end as periodEnd,
              c.net_result as netResult, c.manager_commission as managerCommission,
              c.status, c.paid_at as paidAt,
              u.username as referredUser,
              a.code as affiliateCode
       FROM commissions c
       INNER JOIN affiliates a ON c.affiliate_id = a.id
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.manager_id = ?
       ORDER BY c.period_start DESC, c.created_at DESC`,
      [managerId]
    );

    res.json(rows);
  } catch (error: any) {
    console.error("Erro ao listar comissões do gerente:", error);
    res.status(500).json({ error: "Erro ao listar comissões" });
  }
}

/**
 * Listar comissões de um afiliado
 */
export async function listAffiliateCommissionsController(req: Request, res: Response): Promise<void> {
  const affiliateId = parseInt(req.params.affiliateId);

  try {
    // Verificar se o afiliado pertence ao gerente logado
    const managerId = (req as any).userId;
    const [check] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM affiliates WHERE id = ? AND manager_id = ?",
      [affiliateId, managerId]
    );

    if ((check as any[]).length === 0) {
      res.status(404).json({ error: "Afiliado não encontrado" });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.period_start as periodStart, c.period_end as periodEnd,
              c.net_result as netResult, c.affiliate_commission as affiliateCommission,
              c.status, c.paid_at as paidAt,
              u.username as referredUser
       FROM commissions c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.affiliate_id = ?
       ORDER BY c.period_start DESC, c.created_at DESC`,
      [affiliateId]
    );

    res.json(rows);
  } catch (error: any) {
    console.error("Erro ao listar comissões do afiliado:", error);
    res.status(500).json({ error: "Erro ao listar comissões" });
  }
}

/**
 * Aprovar e liberar comissões (apenas segunda-feira)
 */
export async function approveCommissionsController(req: Request, res: Response): Promise<void> {
  const { periodStart, periodEnd } = req.body;

  // Verificar se é segunda-feira
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
  
  if (dayOfWeek !== 1) {
    res.status(400).json({ 
      error: "Comissões só podem ser aprovadas às segundas-feiras",
      today: today.toLocaleDateString("pt-BR"),
      dayOfWeek 
    });
    return;
  }

  try {
    // Buscar todas as comissões pendentes do período
    const [pendingCommissions] = await pool.query<RowDataPacket[]>(
      `SELECT c.id, c.manager_id, c.affiliate_id, c.manager_commission, c.affiliate_commission
       FROM commissions c
       WHERE c.period_start = ? AND c.period_end = ? AND c.status = 'pending'`,
      [periodStart, periodEnd]
    );

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const commission of pendingCommissions as any[]) {
        // Atualizar saldo do gerente
        await connection.query(
          `UPDATE users SET balance = balance + ? WHERE id = ?`,
          [commission.manager_commission, commission.manager_id]
        );

        // Buscar user_id do afiliado
        const [affiliate] = await connection.query<RowDataPacket[]>(
          "SELECT user_id FROM affiliates WHERE id = ?",
          [commission.affiliate_id]
        );

        if ((affiliate as any[]).length > 0) {
          const affiliateUserId = (affiliate as any[])[0].user_id;
          
          // Atualizar saldo do afiliado
          await connection.query(
            `UPDATE users SET balance = balance + ? WHERE id = ?`,
            [commission.affiliate_commission, affiliateUserId]
          );
        }

        // Marcar comissão como aprovada e paga
        await connection.query(
          `UPDATE commissions SET status = 'paid', paid_at = NOW() WHERE id = ?`,
          [commission.id]
        );
      }

      await connection.commit();
      
      res.json({
        success: true,
        message: "Comissões aprovadas e liberadas com sucesso",
        commissionsApproved: (pendingCommissions as any[]).length
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Erro ao aprovar comissões:", error);
    res.status(500).json({ error: "Erro ao aprovar comissões" });
  }
}

/**
 * Rastrear referência quando usuário se cadastra com código
 */
export async function trackReferralController(req: Request, res: Response): Promise<void> {
  const { code } = req.body;
  const userId = (req as any).userId;

  if (!code) {
    res.status(400).json({ error: "Código de referência é obrigatório" });
    return;
  }

  try {
    // Buscar afiliado pelo código
    const [affiliates] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM affiliates WHERE code = ? AND active = true",
      [code.toUpperCase()]
    );

    if ((affiliates as any[]).length === 0) {
      res.status(404).json({ error: "Código de referência inválido" });
      return;
    }

    const affiliateId = (affiliates as any[])[0].id;

    // Verificar se já foi referenciado
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM affiliate_referrals WHERE affiliate_id = ? AND referred_user_id = ?",
      [affiliateId, userId]
    );

    if ((existing as any[]).length > 0) {
      res.json({ success: true, message: "Referência já registrada" });
      return;
    }

    // Criar registro de referência
    await pool.query(
      "INSERT INTO affiliate_referrals (affiliate_id, referred_user_id) VALUES (?, ?)",
      [affiliateId, userId]
    );

    res.json({ success: true, message: "Referência registrada com sucesso" });
  } catch (error: any) {
    console.error("Erro ao rastrear referência:", error);
    res.status(500).json({ error: "Erro ao rastrear referência" });
  }
}
