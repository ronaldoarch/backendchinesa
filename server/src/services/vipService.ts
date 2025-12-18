import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export type VipLevel = {
  level: number;
  requiredDeposit: number;
  levelBonus: number;
  weeklyBonus?: number;
  monthlyBonus?: number;
  privileges: {
    dailyWithdrawLimit: string; // "Ilimitado" ou valor
    dailyWithdrawCount: string; // "Ilimitado" ou número
    dailyFeeExemption: number; // número de transações isentas
  };
};

// Configuração dos níveis VIP baseada em depósitos
export const VIP_LEVELS: VipLevel[] = [
  {
    level: 0,
    requiredDeposit: 0,
    levelBonus: 0,
    privileges: {
      dailyWithdrawLimit: "Ilimitado",
      dailyWithdrawCount: "Ilimitado",
      dailyFeeExemption: 0
    }
  },
  {
    level: 1,
    requiredDeposit: 5000,
    levelBonus: 5,
    privileges: {
      dailyWithdrawLimit: "Ilimitado",
      dailyWithdrawCount: "Ilimitado",
      dailyFeeExemption: 0
    }
  },
  {
    level: 2,
    requiredDeposit: 13000,
    levelBonus: 18,
    privileges: {
      dailyWithdrawLimit: "Ilimitado",
      dailyWithdrawCount: "Ilimitado",
      dailyFeeExemption: 0
    }
  },
  {
    level: 3,
    requiredDeposit: 93000,
    levelBonus: 28,
    privileges: {
      dailyWithdrawLimit: "Ilimitado",
      dailyWithdrawCount: "Ilimitado",
      dailyFeeExemption: 0
    }
  },
  {
    level: 4,
    requiredDeposit: 182000, // 93000 + 89000 (soma acumulada)
    levelBonus: 58,
    privileges: {
      dailyWithdrawLimit: "Ilimitado",
      dailyWithdrawCount: "Ilimitado",
      dailyFeeExemption: 0
    }
  },
  {
    level: 5,
    requiredDeposit: 500000,
    levelBonus: 100,
    privileges: {
      dailyWithdrawLimit: "Ilimitado",
      dailyWithdrawCount: "Ilimitado",
      dailyFeeExemption: 0
    }
  },
  {
    level: 6,
    requiredDeposit: 1000000,
    levelBonus: 200,
    privileges: {
      dailyWithdrawLimit: "Ilimitado",
      dailyWithdrawCount: "Ilimitado",
      dailyFeeExemption: 0
    }
  }
];

/**
 * Calcula o nível VIP baseado no total de depósitos
 */
export function calculateVipLevel(totalDeposit: number): number {
  // Ordena os níveis por requiredDeposit em ordem decrescente
  const sortedLevels = [...VIP_LEVELS].sort((a, b) => b.requiredDeposit - a.requiredDeposit);
  
  // Encontra o maior nível que o usuário atingiu
  for (const level of sortedLevels) {
    if (totalDeposit >= level.requiredDeposit) {
      return level.level;
    }
  }
  
  return 0;
}

/**
 * Obtém informações sobre o próximo nível VIP
 */
export function getNextVipLevel(currentLevel: number): VipLevel | null {
  const nextLevel = VIP_LEVELS.find(l => l.level === currentLevel + 1);
  return nextLevel || null;
}

/**
 * Obtém informações sobre um nível VIP específico
 */
export function getVipLevel(level: number): VipLevel | null {
  return VIP_LEVELS.find(l => l.level === level) || null;
}

/**
 * Atualiza o nível VIP do usuário baseado no total de depósitos
 */
export async function updateUserVipLevel(userId: number): Promise<number> {
  try {
    // Buscar total de depósitos do usuário
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT total_deposit_amount FROM users WHERE id = ?`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const totalDeposit = Number(rows[0].total_deposit_amount || 0);
    const newVipLevel = calculateVipLevel(totalDeposit);

    // Atualizar nível VIP no banco
    await pool.query(
      `UPDATE users SET vip_level = ? WHERE id = ?`,
      [newVipLevel, userId]
    );

    return newVipLevel;
  } catch (error) {
    console.error("Erro ao atualizar nível VIP:", error);
    throw error;
  }
}

/**
 * Obtém dados VIP completos do usuário
 */
export async function getUserVipData(userId: number): Promise<{
  currentLevel: number;
  totalDeposit: number;
  nextLevel: VipLevel | null;
  remainingForNext: number;
  levelInfo: VipLevel | null;
}> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT vip_level, total_deposit_amount FROM users WHERE id = ?`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      throw new Error("Usuário não encontrado");
    }

    const currentLevel = Number(rows[0].vip_level || 0);
    const totalDeposit = Number(rows[0].total_deposit_amount || 0);
    const levelInfo = getVipLevel(currentLevel);
    const nextLevel = getNextVipLevel(currentLevel);
    const remainingForNext = nextLevel 
      ? Math.max(0, nextLevel.requiredDeposit - totalDeposit)
      : 0;

    return {
      currentLevel,
      totalDeposit,
      nextLevel,
      remainingForNext,
      levelInfo: levelInfo || VIP_LEVELS[0]
    };
  } catch (error) {
    console.error("Erro ao obter dados VIP:", error);
    throw error;
  }
}

/**
 * Verifica se o usuário pode receber bônus de nível VIP
 */
export async function canClaimLevelBonus(userId: number, level: number): Promise<boolean> {
  try {
    // Verificar se já recebeu o bônus deste nível
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM user_bonuses 
       WHERE user_id = ? AND type = 'vip_level' AND vip_level_required = ?`,
      [userId, level]
    );

    return rows.length === 0;
  } catch (error) {
    console.error("Erro ao verificar bônus de nível:", error);
    return false;
  }
}
