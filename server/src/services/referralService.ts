import { pool } from "../config/database";
import crypto from "crypto";

/**
 * Gera um código único de referência para o usuário
 */
export async function generateReferralCode(userId: number): Promise<string> {
  // Tentar usar username ou ID como base
  const [userRows] = await pool.query<any[]>(
    "SELECT username FROM users WHERE id = ?",
    [userId]
  );
  
  const username = userRows?.[0]?.username || userId.toString();
  
  // Gerar código baseado no username (máx 8 caracteres) + números aleatórios
  const base = username.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6);
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  let code = `${base}${random}`.substring(0, 8);
  
  // Garantir que o código seja único
  let attempts = 0;
  while (attempts < 10) {
    const [existing] = await pool.query<any[]>(
      "SELECT id FROM users WHERE referral_code = ?",
      [code]
    );
    
    if (!existing || existing.length === 0) {
      // Código único encontrado
      await pool.query(
        "UPDATE users SET referral_code = ? WHERE id = ?",
        [code, userId]
      );
      return code;
    }
    
    // Gerar novo código
    code = crypto.randomBytes(4).toString("hex").toUpperCase().substring(0, 8);
    attempts++;
  }
  
  // Fallback: usar ID + hash
  code = `REF${userId}${crypto.randomBytes(2).toString("hex").toUpperCase()}`.substring(0, 8);
  await pool.query(
    "UPDATE users SET referral_code = ? WHERE id = ?",
    [code, userId]
  );
  return code;
}

/**
 * Obtém ou gera o código de referência do usuário
 */
export async function getOrCreateReferralCode(userId: number): Promise<string> {
  const [rows] = await pool.query<any[]>(
    "SELECT referral_code FROM users WHERE id = ?",
    [userId]
  );
  
  if (rows?.[0]?.referral_code) {
    return rows[0].referral_code;
  }
  
  return generateReferralCode(userId);
}

/**
 * Obtém o link de indicação do usuário
 */
export async function getReferralLink(userId: number, baseUrl: string): Promise<string> {
  const code = await getOrCreateReferralCode(userId);
  return `${baseUrl}?ref=${code}`;
}

/**
 * Registra uma referência quando um novo usuário se cadastra
 */
export async function registerReferral(referredUserId: number, referralCode: string): Promise<boolean> {
  try {
    // Buscar usuário que fez a indicação
    const [referrerRows] = await pool.query<any[]>(
      "SELECT id FROM users WHERE referral_code = ?",
      [referralCode.toUpperCase()]
    );
    
    if (!referrerRows || referrerRows.length === 0) {
      return false;
    }
    
    const referrerId = referrerRows[0].id;
    
    // Atualizar referred_by do novo usuário
    await pool.query(
      "UPDATE users SET referred_by = ? WHERE id = ?",
      [referrerId, referredUserId]
    );
    
    // Criar registro de tracking de apostas (se não existir)
    const [existing] = await pool.query<any[]>(
      `SELECT id FROM referral_bets 
       WHERE referred_user_id = ? AND referrer_user_id = ?`,
      [referredUserId, referrerId]
    );
    
    if (!existing || existing.length === 0) {
      await pool.query(
        `INSERT INTO referral_bets (referred_user_id, referrer_user_id, bet_amount, total_bet_amount, bonus_credited)
         VALUES (?, ?, 0, 0, false)`,
        [referredUserId, referrerId]
      );
    }
    
    console.log(`✅ [REFERRAL] Referência registrada: usuário ${referredUserId} foi indicado por ${referrerId}`);
    return true;
  } catch (error: any) {
    console.error("❌ [REFERRAL] Erro ao registrar referência:", error.message);
    return false;
  }
}

/**
 * Registra uma aposta do usuário indicado e verifica se atingiu R$ 100
 */
export async function trackReferralBet(referredUserId: number, betAmount: number): Promise<void> {
  try {
    // Buscar quem indicou este usuário
    const [userRows] = await pool.query<any[]>(
      "SELECT referred_by FROM users WHERE id = ? AND referred_by IS NOT NULL",
      [referredUserId]
    );
    
    if (!userRows || userRows.length === 0 || !userRows[0].referred_by) {
      return; // Usuário não foi indicado por ninguém
    }
    
    const referrerId = userRows[0].referred_by;
    
    // Buscar ou criar registro de tracking
    const [betRows] = await pool.query<any[]>(
      `SELECT id, total_bet_amount, bonus_credited 
       FROM referral_bets 
       WHERE referred_user_id = ? AND referrer_user_id = ?`,
      [referredUserId, referrerId]
    );
    
    let totalBetAmount = betAmount;
    let bonusCredited = false;
    
    if (betRows && betRows.length > 0) {
      totalBetAmount = Number(betRows[0].total_bet_amount) + betAmount;
      bonusCredited = Boolean(betRows[0].bonus_credited);
      
      // Atualizar total
      await pool.query(
        `UPDATE referral_bets 
         SET total_bet_amount = ?, bet_amount = ?, updated_at = CURRENT_TIMESTAMP
         WHERE referred_user_id = ? AND referrer_user_id = ?`,
        [totalBetAmount, betAmount, referredUserId, referrerId]
      );
    } else {
      // Criar novo registro
      await pool.query(
        `INSERT INTO referral_bets (referred_user_id, referrer_user_id, bet_amount, total_bet_amount, bonus_credited)
         VALUES (?, ?, ?, ?, false)`,
        [referredUserId, referrerId, betAmount, totalBetAmount]
      );
    }
    
    // Verificar se atingiu R$ 100 e ainda não creditou o bônus
    if (totalBetAmount >= 100 && !bonusCredited) {
      // Creditar bônus de R$ 30
      await pool.query(
        `UPDATE users 
         SET bonus_balance = bonus_balance + 30.00 
         WHERE id = ?`,
        [referrerId]
      );
      
      // Marcar como creditado
      await pool.query(
        `UPDATE referral_bets 
         SET bonus_credited = true 
         WHERE referred_user_id = ? AND referrer_user_id = ?`,
        [referredUserId, referrerId]
      );
      
      console.log(`🎁 [REFERRAL] Bônus de R$ 30 creditado para usuário ${referrerId} (indicado ${referredUserId} atingiu R$ ${totalBetAmount} em apostas)`);
    }
  } catch (error: any) {
    console.error("❌ [REFERRAL] Erro ao rastrear aposta:", error.message);
  }
}

/**
 * Obtém estatísticas de indicação do usuário
 */
export async function getReferralStats(userId: number): Promise<{
  totalReferrals: number;
  totalBonusEarned: number;
  bonusBalance: number;
  referrals: Array<{
    userId: number;
    username: string;
    totalBet: number;
    bonusCredited: boolean;
  }>;
}> {
  const [userRows] = await pool.query<any[]>(
    "SELECT bonus_balance FROM users WHERE id = ?",
    [userId]
  );
  
  const bonusBalance = Number(userRows?.[0]?.bonus_balance || 0);
  
  // Buscar todos os indicados
  const [referralRows] = await pool.query<any[]>(
    `SELECT 
      rb.referred_user_id as userId,
      u.username,
      rb.total_bet_amount as totalBet,
      rb.bonus_credited as bonusCredited
    FROM referral_bets rb
    INNER JOIN users u ON u.id = rb.referred_user_id
    WHERE rb.referrer_user_id = ?`,
    [userId]
  );
  
  const referrals = (referralRows || []).map((row: any) => ({
    userId: row.userId,
    username: row.username,
    totalBet: Number(row.totalBet || 0),
    bonusCredited: Boolean(row.bonusCredited)
  }));
  
  const totalReferrals = referrals.length;
  const totalBonusEarned = referrals.filter(r => r.bonusCredited).length * 30;
  
  return {
    totalReferrals,
    totalBonusEarned,
    bonusBalance,
    referrals
  };
}
