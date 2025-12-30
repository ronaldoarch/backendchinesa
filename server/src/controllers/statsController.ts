import { Request, Response } from "express";
import { getDashboardStats } from "../services/statsService";
import { asyncHandler } from "../middleware/asyncHandler";
import { pool } from "../config/database";

export async function getDashboardStatsController(req: Request, res: Response): Promise<void> {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error("Erro ao buscar estatísticas do dashboard:", error);
    res.status(500).json({
      error: error.message || "Erro ao buscar estatísticas"
    });
  }
}

export async function resetDashboardController(req: Request, res: Response): Promise<void> {
  try {
    console.log("🗑️ [RESET DASHBOARD] Iniciando reset do dashboard...");

    // 1. Deletar todas as transações
    await pool.query("DELETE FROM transactions");
    console.log("✅ Transações deletadas");

    // 2. Zerar totais dos usuários
    await pool.query(`
      UPDATE users SET 
        total_deposit_amount = 0,
        total_withdrawal_amount = 0,
        total_bet_amount = 0,
        balance = 0,
        bonus_balance = 0,
        last_deposit_at = NULL,
        last_withdrawal_at = NULL,
        last_bet_at = NULL,
        vip_level = 0
    `);
    console.log("✅ Totais dos usuários zerados");

    // 3. Deletar apostas (se a tabela existir)
    try {
      await pool.query("DELETE FROM user_bets");
      console.log("✅ Apostas deletadas");
    } catch (error: any) {
      console.log("⚠️ Tabela user_bets não existe ou já está vazia");
    }

    // 4. Deletar bônus (se a tabela existir)
    try {
      await pool.query("DELETE FROM user_bonuses");
      console.log("✅ Bônus deletados");
    } catch (error: any) {
      console.log("⚠️ Tabela user_bonuses não existe ou já está vazia");
    }

    // 5. Deletar recompensas (se a tabela existir)
    try {
      await pool.query("DELETE FROM user_rewards");
      console.log("✅ Recompensas deletadas");
    } catch (error: any) {
      console.log("⚠️ Tabela user_rewards não existe ou já está vazia");
    }

    // 6. Deletar histórico de indicações (se a tabela existir)
    try {
      await pool.query("DELETE FROM referral_bets");
      console.log("✅ Histórico de indicações deletado");
    } catch (error: any) {
      console.log("⚠️ Tabela referral_bets não existe ou já está vazia");
    }

    // Verificar resultado
    const [usersResult] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [transactionsResult] = await pool.query("SELECT COUNT(*) as count FROM transactions");
    const [depositsResult] = await pool.query("SELECT COALESCE(SUM(total_deposit_amount), 0) as total FROM users");
    const [withdrawalsResult] = await pool.query("SELECT COALESCE(SUM(total_withdrawal_amount), 0) as total FROM users");
    const [betsResult] = await pool.query("SELECT COALESCE(SUM(total_bet_amount), 0) as total FROM users");

    console.log("✅ Dashboard zerado com sucesso!");

    res.json({
      success: true,
      message: "Dashboard zerado com sucesso",
      result: {
        totalUsers: (usersResult as any[])[0].count,
        totalTransactions: (transactionsResult as any[])[0].count,
        totalDeposits: Number((depositsResult as any[])[0].total),
        totalWithdrawals: Number((withdrawalsResult as any[])[0].total),
        totalBets: Number((betsResult as any[])[0].total)
      }
    });
  } catch (error: any) {
    console.error("❌ Erro ao zerar dashboard:", error);
    res.status(500).json({
      error: error.message || "Erro ao zerar dashboard"
    });
  }
}

export const statsController = {
  getDashboard: asyncHandler(getDashboardStatsController),
  resetDashboard: asyncHandler(resetDashboardController)
};
