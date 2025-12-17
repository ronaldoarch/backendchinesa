import { pool } from "../config/database";

export type Game = {
  id: number;
  providerId: number;
  name: string;
  externalId: string;
  imageUrl: string | null;
  active: boolean;
};

export async function listGames(): Promise<Game[]> {
  try {
    const [rows] = await pool.query(
      `SELECT g.id,
              g.provider_id as providerId,
              g.name,
              g.external_id as externalId,
              COALESCE(g.image_url, NULL) as imageUrl,
              g.active
         FROM games g
     ORDER BY g.id DESC`
    );
    return rows as Game[];
  } catch (error: any) {
    // Se a coluna image_url não existir, tentar sem ela
    if (error.code === "ER_BAD_FIELD_ERROR" && (error.message?.includes("image_url") || error.sqlMessage?.includes("image_url"))) {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Coluna image_url não existe, buscando sem ela. Execute a migração do banco de dados.");
      try {
  const [rows] = await pool.query(
    `SELECT g.id,
            g.provider_id as providerId,
            g.name,
            g.external_id as externalId,
                  NULL as imageUrl,
            g.active
       FROM games g
   ORDER BY g.id DESC`
  );
  return rows as Game[];
      } catch (fallbackError: any) {
        // eslint-disable-next-line no-console
        console.error("❌ Erro ao buscar jogos (fallback):", fallbackError);
        throw fallbackError;
      }
    }
    // eslint-disable-next-line no-console
    console.error("❌ Erro ao buscar jogos:", error);
    throw error;
  }
}

export async function createGame(data: {
  providerId: number;
  name: string;
  externalId: string;
  imageUrl?: string | null;
  active: boolean;
}): Promise<Game> {
  const [result] = await pool.query(
    `INSERT INTO games (provider_id, name, external_id, image_url, active)
     VALUES (?, ?, ?, ?, ?)`,
    [data.providerId, data.name, data.externalId, data.imageUrl || null, data.active]
  );

  const [rows] = await pool.query(
    `SELECT id, provider_id as providerId, name, external_id as externalId, image_url as imageUrl, active
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
            g.image_url as imageUrl,
            p.external_id as providerExternalId,
            p.name as providerName
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
        imageUrl: string | null;
        providerExternalId: string;
        providerName: string;
      }
    | undefined;
}

export async function updateGame(
  id: number,
  data: Partial<{
    name: string;
    externalId: string;
    imageUrl: string | null;
    active: boolean;
  }>
): Promise<Game | null> {
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
  if (data.imageUrl !== undefined) {
    fields.push("image_url = ?");
    values.push(data.imageUrl);
  }
  if (data.active !== undefined) {
    fields.push("active = ?");
    values.push(data.active);
  }

  if (!fields.length) {
    throw new Error("Nada para atualizar");
  }

  values.push(id);
  const [result] = await pool.query(
    `UPDATE games SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
  
  if ((result as any).affectedRows === 0) return null;

  const [rows] = await pool.query(
    `SELECT id, provider_id as providerId, name, external_id as externalId, image_url as imageUrl, active
     FROM games WHERE id = ?`,
    [id]
  );
  return (rows as Game[])[0];
}



