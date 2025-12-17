import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

/**
 * Calcular comissões para o período da semana passada (segunda a domingo)
 * Retorna as datas do período
 */
export function getLastWeekPeriod(): { start: string; end: string } {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
  
  // Calcular última segunda-feira
  let daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - daysToLastMonday - 7); // Semana passada
  lastMonday.setHours(0, 0, 0, 0);
  
  // Domingo da semana passada
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);
  
  return {
    start: lastMonday.toISOString().split("T")[0],
    end: lastSunday.toISOString().split("T")[0]
  };
}

/**
 * Calcular e processar comissões automaticamente
 */
export async function processWeeklyCommissions(): Promise<{
  success: boolean;
  commissionsCalculated: number;
  commissionsApproved: number;
}> {
  const period = getLastWeekPeriod();
  
  try {
    // 1. Calcular comissões
    const [affiliates] = await pool.query<RowDataPacket[]>(
      `SELECT a.id as affiliate_id, a.manager_id, a.user_id as affiliate_user_id,
              ar.referred_user_id
       FROM affiliates a
       INNER JOIN affiliate_referrals ar ON a.id = ar.affiliate_id
       WHERE a.active = true`
    );

    let commissionsCalculated = 0;

    for (const affiliate of affiliates as any[]) {
      const referredUserId = affiliate.referred_user_id;
      const affiliateId = affiliate.affiliate_id;
      const managerId = affiliate.manager_id;

      // Calcular total de apostas e ganhos
      const [betStats] = await pool.query<RowDataPacket[]>(
        `SELECT 
          COALESCE(SUM(CASE WHEN payment_method = 'GAME_BET' AND amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_bet,
          COALESCE(SUM(CASE WHEN payment_method = 'GAME_BET' AND amount > 0 THEN amount ELSE 0 END), 0) as total_win
         FROM transactions
         WHERE user_id = ?
         AND payment_method = 'GAME_BET'
         AND status = 'COMPLETED'
         AND DATE(created_at) BETWEEN ? AND ?`,
        [referredUserId, period.start, period.end]
      );

      const stats = (betStats as any[])[0];
      const totalBet = Number(stats.total_bet || 0);
      const totalWin = Number(stats.total_win || 0);
      const netResult = totalWin - totalBet;

      if (netResult > 0) {
        const affiliateCommission = netResult * 0.05;
        const managerCommission = netResult * 0.20;

        // Verificar se já existe
        const [existing] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM commissions
           WHERE affiliate_id = ? AND user_id = ? AND period_start = ? AND period_end = ?`,
          [affiliateId, referredUserId, period.start, period.end]
        );

        if ((existing as any[]).length === 0) {
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
              period.start,
              period.end,
              totalBet,
              totalWin,
              netResult,
              affiliateCommission,
              managerCommission
            ]
          );
          commissionsCalculated++;
        }
      }
    }

    // 2. Aprovar e liberar comissões (se for segunda-feira)
    const today = new Date();
    const dayOfWeek = today.getDay();
    let commissionsApproved = 0;

    if (dayOfWeek === 1) {
      const [pendingCommissions] = await pool.query<RowDataPacket[]>(
        `SELECT c.id, c.manager_id, c.affiliate_id, c.manager_commission, c.affiliate_commission
         FROM commissions c
         WHERE c.period_start = ? AND c.period_end = ? AND c.status = 'pending'`,
        [period.start, period.end]
      );

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        for (const commission of pendingCommissions as any[]) {
          await connection.query(
            `UPDATE users SET balance = balance + ? WHERE id = ?`,
            [commission.manager_commission, commission.manager_id]
          );

          const [affiliate] = await connection.query<RowDataPacket[]>(
            "SELECT user_id FROM affiliates WHERE id = ?",
            [commission.affiliate_id]
          );

          if ((affiliate as any[]).length > 0) {
            const affiliateUserId = (affiliate as any[])[0].user_id;
            await connection.query(
              `UPDATE users SET balance = balance + ? WHERE id = ?`,
              [commission.affiliate_commission, affiliateUserId]
            );
          }

          await connection.query(
            `UPDATE commissions SET status = 'paid', paid_at = NOW() WHERE id = ?`,
            [commission.id]
          );
          commissionsApproved++;
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    return {
      success: true,
      commissionsCalculated,
      commissionsApproved
    };
  } catch (error: any) {
    console.error("Erro ao processar comissões semanais:", error);
    throw error;
  }
}
