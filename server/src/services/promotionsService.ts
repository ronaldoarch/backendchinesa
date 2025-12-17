import { pool } from "../config/database";

export type Promotion = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  active: boolean;
  position: number;
  createdAt?: string;
  updatedAt?: string;
};

export async function listPromotions(category?: string): Promise<Promotion[]> {
  let query = `
    SELECT 
      id, 
      title, 
      subtitle, 
      description, 
      category, 
      active, 
      position,
      created_at as createdAt,
      updated_at as updatedAt
    FROM promotions
  `;
  
  const params: unknown[] = [];
  if (category) {
    query += " WHERE category = ?";
    params.push(category);
  }
  
  query += " ORDER BY position ASC, id DESC";
  
  const [rows] = await pool.query(query, params);
  return rows as Promotion[];
}

export async function getPromotion(id: number): Promise<Promotion | null> {
  const [rows] = await pool.query(
    `SELECT 
      id, 
      title, 
      subtitle, 
      description, 
      category, 
      active, 
      position,
      created_at as createdAt,
      updated_at as updatedAt
    FROM promotions WHERE id = ?`,
    [id]
  );
  const promotions = rows as Promotion[];
  return promotions.length > 0 ? promotions[0] : null;
}

export async function createPromotion(data: {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category?: string;
  active?: boolean;
  position?: number;
}): Promise<Promotion> {
  const [result] = await pool.query(
    `INSERT INTO promotions (title, subtitle, description, category, active, position)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.subtitle ?? null,
      data.description ?? null,
      data.category ?? "eventos",
      data.active ?? true,
      data.position ?? 0
    ]
  );
  
  const promotion = await getPromotion((result as any).insertId);
  if (!promotion) {
    throw new Error("Erro ao criar promoção");
  }
  return promotion;
}

export async function updatePromotion(
  id: number,
  data: Partial<{
    title: string;
    subtitle: string | null;
    description: string | null;
    category: string;
    active: boolean;
    position: number;
  }>
): Promise<Promotion | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.subtitle !== undefined) {
    fields.push("subtitle = ?");
    values.push(data.subtitle);
  }
  if (data.description !== undefined) {
    fields.push("description = ?");
    values.push(data.description);
  }
  if (data.category !== undefined) {
    fields.push("category = ?");
    values.push(data.category);
  }
  if (data.active !== undefined) {
    fields.push("active = ?");
    values.push(data.active);
  }
  if (data.position !== undefined) {
    fields.push("position = ?");
    values.push(data.position);
  }

  if (!fields.length) {
    throw new Error("Nada para atualizar");
  }

  values.push(id);
  const [result] = await pool.query(
    `UPDATE promotions SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  
  if ((result as any).affectedRows === 0) return null;
  return getPromotion(id);
}

export async function deletePromotion(id: number): Promise<boolean> {
  const [result] = await pool.query("DELETE FROM promotions WHERE id = ?", [id]);
  return (result as any).affectedRows > 0;
}
