import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { env } from "../config/env";

export type User = {
  id: number;
  username: string;
  phone?: string;
  email?: string;
  document?: string;
  currency: string;
  balance?: number;
  bonus_balance?: number;
  total_deposit_amount?: number;
  vip_level?: number;
  pix_key?: string | null;
  is_admin: boolean;
  user_type?: string;
  created_at: Date;
};

export type UserWithPassword = User & {
  password_hash: string;
};

export async function createUser(
  username: string,
  password: string,
  phone?: string,
  currency: string = "BRL"
): Promise<User> {
  console.log("📝 [CREATE_USER] Iniciando criação de usuário:", { username, phone, currency });
  
  const passwordHash = await bcrypt.hash(password, 10);
  console.log("🔐 [CREATE_USER] Senha criptografada");
  
  try {
    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, phone, currency) 
       VALUES (?, ?, ?, ?)`,
      [username, passwordHash, phone || null, currency]
    );

    const insertResult = result as { insertId: number };
    console.log("✅ [CREATE_USER] Usuário inserido no banco, ID:", insertResult.insertId);
    
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, username, phone, currency, is_admin, created_at FROM users WHERE id = ?",
      [insertResult.insertId]
    );

    if (!rows || rows.length === 0) {
      console.error("❌ [CREATE_USER] Usuário não encontrado após inserção!");
      throw new Error("Usuário não encontrado após criação");
    }

    const row = rows[0];
    console.log("✅ [CREATE_USER] Usuário criado com sucesso:", {
      id: row.id,
      username: row.username,
      created_at: row.created_at
    });
    
    // Garantir que is_admin seja boolean (MySQL pode retornar 0/1)
    return {
      ...row,
      is_admin: Boolean(row.is_admin === 1 || row.is_admin === true)
    } as User;
  } catch (error: any) {
    console.error("❌ [CREATE_USER] Erro ao criar usuário:", {
      error: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    throw error;
  }
}

export async function findUserByUsername(username: string): Promise<UserWithPassword | null> {
  console.log("🔍 [FIND_USER] Buscando usuário:", username);
  
  try {
    // Verificar qual banco está sendo usado
    const [dbInfo] = await pool.query<RowDataPacket[]>("SELECT DATABASE() as db");
    console.log("🔍 [FIND_USER] Banco de dados atual:", dbInfo[0]?.db);
    
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, username, password_hash, phone, currency, is_admin, created_at FROM users WHERE username = ?",
      [username]
    );

    console.log("🔍 [FIND_USER] Resultado da busca:", {
      username,
      encontrados: rows.length,
      ids: rows.map((r: any) => r.id)
    });

    if (rows.length === 0) {
      console.log("✅ [FIND_USER] Usuário não encontrado:", username);
      return null;
    }

    const row = rows[0];
    console.log("⚠️ [FIND_USER] Usuário encontrado:", {
      id: row.id,
      username: row.username,
      created_at: row.created_at
    });
    
    // Garantir que is_admin seja boolean (MySQL pode retornar 0/1)
    return {
      ...row,
      is_admin: Boolean(row.is_admin === 1 || row.is_admin === true)
    } as UserWithPassword;
  } catch (error: any) {
    console.error("❌ [FIND_USER] Erro ao buscar usuário:", {
      username,
      error: error.message,
      code: error.code
    });
    throw error;
  }
}

export async function findUserById(id: number): Promise<User | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, phone, email, document, currency, 
              COALESCE(balance, 0) as balance, 
              COALESCE(bonus_balance, 0) as bonus_balance, 
              COALESCE(total_deposit_amount, 0) as total_deposit_amount,
              COALESCE(vip_level, 0) as vip_level,
              pix_key, is_admin, COALESCE(user_type, 'user') as user_type, created_at 
       FROM users WHERE id = ?`,
      [id]
    );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  // Garantir que is_admin seja boolean (MySQL pode retornar 0/1)
    return {
      ...row,
      balance: Number(row.balance || 0),
      bonus_balance: Number(row.bonus_balance || 0),
      pix_key: row.pix_key || null,
      is_admin: Boolean(row.is_admin === 1 || row.is_admin === true),
      user_type: row.user_type || "user"
    } as User;
}

export async function updateUserProfile(
  userId: number,
  data: { phone?: string; email?: string; document?: string }
): Promise<User | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.phone !== undefined) {
    fields.push("phone = ?");
    values.push(data.phone || null);
  }
  if (data.email !== undefined) {
    fields.push("email = ?");
    values.push(data.email || null);
  }
  if (data.document !== undefined) {
    fields.push("document = ?");
    values.push(data.document || null);
  }

  if (fields.length === 0) {
    throw new Error("Nenhum campo para atualizar");
  }

  values.push(userId);

  await pool.query(
    `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    values
  );

  return findUserById(userId);
}

export async function updateUserPassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT password_hash FROM users WHERE id = ?",
    [userId]
  );

  if (rows.length === 0) {
    throw new Error("Usuário não encontrado");
  }

  const user = rows[0];
  const isValidPassword = await verifyPassword(currentPassword, user.password_hash);

  if (!isValidPassword) {
    return false;
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  await pool.query(
    "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [newPasswordHash, userId]
  );

  return true;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, username: user.username, is_admin: user.is_admin },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): { id: number; username: string; is_admin: boolean } | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: number; username: string; is_admin: boolean };
    return decoded;
  } catch {
    return null;
  }
}
