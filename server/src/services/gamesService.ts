import { pool } from "../config/database";

export type Game = {
  id: number;
  providerId: number;
  name: string;
  externalId: string;
  active: boolean;
};

export async function listGames(): Promise<Game[]> {
  const [rows] = await pool.query(
    `SELECT g.id,
            g.provider_id as providerId,
            g.name,
            g.external_id as externalId,
            g.active
       FROM games g
   ORDER BY g.id DESC`
  );
  return rows as Game[];
}

export async function createGame(data: {
  providerId: number;
  name: string;
  externalId: string;
  active: boolean;
}): Promise<Game> {
  const [result] = await pool.query(
    `INSERT INTO games (provider_id, name, external_id, active)
     VALUES (?, ?, ?, ?)`,
    [data.providerId, data.name, data.externalId, data.active]
  );

  const [rows] = await pool.query(
    `SELECT id, provider_id as providerId, name, external_id as externalId, active
     FROM games WHERE id = ?`,
    [(result as any).insertId]
  );

  return (rows as Game[])[0];
}

export async function findGameWithProvider(id: number) {
  const [rows] = await pool.query(
    `SELECT g.id,
            g.name,
            g.external_id as externalId,
            p.external_id as providerExternalId
       FROM games g
       JOIN providers p ON p.id = g.provider_id
      WHERE g.id = ?`,
    [id]
  );
  return (rows as any[])[0] as
    | {
        id: number;
        name: string;
        externalId: string;
        providerExternalId: string;
      }
    | undefined;
}

