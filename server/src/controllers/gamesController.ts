import { Request, Response } from "express";
import { z } from "zod";
import { createGame, findGameWithProvider, listGames } from "../services/gamesService";
import { playFiversService } from "../services/playfivers-v2";

const gameSchema = z.object({
  providerId: z.number(),
  name: z.string(),
  externalId: z.string(),
  active: z.boolean().default(true)
});

export async function listGamesController(_req: Request, res: Response) {
  const games = await listGames();
  res.json(games);
}

export async function createGameController(req: Request, res: Response) {
  const parsed = gameSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const game = await createGame(parsed.data);
  res.status(201).json(game);
}

export async function syncGamePlayfiversController(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const game = await findGameWithProvider(id);
  if (!game) {
    return res.status(404).json({ message: "Jogo não encontrado" });
  }

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
}

