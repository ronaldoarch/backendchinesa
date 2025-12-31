import { Request, Response } from "express";
import { z } from "zod";
import { createGame, findGameWithProvider, listGames, updateGame } from "../services/gamesService";
import { playFiversService } from "../services/playfivers-v2";
import { findUserById } from "../services/authService";
import { getSettings } from "../services/settingsService";

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

  // Obter informações do usuário (autenticação já validada pelo middleware)
  const authReq = req as any;
  const userId = authReq.userId;
  
  console.log("🎮 [LAUNCH GAME] Usuário tentando lançar jogo:", { userId, gameId: id });
  
  // Buscar dados completos do usuário no banco (incluindo saldo) - SEMPRE buscar do banco para ter o saldo mais atualizado
  const user = await findUserById(userId);
  if (!user) {
    console.error("❌ [LAUNCH GAME] Usuário não encontrado:", userId);
    res.status(404).json({ error: "Usuário não encontrado" });
    return;
  }

  // Buscar saldo DIRETO do banco para garantir que está atualizado
  const { pool } = await import("../config/database");
  const [balanceRows] = await pool.query<any[]>(
    "SELECT balance FROM users WHERE id = ?",
    [userId]
  );
  
  const userBalance = balanceRows && balanceRows.length > 0 
    ? Number(balanceRows[0].balance || 0) 
    : Number(user.balance || 0);
    
  console.log("💰 [LAUNCH GAME] Saldo do usuário (buscado do banco):", { 
    userId, 
    username: user.username, 
    balance: userBalance,
    balanceFromUser: Number(user.balance || 0),
    balanceFromDB: balanceRows && balanceRows.length > 0 ? Number(balanceRows[0].balance || 0) : null
  });
  
  if (userBalance <= 0) {
    console.warn("⚠️ [LAUNCH GAME] Saldo insuficiente:", { userId, balance: userBalance });
    res.status(403).json({ 
      error: "Saldo insuficiente", 
      message: "Você precisa ter saldo para jogar. Faça um depósito primeiro.",
      balance: userBalance
    });
    return;
  }

  // user_code: usar username do usuário
  const userCode = user.username;

  const game = await findGameWithProvider(id);
  if (!game) {
    res.status(404).json({ error: "Jogo não encontrado" });
    return;
  }

  if (!game.externalId || !game.providerName) {
    res.status(400).json({ error: "Jogo não possui externalId ou providerName configurado" });
    return;
  }

  try {
    // Buscar RTP padrão das settings
    let defaultRtp: number | undefined = undefined;
    try {
      const settings = await getSettings();
      const rtpSetting = settings.find(s => s.key === "playfivers.rtp");
      if (rtpSetting && rtpSetting.value) {
        const rtpValue = Number(rtpSetting.value);
        if (!isNaN(rtpValue) && rtpValue >= 0 && rtpValue <= 100) {
          defaultRtp = rtpValue;
          console.log(`📊 [LAUNCH GAME] Usando RTP das settings: ${defaultRtp}%`);
        }
      }
    } catch (error) {
      console.warn("⚠️ [LAUNCH GAME] Erro ao buscar RTP das settings, usando undefined:", error);
    }

    // Conforme documentação: provider deve ser o NOME do provedor, não o código
    const result = await playFiversService.launchGame(
      game.providerName, // Nome do provedor (ex: "PGSOFT", "PRAGMATIC")
      game.externalId,   // game_code
      userCode,          // user_code
      userBalance,       // user_balance (saldo real do usuário)
      true,              // game_original (assumindo true por padrão)
      "pt",              // lang (português)
      defaultRtp         // user_rtp (usar RTP das settings se disponível)
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
    console.error("❌ [LAUNCH GAME] Erro ao lançar jogo:", error);
    console.error("❌ [LAUNCH GAME] Stack:", error.stack);
    
    // Filtrar mensagens de erro que não são relevantes para o usuário
    let errorMessage = error.message || "Erro ao lançar jogo";
    
    // Se o erro for relacionado ao SuitPay, não mostrar (não é relevante para jogos)
    if (errorMessage.includes("suitpay") || errorMessage.includes("SuitPay") || errorMessage.includes("w.suitpay.app")) {
      errorMessage = "Erro ao conectar com o servidor de jogos. Tente novamente.";
    }
    
    // Se o erro for de conexão genérica, dar mensagem mais amigável
    if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("ECONNREFUSED")) {
      errorMessage = "Erro ao conectar com o servidor de jogos. Verifique sua conexão.";
    }
    
    res.status(500).json({
      error: errorMessage,
      message: "Não foi possível lançar o jogo. Tente novamente mais tarde."
    });
  }
}



