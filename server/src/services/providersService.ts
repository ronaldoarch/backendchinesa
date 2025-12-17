import { pool } from "../config/database";

export type Provider = {
  id: number;
  name: string;
  externalId: string | null;
  active: boolean;
};

export async function listProviders(): Promise<Provider[]> {
  const [rows] = await pool.query(
    "SELECT id, name, external_id as externalId, active FROM providers ORDER BY id DESC"
  );
  return rows as Provider[];
}

export async function createProvider(data: {
  name: string;
  externalId?: string | null;
  active: boolean;
}): Promise<Provider> {
  const [result] = await pool.query(
    "INSERT INTO providers (name, external_id, active) VALUES (?, ?, ?)",
    [data.name, data.externalId ?? null, data.active]
  );

  const [rows] = await pool.query(
    "SELECT id, name, external_id as externalId, active FROM providers WHERE id = ?",
    [(result as any).insertId]
  );

  return (rows as Provider[])[0];
}

export async function updateProvider(
  id: number,
  data: Partial<{ name: string; externalId: string | null; active: boolean }>
): Promise<Provider | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.externalId !== undefined) {
    fields.push("external_id = ?");
    values.push(data.externalId);
  }
  if (data.active !== undefined) {
    fields.push("active = ?");
    values.push(data.active);
  }

  if (fields.length === 0) {
    throw new Error("Nada para atualizar");
  }

  values.push(id);
  const query = `UPDATE providers SET ${fields.join(", ")} WHERE id = ?`;
  const [result] = await pool.query(query, values);

  if ((result as any).affectedRows === 0) {
    return null;
  }

  const [rows] = await pool.query(
    "SELECT id, name, external_id as externalId, active FROM providers WHERE id = ?",
    [id]
  );

  return (rows as Provider[])[0];
}

export async function deleteProvider(id: number): Promise<boolean> {
  const [result] = await pool.query("DELETE FROM providers WHERE id = ?", [id]);
  return (result as any).affectedRows > 0;
}







