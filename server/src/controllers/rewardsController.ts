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
    if (rewardId === "withdraw_account") {
      // Verificar se já cadastrou chave PIX
      const [userRows] = await pool.query<RowDataPacket[]>(
        "SELECT pix_key FROM users WHERE id = ?",
        [userId]
      );
      
      const hasPixKey = !!(userRows as any[])[0]?.pix_key;
      
      // Verificar se já resgatou esta recompensa
      const [redeemedRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM user_rewards
         WHERE user_id = ? AND reward_id = ? AND redeemed = true`,
        [userId, rewardId]
      );

      const redeemed = (redeemedRows as any[]).length > 0;

      res.json({
        rewardId,
        hasPixKey,
        redeemed,
        canRedeem: hasPixKey && !redeemed
      });
    } else if (rewardId === "treasure_referral") {
      // Buscar estatísticas de indicação
      const { getReferralStats } = await import("../services/referralService");
      const stats = await getReferralStats(userId);
      
      const referralsWithBonus = stats.referrals.filter(r => r.bonusCredited).length;
      
      // Verificar se já resgatou esta recompensa
      const [redeemedRows] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM user_rewards
         WHERE user_id = ? AND reward_id = ? AND redeemed = true`,
        [userId, rewardId]
      );

      const redeemed = (redeemedRows as any[]).length > 0;

      res.json({
        rewardId,
        referralsWithBonus,
        redeemed,
        canRedeem: referralsWithBonus > 0 && !redeemed
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

  const { pixKey } = req.body;

  try {
    if (rewardId === "withdraw_account") {
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

      if (!pixKey || pixKey.trim() === "") {
        res.status(400).json({ error: "Chave PIX não fornecida" });
        return;
      }

      // Atualizar chave PIX do usuário
      await pool.query(
        `UPDATE users SET pix_key = ? WHERE id = ?`,
        [pixKey.trim(), userId]
      );

      // Dar bônus de R$ 1,00 não sacável
      const bonusAmount = 1.00;

      // Atualizar bonus_balance (não sacável)
      await pool.query(
        `UPDATE users SET bonus_balance = bonus_balance + ? WHERE id = ?`,
        [bonusAmount, userId]
      );

      // Registrar recompensa resgatada
      await pool.query(
        `INSERT INTO user_rewards (user_id, reward_id, bonus_amount, redeemed)
         VALUES (?, ?, ?, true)
         ON DUPLICATE KEY UPDATE redeemed = true, bonus_amount = ?`,
        [userId, rewardId, bonusAmount, bonusAmount]
      );

      console.log(`✅ [REWARD] Chave PIX cadastrada e bônus de R$ ${bonusAmount} creditado para usuário ${userId}`);

      res.json({
        success: true,
        message: "Chave PIX cadastrada com sucesso! Você ganhou R$ 1,00 em bônus!",
        bonusAmount,
        pixKey: pixKey.trim()
      });
    } else if (rewardId === "treasure_referral") {
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

      // Buscar estatísticas de indicação
      const { getReferralStats } = await import("../services/referralService");
      const stats = await getReferralStats(userId);
      
      const referralsWithBonus = stats.referrals.filter(r => r.bonusCredited).length;

      if (referralsWithBonus === 0) {
        res.status(400).json({ 
          error: "Você ainda não ganhou nenhum baú. Compartilhe seu link de indicação e ganhe R$ 30 quando alguém se cadastrar e jogar R$ 100!"
        });
        return;
      }

      // O bônus já foi creditado automaticamente quando o indicado jogou R$ 100
      // Apenas marcar como resgatado para mostrar na interface
      await pool.query(
        `INSERT INTO user_rewards (user_id, reward_id, bonus_amount, redeemed)
         VALUES (?, ?, ?, true)
         ON DUPLICATE KEY UPDATE redeemed = true`,
        [userId, rewardId, 30, true]
      );

      res.json({
        success: true,
        message: "Baú confirmado! Você já recebeu R$ 30 em bônus por cada indicado que jogou R$ 100!",
        referralsWithBonus,
        totalBonus: referralsWithBonus * 30
      });
    } else {
      res.status(404).json({ error: "Recompensa não encontrada" });
    }
  } catch (error: any) {
    console.error("Erro ao resgatar recompensa:", error);
    res.status(500).json({ error: "Erro ao resgatar recompensa" });
  }
}
