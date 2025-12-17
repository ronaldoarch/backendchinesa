import { Request, Response } from "express";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

/**
 * Obter status de uma recompensa específica
 */
export async function getRewardStatusController(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;
  const { rewardId } = req.params;

  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  try {
    if (rewardId === "treasure_100") {
      // Buscar total de apostas do usuário
      const [betRows] = await pool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(ABS(amount)), 0) as totalBet
         FROM transactions
         WHERE user_id = ?
         AND payment_method = 'GAME_BET'
         AND status = 'COMPLETED'`,
        [userId]
      );

      const totalBet = Number((betRows as any[])[0]?.totalBet || 0);

      // Verificar se já resgatou esta recompensa
      const [redeemedRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM user_rewards
         WHERE user_id = ? AND reward_id = ? AND redeemed = true`,
        [userId, rewardId]
      );

      const redeemed = (redeemedRows as any[]).length > 0;

      res.json({
        rewardId,
        totalBet,
        requiredBet: 100,
        redeemed,
        canRedeem: totalBet >= 100 && !redeemed
      });
    } else {
      res.status(404).json({ error: "Recompensa não encontrada" });
    }
  } catch (error: any) {
    console.error("Erro ao buscar status da recompensa:", error);
    res.status(500).json({ error: "Erro ao buscar status da recompensa" });
  }
}

/**
 * Resgatar uma recompensa
 */
export async function redeemRewardController(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;
  const { rewardId } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  if (!rewardId) {
    res.status(400).json({ error: "ID da recompensa não fornecido" });
    return;
  }

  try {
    if (rewardId === "treasure_100") {
      // Verificar se já resgatou
      const [existingRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM user_rewards
         WHERE user_id = ? AND reward_id = ? AND redeemed = true`,
        [userId, rewardId]
      );

      if ((existingRows as any[]).length > 0) {
        res.status(400).json({ error: "Recompensa já foi resgatada" });
        return;
      }

      // Verificar se atingiu 100 em apostas
      const [betRows] = await pool.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(ABS(amount)), 0) as totalBet
         FROM transactions
         WHERE user_id = ?
         AND payment_method = 'GAME_BET'
         AND status = 'COMPLETED'`,
        [userId]
      );

      const totalBet = Number((betRows as any[])[0]?.totalBet || 0);

      if (totalBet < 100) {
        res.status(400).json({ 
          error: "Você ainda não atingiu R$ 100,00 em apostas",
          totalBet,
          requiredBet: 100
        });
        return;
      }

      // Dar bônus de 30 reais
      const bonusAmount = 30;

      // Criar transação de bônus
      const [transactionResult] = await pool.query(
        `INSERT INTO transactions (
          user_id, request_number, payment_method, amount, status
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          `REWARD_${rewardId}_${Date.now()}`,
          "BONUS",
          bonusAmount,
          "COMPLETED"
        ]
      );

      // Atualizar saldo do usuário
      await pool.query(
        `UPDATE users SET balance = balance + ? WHERE id = ?`,
        [bonusAmount, userId]
      );

      // Registrar recompensa resgatada
      await pool.query(
        `INSERT INTO user_rewards (user_id, reward_id, bonus_amount, redeemed)
         VALUES (?, ?, ?, true)
         ON DUPLICATE KEY UPDATE redeemed = true, bonus_amount = ?`,
        [userId, rewardId, bonusAmount, bonusAmount]
      );

      res.json({
        success: true,
        message: "Recompensa resgatada com sucesso!",
        bonusAmount,
        newBalance: 0 // Será atualizado no frontend
      });
    } else {
      res.status(404).json({ error: "Recompensa não encontrada" });
    }
  } catch (error: any) {
    console.error("Erro ao resgatar recompensa:", error);
    res.status(500).json({ error: "Erro ao resgatar recompensa" });
  }
}
