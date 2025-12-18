import { pool } from "../config/database";

export type Banner = {
  id: number;
  title: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  position: number;
  active: boolean;
};

export async function listBanners(): Promise<Banner[]> {
  const [rows] = await pool.query(
    "SELECT id, title, image_url as imageUrl, link_url as linkUrl, position, active FROM banners ORDER BY position ASC, id DESC"
  );
  return rows as Banner[];
}

export async function createBanner(data: {
  title?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  position?: number;
  active: boolean;
}): Promise<Banner> {
  const [result] = await pool.query(
    "INSERT INTO banners (title, image_url, link_url, position, active) VALUES (?, ?, ?, ?, ?)",
    [data.title ?? null, data.imageUrl ?? null, data.linkUrl ?? null, data.position ?? 0, data.active]
  );
  const [rows] = await pool.query(
    "SELECT id, title, image_url as imageUrl, link_url as linkUrl, position, active FROM banners WHERE id = ?",
    [(result as any).insertId]
  );
  return (rows as Banner[])[0];
}

export async function updateBanner(
  id: number,
  data: Partial<{ title: string | null; imageUrl: string | null; linkUrl: string | null; position: number; active: boolean }>
): Promise<Banner | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    values.push(data.title);
  }
  if (data.imageUrl !== undefined) {
    fields.push("image_url = ?");
    values.push(data.imageUrl);
  }
  if (data.linkUrl !== undefined) {
    fields.push("link_url = ?");
    values.push(data.linkUrl);
  }
  if (data.position !== undefined) {
    fields.push("position = ?");
    values.push(data.position);
  }
  if (data.active !== undefined) {
    fields.push("active = ?");
    values.push(data.active);
  }

  if (!fields.length) {
    throw new Error("Nada para atualizar");
  }

  values.push(id);
  const [result] = await pool.query(`UPDATE banners SET ${fields.join(", ")} WHERE id = ?`, values);
  if ((result as any).affectedRows === 0) return null;

  const [rows] = await pool.query(
    "SELECT id, title, image_url as imageUrl, link_url as linkUrl, position, active FROM banners WHERE id = ?",
    [id]
  );
  return (rows as Banner[])[0];
}

export async function deleteBanner(id: number): Promise<boolean> {
  const [result] = await pool.query("DELETE FROM banners WHERE id = ?", [id]);
  return (result as any).affectedRows > 0;
}



