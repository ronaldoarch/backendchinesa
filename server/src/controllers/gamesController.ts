import { Request, Response } from "express";
import { z } from "zod";
import { createGame, findGameWithProvider, listGames, updateGame } from "../services/gamesService";
import { playFiversService } from "../services/playfivers-v2";

const gameSchema = z.object({
  providerId: z.number(),
  name: z.string(),
  externalId: z.string(),
  imageUrl: z.string().nullable().optional(),
  active: z.boolean().default(true)
});

export async function listGamesController(_req: Request, res: Response): Promise<void> {
  try {
    const games = await listGames();
    res.json(games);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("❌ Erro ao listar jogos:", error);
    // eslint-disable-next-line no-console
    console.error("Stack:", error.stack);
    res.status(500).json({ 
      error: error.message || "Erro ao listar jogos",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
}

export async function createGameController(req: Request, res: Response): Promise<void> {
  const parsed = gameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(parsed.error.flatten());
    return;
  }

  const game = await createGame(parsed.data);
  res.status(201).json(game);
}

export async function updateGameController(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const { name, externalId, imageUrl, active } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = String(name).trim();
  if (externalId !== undefined) updateData.externalId = String(externalId).trim();
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl ? String(imageUrl).trim() : null;
  if (active !== undefined) updateData.active = Boolean(active);

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ error: "Nenhum campo para atualizar" });
    return;
  }

  try {
    const game = await updateGame(id, updateData);
    if (!game) {
      res.status(404).json({ error: "Jogo não encontrado" });
      return;
    }
    res.json(game);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao atualizar jogo:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function syncGamePlayfiversController(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  const game = await findGameWithProvider(id);
  if (!game) {
    res.status(404).json({ message: "Jogo não encontrado" });
    return;
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

export async function launchGameController(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  // Obter userId do token se autenticado (opcional)
  const userId = (req as any).user?.id;

  const game = await findGameWithProvider(id);
  if (!game) {
    res.status(404).json({ error: "Jogo não encontrado" });
    return;
  }

  if (!game.externalId || !game.providerExternalId) {
    res.status(400).json({ error: "Jogo não possui externalId ou providerExternalId configurado" });
    return;
  }

  try {
    const result = await playFiversService.launchGame(
      game.providerExternalId,
      game.externalId,
      userId
    );

    if (!result.success || !result.data?.url) {
      res.status(500).json({
        error: result.error || "Erro ao lançar jogo",
        message: result.message
      });
      return;
    }

    res.json({ url: result.data.url });
  } catch (error: any) {
    console.error("Erro ao lançar jogo:", error);
    res.status(500).json({
      error: error.message || "Erro ao lançar jogo"
    });
  }
}



