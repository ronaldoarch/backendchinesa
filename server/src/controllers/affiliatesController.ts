import { Request, Response } from "express";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Listar afiliados de um gerente
 */
export async function listAffiliatesController(req: Request, res: Response): Promise<void> {
  const managerId = (req as any).userId;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.id, a.code, a.referral_link as referralLink, 
              a.commission_rate as commissionRate, a.active,
              u.username, u.email, u.created_at as createdAt,
              COUNT(ar.id) as totalReferrals
       FROM affiliates a
       INNER JOIN users u ON a.user_id = u.id
       LEFT JOIN affiliate_referrals ar ON a.id = ar.affiliate_id
       WHERE a.manager_id = ?
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [managerId]
    );
    res.json(rows);
  } catch (error: any) {
    console.error("Erro ao listar afiliados:", error);
    res.status(500).json({ error: "Erro ao listar afiliados" });
  }
}

/**
 * Criar novo afiliado
 */
export async function createAffiliateController(req: Request, res: Response): Promise<void> {
  const managerId = (req as any).userId;
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

    // Gerar código único para o afiliado
    let code: string;
    let codeExists = true;
    while (codeExists) {
      code = crypto.randomBytes(4).toString("hex").toUpperCase();
      const [codeCheck] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM affiliates WHERE code = ?",
        [code]
      );
      codeExists = (codeCheck as any[]).length > 0;
    }

    // Criar usuário como afiliado
    const [userResult] = await pool.query(
      `INSERT INTO users (username, password_hash, email, phone, user_type, balance)
       VALUES (?, ?, ?, ?, 'affiliate', 0)`,
      [username, passwordHash, email || null, phone || null]
    );

    const userId = (userResult as any).insertId;

    // Criar link de referência (baseado na URL do site)
    const baseUrl = process.env.FRONTEND_URL || "https://seudominio.com";
    const referralLink = `${baseUrl}/register?ref=${code}`;

    // Criar afiliado
    const [affiliateResult] = await pool.query(
      `INSERT INTO affiliates (user_id, manager_id, code, referral_link, commission_rate)
       VALUES (?, ?, ?, ?, 5.00)`,
      [userId, managerId, code, referralLink]
    );

    const [newAffiliate] = await pool.query<RowDataPacket[]>(
      `SELECT a.id, a.code, a.referral_link as referralLink, 
              a.commission_rate as commissionRate, a.active,
              u.username, u.email, u.created_at as createdAt
       FROM affiliates a
       INNER JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [(affiliateResult as any).insertId]
    );

    res.status(201).json((newAffiliate as any[])[0]);
  } catch (error: any) {
    console.error("Erro ao criar afiliado:", error);
    res.status(500).json({ error: "Erro ao criar afiliado" });
  }
}

/**
 * Atualizar afiliado
 */
export async function updateAffiliateController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const managerId = (req as any).userId;
  const { email, phone, password, active } = req.body;

  try {
    // Verificar se o afiliado pertence ao gerente
    const [check] = await pool.query<RowDataPacket[]>(
      "SELECT user_id FROM affiliates WHERE id = ? AND manager_id = ?",
      [id, managerId]
    );

    if ((check as any[]).length === 0) {
      res.status(404).json({ error: "Afiliado não encontrado" });
      return;
    }

    const userId = (check as any[])[0].user_id;

    // Atualizar dados do usuário
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET password_hash = ?, email = ?, phone = ? WHERE id = ?`,
        [passwordHash, email || null, phone || null, userId]
      );
    } else {
      await pool.query(
        `UPDATE users SET email = ?, phone = ? WHERE id = ?`,
        [email || null, phone || null, userId]
      );
    }

    // Atualizar status do afiliado
    if (active !== undefined) {
      await pool.query("UPDATE affiliates SET active = ? WHERE id = ?", [active, id]);
    }

    const [updated] = await pool.query<RowDataPacket[]>(
      `SELECT a.id, a.code, a.referral_link as referralLink, 
              a.commission_rate as commissionRate, a.active,
              u.username, u.email, u.created_at as createdAt
       FROM affiliates a
       INNER JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    res.json((updated as any[])[0]);
  } catch (error: any) {
    console.error("Erro ao atualizar afiliado:", error);
    res.status(500).json({ error: "Erro ao atualizar afiliado" });
  }
}

/**
 * Deletar afiliado
 */
export async function deleteAffiliateController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const managerId = (req as any).userId;

  try {
    // Verificar se o afiliado pertence ao gerente
    const [check] = await pool.query<RowDataPacket[]>(
      "SELECT user_id FROM affiliates WHERE id = ? AND manager_id = ?",
      [id, managerId]
    );

    if ((check as any[]).length === 0) {
      res.status(404).json({ error: "Afiliado não encontrado" });
      return;
    }

    const userId = (check as any[])[0].user_id;

    // Deletar usuário (cascade deleta o afiliado)
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    res.status(204).send();
  } catch (error: any) {
    console.error("Erro ao deletar afiliado:", error);
    res.status(500).json({ error: "Erro ao deletar afiliado" });
  }
}
