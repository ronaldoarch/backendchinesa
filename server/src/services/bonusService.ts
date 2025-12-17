import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

export type Bonus = {
  id: number;
  name: string;
  type: "first_deposit" | "deposit" | "vip_level" | "custom";
  bonusPercentage: number;
  bonusFixed: number;
  minDeposit: number;
  maxBonus: number | null;
  rolloverMultiplier: number;
  rtpPercentage: number;
  vipLevelRequired: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UserBonus = {
  id: number;
  userId: number;
  bonusId: number;
  transactionId: number;
  bonusAmount: number;
  rolloverRequired: number;
  rolloverCompleted: number;
  status: "active" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
};

export async function listBonuses(): Promise<Bonus[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM bonuses ORDER BY created_at DESC"
  );

  return (rows as any[]).map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    bonusPercentage: Number(row.bonus_percentage || 0),
    bonusFixed: Number(row.bonus_fixed || 0),
    minDeposit: Number(row.min_deposit || 0),
    maxBonus: row.max_bonus ? Number(row.max_bonus) : null,
    rolloverMultiplier: Number(row.rollover_multiplier || 1),
    rtpPercentage: Number(row.rtp_percentage || 96),
    vipLevelRequired: row.vip_level_required ? Number(row.vip_level_required) : null,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export async function createBonus(data: {
  name: string;
  type: "first_deposit" | "deposit" | "vip_level" | "custom";
  bonusPercentage?: number;
  bonusFixed?: number;
  minDeposit?: number;
  maxBonus?: number | null;
  rolloverMultiplier?: number;
  rtpPercentage?: number;
  vipLevelRequired?: number | null;
  active?: boolean;
}): Promise<Bonus> {
  const [result] = await pool.query(
    `INSERT INTO bonuses (
      name, type, bonus_percentage, bonus_fixed, min_deposit, max_bonus,
      rollover_multiplier, rtp_percentage, vip_level_required, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.type,
      data.bonusPercentage || 0,
      data.bonusFixed || 0,
      data.minDeposit || 0,
      data.maxBonus || null,
      data.rolloverMultiplier || 1,
      data.rtpPercentage || 96,
      data.vipLevelRequired || null,
      data.active !== false
    ]
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM bonuses WHERE id = ?",
    [(result as any).insertId]
  );

  const row = (rows as any[])[0];
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    bonusPercentage: Number(row.bonus_percentage || 0),
    bonusFixed: Number(row.bonus_fixed || 0),
    minDeposit: Number(row.min_deposit || 0),
    maxBonus: row.max_bonus ? Number(row.max_bonus) : null,
    rolloverMultiplier: Number(row.rollover_multiplier || 1),
    rtpPercentage: Number(row.rtp_percentage || 96),
    vipLevelRequired: row.vip_level_required ? Number(row.vip_level_required) : null,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function updateBonus(
  id: number,
  data: {
    name?: string;
    type?: "first_deposit" | "deposit" | "vip_level" | "custom";
    bonusPercentage?: number;
    bonusFixed?: number;
    minDeposit?: number;
    maxBonus?: number | null;
    rolloverMultiplier?: number;
    rtpPercentage?: number;
    vipLevelRequired?: number | null;
    active?: boolean;
  }
): Promise<Bonus | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    updates.push("name = ?");
    values.push(data.name);
  }
  if (data.type !== undefined) {
    updates.push("type = ?");
    values.push(data.type);
  }
  if (data.bonusPercentage !== undefined) {
    updates.push("bonus_percentage = ?");
    values.push(data.bonusPercentage);
  }
  if (data.bonusFixed !== undefined) {
    updates.push("bonus_fixed = ?");
    values.push(data.bonusFixed);
  }
  if (data.minDeposit !== undefined) {
    updates.push("min_deposit = ?");
    values.push(data.minDeposit);
  }
  if (data.maxBonus !== undefined) {
    updates.push("max_bonus = ?");
    values.push(data.maxBonus || null);
  }
  if (data.rolloverMultiplier !== undefined) {
    updates.push("rollover_multiplier = ?");
    values.push(data.rolloverMultiplier);
  }
  if (data.rtpPercentage !== undefined) {
    updates.push("rtp_percentage = ?");
    values.push(data.rtpPercentage);
  }
  if (data.vipLevelRequired !== undefined) {
    updates.push("vip_level_required = ?");
    values.push(data.vipLevelRequired || null);
  }
  if (data.active !== undefined) {
    updates.push("active = ?");
    values.push(data.active);
  }

  if (updates.length === 0) {
    throw new Error("Nenhum campo para atualizar");
  }

  values.push(id);

  await pool.query(
    `UPDATE bonuses SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM bonuses WHERE id = ?",
    [id]
  );

  if ((rows as any[]).length === 0) return null;

  const row = (rows as any[])[0];
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    bonusPercentage: Number(row.bonus_percentage || 0),
    bonusFixed: Number(row.bonus_fixed || 0),
    minDeposit: Number(row.min_deposit || 0),
    maxBonus: row.max_bonus ? Number(row.max_bonus) : null,
    rolloverMultiplier: Number(row.rollover_multiplier || 1),
    rtpPercentage: Number(row.rtp_percentage || 96),
    vipLevelRequired: row.vip_level_required ? Number(row.vip_level_required) : null,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function deleteBonus(id: number): Promise<void> {
  await pool.query("DELETE FROM bonuses WHERE id = ?", [id]);
}

/**
 * Aplicar bônus a um depósito
 */
export async function applyBonusToDeposit(
  userId: number,
  transactionId: number,
  depositAmount: number
): Promise<UserBonus | null> {
  // Buscar bônus elegíveis
  const [bonusRows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM bonuses 
     WHERE active = true 
     AND (type = 'deposit' OR type = 'first_deposit')
     AND min_deposit <= ?
     ORDER BY 
       CASE WHEN type = 'first_deposit' THEN 0 ELSE 1 END,
       bonus_percentage DESC
     LIMIT 1`,
    [depositAmount]
  );

  if ((bonusRows as any[]).length === 0) {
    return null;
  }

  const bonus = (bonusRows as any[])[0];

  // Verificar se é primeiro depósito (para tipo first_deposit)
  if (bonus.type === "first_deposit") {
    const [previousDeposits] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count 
       FROM transactions 
       WHERE user_id = ? 
       AND payment_method IN ('PIX', 'CARD', 'BOLETO')
       AND amount > 0
       AND status = 'PAID_OUT'
       AND id != ?`,
      [userId, transactionId]
    );

    if (Number((previousDeposits as any[])[0]?.count || 0) > 0) {
      return null; // Não é primeiro depósito
    }
  }

  // Calcular valor do bônus
  let bonusAmount = 0;
  if (bonus.bonus_percentage > 0) {
    bonusAmount = (depositAmount * Number(bonus.bonus_percentage)) / 100;
  }
  if (bonus.bonus_fixed > 0) {
    bonusAmount += Number(bonus.bonus_fixed);
  }

  // Aplicar limite máximo
  if (bonus.max_bonus && bonusAmount > Number(bonus.max_bonus)) {
    bonusAmount = Number(bonus.max_bonus);
  }

  if (bonusAmount <= 0) {
    return null;
  }

  // Calcular rollover necessário
  const rolloverRequired = (depositAmount + bonusAmount) * Number(bonus.rollover_multiplier || 1);

  // Criar registro de bônus do usuário
  const [result] = await pool.query(
    `INSERT INTO user_bonuses (
      user_id, bonus_id, transaction_id, bonus_amount, rollover_required, rollover_completed, status
    ) VALUES (?, ?, ?, ?, ?, 0, 'active')`,
    [userId, bonus.id, transactionId, bonusAmount, rolloverRequired]
  );

  // Atualizar saldo do usuário
  await pool.query(
    `UPDATE users SET balance = balance + ?, total_bonus_amount = total_bonus_amount + ? WHERE id = ?`,
    [bonusAmount, bonusAmount, userId]
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM user_bonuses WHERE id = ?",
    [(result as any).insertId]
  );

  const row = (rows as any[])[0];
  return {
    id: row.id,
    userId: row.user_id,
    bonusId: row.bonus_id,
    transactionId: row.transaction_id,
    bonusAmount: Number(row.bonus_amount),
    rolloverRequired: Number(row.rollover_required),
    rolloverCompleted: Number(row.rollover_completed),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
