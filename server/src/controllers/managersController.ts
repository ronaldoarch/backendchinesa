import { Request, Response } from "express";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";

/**
 * Listar todos os gerentes
 */
export async function listManagersController(req: Request, res: Response): Promise<void> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, email, phone, created_at as createdAt, user_type as userType
       FROM users 
       WHERE user_type = 'manager'
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (error: any) {
    console.error("Erro ao listar gerentes:", error);
    res.status(500).json({ error: "Erro ao listar gerentes" });
  }
}

/**
 * Criar novo gerente
 */
export async function createManagerController(req: Request, res: Response): Promise<void> {
  const { username, password, email, phone } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username e senha são obrigatórios" });
    return;
  }

  try {
    // Verificar se username já existe
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if ((existing as any[]).length > 0) {
      res.status(400).json({ error: "Username já existe" });
      return;
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário como gerente
    const [result] = await pool.query(
      `INSERT INTO users (username, password_hash, email, phone, user_type, balance)
       VALUES (?, ?, ?, ?, 'manager', 0)`,
      [username, passwordHash, email || null, phone || null]
    );

    const [newManager] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, email, phone, created_at as createdAt, user_type as userType
       FROM users WHERE id = ?`,
      [(result as any).insertId]
    );

    res.status(201).json((newManager as any[])[0]);
  } catch (error: any) {
    console.error("Erro ao criar gerente:", error);
    res.status(500).json({ error: "Erro ao criar gerente" });
  }
}

/**
 * Atualizar gerente
 */
export async function updateManagerController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { email, phone, password } = req.body;

  try {
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET password_hash = ?, email = ?, phone = ? 
         WHERE id = ? AND user_type = 'manager'`,
        [passwordHash, email || null, phone || null, id]
      );
    } else {
      await pool.query(
        `UPDATE users SET email = ?, phone = ? 
         WHERE id = ? AND user_type = 'manager'`,
        [email || null, phone || null, id]
      );
    }

    const [updated] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, email, phone, created_at as createdAt, user_type as userType
       FROM users WHERE id = ?`,
      [id]
    );

    res.json((updated as any[])[0]);
  } catch (error: any) {
    console.error("Erro ao atualizar gerente:", error);
    res.status(500).json({ error: "Erro ao atualizar gerente" });
  }
}

/**
 * Deletar gerente
 */
export async function deleteManagerController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM users WHERE id = ? AND user_type = 'manager'", [id]);
    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar gerente:", error);
    res.status(500).json({ error: "Erro ao deletar gerente" });
  }
}

/**
 * Obter dados do gerente logado
 */
export async function getManagerProfileController(req: Request, res: Response): Promise<void> {
  const userId = (req as any).userId;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, email, phone, balance, created_at as createdAt
       FROM users WHERE id = ? AND user_type = 'manager'`,
      [userId]
    );

    if ((rows as any[]).length === 0) {
      res.status(404).json({ error: "Gerente não encontrado" });
      return;
    }

    res.json((rows as any[])[0]);
  } catch (error: any) {
    console.error("Erro ao obter perfil do gerente:", error);
    res.status(500).json({ error: "Erro ao obter perfil do gerente" });
  }
}
