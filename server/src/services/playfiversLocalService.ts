import { pool } from "../config/database";

export async function providerExistsByExternalId(externalId: string) {
  const [rows] = await pool.query("SELECT id FROM providers WHERE external_id = ?", [externalId]);
  return Array.isArray(rows) && rows.length > 0;
}

export async function createProviderFromPlayfivers(data: {
  name: string;
  externalId: string;
}) {
  const [result] = await pool.query(
    "INSERT INTO providers (name, external_id, active) VALUES (?, ?, ?)",
    [data.name, data.externalId, true]
  );
  const [rows] = await pool.query(
    "SELECT id, name, external_id as externalId, active FROM providers WHERE id = ?",
    [(result as any).insertId]
  );
  return (rows as any[])[0];
}

export async function providerExistsById(providerId: number) {
  const [rows] = await pool.query("SELECT id FROM providers WHERE id = ?", [providerId]);
  return Array.isArray(rows) && rows.length > 0;
}

export async function gameExists(externalId: string, providerId: number) {
  const [rows] = await pool.query(
    "SELECT id FROM games WHERE external_id = ? AND provider_id = ?",
    [externalId, providerId]
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function createGameFromPlayfivers(data: {
  providerId: number;
  name: string;
  externalId: string;
}) {
  const [result] = await pool.query(
    "INSERT INTO games (provider_id, name, external_id, active) VALUES (?, ?, ?, ?)",
    [data.providerId, data.name, data.externalId, true]
  );

  const [rows] = await pool.query(
    `SELECT g.id, g.provider_id as providerId, g.name, g.external_id as externalId, g.active
       FROM games g WHERE g.id = ?`,
    [(result as any).insertId]
  );

  return (rows as any[])[0];
}

