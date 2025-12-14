import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { env } from "../config/env";

export type User = {
  id: number;
  username: string;
  phone?: string;
  currency: string;
  balance?: number;
  is_admin: boolean;
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
    "SELECT id, username, phone, currency, COALESCE(balance, 0) as balance, is_admin, created_at FROM users WHERE id = ?",
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
    is_admin: Boolean(row.is_admin === 1 || row.is_admin === true)
  } as User;
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
