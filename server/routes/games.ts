import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";
import { playFiversService } from "../services/playfivers-v2";

export const gamesRouter = Router();

const gameSchema = z.object({
  id: z.number().optional(),
  providerId: z.number(),
  name: z.string(),
  externalId: z.string(),
  active: z.boolean().default(true)
});

gamesRouter.get("/", async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT g.id,
            g.name,
            g.external_id as externalId,
            g.active,
            g.provider_id as providerId
       FROM games g
   ORDER BY g.id DESC`
  );
  res.json(rows);
});

gamesRouter.post("/", async (req, res) => {
  const parsed = gameSchema.omit({ id: true }).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const { providerId, name, externalId, active } = parsed.data;

  const [result] = await pool.query(
    `INSERT INTO games (provider_id, name, external_id, active)
     VALUES (?, ?, ?, ?)`,
    [providerId, name, externalId, active]
  );

  const [rows] = await pool.query(
    `SELECT id, provider_id as providerId, name, external_id as externalId, active
     FROM games WHERE id = ?`,
    [(result as any).insertId]
  );

  res.status(201).json((rows as any[])[0]);
});

gamesRouter.post("/:id/sync-playfivers", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

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

  if ((rows as any[]).length === 0) {
    return res.status(404).json({ message: "Jogo não encontrado" });
  }

  const game = (rows as any[])[0] as {
    id: number;
    name: string;
    externalId: string;
    providerExternalId: string;
  };

  try {
    const apiResponse = await playFiversService.registerGame({
      providerExternalId: game.providerExternalId,
      gameExternalId: game.externalId,
      name: game.name
    });

    res.json({ ok: true, apiResponse });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    res.status(500).json({
      ok: false,
      message: "Erro ao sincronizar com a API PlayFivers"
    });
  }
});
