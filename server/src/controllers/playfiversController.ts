import { Request, Response } from "express";
import { playFiversService } from "../services/playfivers-v2";
import {
  createGameFromPlayfivers,
  createProviderFromPlayfivers,
  gameExists,
  providerExistsByExternalId,
  providerExistsById
} from "../services/playfiversLocalService";

export async function testConnectionController(_req: Request, res: Response): Promise<void> {
  try {
    const result = await playFiversService.testConnection();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao testar conexão"
    });
  }
}

export async function listProvidersPlayfiversController(_req: Request, res: Response): Promise<void> {
  try {
    const result = await playFiversService.getAvailableProviders();
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao buscar provedores"
    });
  }
}

export async function listGamesPlayfiversController(req: Request, res: Response): Promise<void> {
  try {
    const providerId = req.query.provider_id as string | undefined;
    const result = await playFiversService.getAvailableGames(providerId);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao buscar jogos"
    });
  }
}

export async function importProviderController(req: Request, res: Response): Promise<void> {
  try {
    const { name, externalId } = req.body;

    if (!name || !externalId) {
      res.status(400).json({
        success: false,
        message: "Nome e ID externo são obrigatórios"
      });
      return;
    }

    if (await providerExistsByExternalId(externalId)) {
      res.status(400).json({
        success: false,
        message: "Provedor já existe no banco de dados"
      });
      return;
    }

    const provider = await createProviderFromPlayfivers({ name, externalId });

    res.json({
      success: true,
      data: provider,
      message: "Provedor importado com sucesso"
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao importar provedor:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao importar provedor"
    });
  }
}

export async function importGameController(req: Request, res: Response): Promise<void> {
  try {
    const { providerId, name, externalId } = req.body;

    // Validar e converter tipos
    const providerIdNum = Number(providerId);
    const nameStr = String(name || "").trim();
    const externalIdStr = String(externalId || "").trim();

    if (!providerIdNum || isNaN(providerIdNum) || providerIdNum <= 0) {
      res.status(400).json({
        success: false,
        message: "ID do provedor é obrigatório e deve ser um número válido",
        received: { providerId, name: nameStr, externalId: externalIdStr }
      });
      return;
    }

    if (!nameStr) {
      res.status(400).json({
        success: false,
        message: "Nome do jogo é obrigatório",
        received: { providerId: providerIdNum, name, externalId: externalIdStr }
      });
      return;
    }

    if (!externalIdStr) {
      res.status(400).json({
        success: false,
        message: "ID externo do jogo é obrigatório",
        received: { providerId: providerIdNum, name: nameStr, externalId }
      });
      return;
    }

    if (!(await providerExistsById(providerIdNum))) {
      res.status(400).json({
        success: false,
        message: `Provedor com ID ${providerIdNum} não encontrado no banco de dados`
      });
      return;
    }

    if (await gameExists(externalIdStr, providerIdNum)) {
      res.status(400).json({
        success: false,
        message: "Jogo já existe no banco de dados"
      });
      return;
    }

    const game = await createGameFromPlayfivers({
      providerId: providerIdNum,
      name: nameStr,
      externalId: externalIdStr
    });

    res.json({
      success: true,
      data: game,
      message: "Jogo importado com sucesso"
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao importar jogo:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao importar jogo"
    });
  }
}

export async function setCallbackUrlController(req: Request, res: Response): Promise<void> {
  try {
    const { callbackUrl } = req.body;

    if (!callbackUrl) {
      res.status(400).json({
        success: false,
        message: "URL de callback é obrigatória"
      });
      return;
    }

    // Validar se é uma URL válida
    try {
      new URL(callbackUrl);
    } catch {
      res.status(400).json({
        success: false,
        message: "URL de callback inválida"
      });
      return;
    }

    const result = await playFiversService.setCallbackUrl(callbackUrl);
    
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao configurar callback URL:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao configurar callback URL"
    });
  }
}

export async function importGamesBulkController(req: Request, res: Response): Promise<void> {
  try {
    const { games } = req.body;

    if (!Array.isArray(games) || games.length === 0) {
      res.status(400).json({
        success: false,
        message: "Lista de jogos é obrigatória"
      });
      return;
    }

    const imported: any[] = [];
    const errors: any[] = [];

    for (const game of games) {
      try {
        const { providerId, name, externalId } = game;
        
        // Validar e converter tipos
        const providerIdNum = Number(providerId);
        const nameStr = String(name || "").trim();
        const externalIdStr = String(externalId || "").trim();

        if (!providerIdNum || isNaN(providerIdNum) || providerIdNum <= 0) {
          errors.push({ game, error: `ID do provedor inválido: ${providerId}` });
          continue;
        }

        if (!nameStr) {
          errors.push({ game, error: "Nome do jogo está vazio" });
          continue;
        }

        if (!externalIdStr) {
          errors.push({ game, error: "ID externo do jogo está vazio" });
          continue;
        }

        if (!(await providerExistsById(providerIdNum))) {
          errors.push({ game, error: `Provedor com ID ${providerIdNum} não encontrado` });
          continue;
        }

        if (await gameExists(externalIdStr, providerIdNum)) {
          errors.push({ game, error: "Jogo já existe no banco" });
          continue;
        }

        const created = await createGameFromPlayfivers({
          providerId: providerIdNum,
          name: nameStr,
          externalId: externalIdStr
        });
        imported.push(created);
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error("Erro ao importar jogo individual:", error, game);
        errors.push({ game, error: error.message || "Erro desconhecido" });
      }
    }

    res.json({
      success: true,
      data: {
        imported: imported.length,
        errors: errors.length,
        importedGames: imported,
        errorsList: errors
      },
      message: `${imported.length} jogos importados, ${errors.length} erros`
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("Erro ao importar jogos em massa:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao importar jogos"
    });
  }
}



