import { Router } from "express";
import { playFiversService } from "../services/playfivers-v2";
import { pool } from "../db";

export const playfiversRouter = Router();

/**
 * Testar conexão com PlayFivers
 */
playfiversRouter.get("/test-connection", async (_req, res) => {
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
});

/**
 * Buscar provedores disponíveis na PlayFivers
 */
playfiversRouter.get("/providers", async (_req, res) => {
  try {
    const result = await playFiversService.getAvailableProviders();

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao buscar provedores"
    });
  }
});

/**
 * Buscar jogos disponíveis na PlayFivers
 */
playfiversRouter.get("/games", async (req, res) => {
  try {
    const providerId = req.query.provider_id as string | undefined;

    const result = await playFiversService.getAvailableGames(providerId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao buscar jogos"
    });
  }
});

/**
 * Importar provedor da PlayFivers para o banco local
 */
playfiversRouter.post("/import-provider", async (req, res) => {
  try {
    const { providerId, name, externalId } = req.body;

    if (!name || !externalId) {
      return res.status(400).json({
        success: false,
        message: "Nome e ID externo são obrigatórios"
      });
    }

    // Verificar se já existe
    const [existing] = await pool.query(
      "SELECT id FROM providers WHERE external_id = ?",
      [externalId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Provedor já existe no banco de dados"
      });
    }

    // Inserir no banco
    const [result] = await pool.query(
      "INSERT INTO providers (name, external_id, active) VALUES (?, ?, ?)",
      [name, externalId, true]
    );

    const [rows] = await pool.query(
      "SELECT id, name, external_id as externalId, active FROM providers WHERE id = ?",
      [(result as any).insertId]
    );

    res.json({
      success: true,
      data: (rows as any[])[0],
      message: "Provedor importado com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao importar provedor:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao importar provedor"
    });
  }
});

/**
 * Importar jogo da PlayFivers para o banco local
 */
playfiversRouter.post("/import-game", async (req, res) => {
  try {
    const { providerId, name, externalId } = req.body;

    if (!providerId || !name || !externalId) {
      return res.status(400).json({
        success: false,
        message: "Provedor, nome e ID externo são obrigatórios"
      });
    }

    // Verificar se provedor existe
    const [providerRows] = await pool.query(
      "SELECT id FROM providers WHERE id = ?",
      [providerId]
    );

    if (!Array.isArray(providerRows) || providerRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provedor não encontrado"
      });
    }

    // Verificar se jogo já existe
    const [existing] = await pool.query(
      "SELECT id FROM games WHERE external_id = ? AND provider_id = ?",
      [externalId, providerId]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Jogo já existe no banco de dados"
      });
    }

    // Inserir no banco
    const [result] = await pool.query(
      "INSERT INTO games (provider_id, name, external_id, active) VALUES (?, ?, ?, ?)",
      [providerId, name, externalId, true]
    );

    const [rows] = await pool.query(
      `SELECT g.id, g.provider_id as providerId, g.name, g.external_id as externalId, g.active
       FROM games g WHERE g.id = ?`,
      [(result as any).insertId]
    );

    res.json({
      success: true,
      data: (rows as any[])[0],
      message: "Jogo importado com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao importar jogo:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao importar jogo"
    });
  }
});

/**
 * Importar múltiplos jogos de uma vez
 */
playfiversRouter.post("/import-games-bulk", async (req, res) => {
  try {
    const { games } = req.body; // Array de { providerId, name, externalId }

    if (!Array.isArray(games) || games.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Lista de jogos é obrigatória"
      });
    }

    const imported: any[] = [];
    const errors: any[] = [];

    for (const game of games) {
      try {
        const { providerId, name, externalId } = game;

        if (!providerId || !name || !externalId) {
          errors.push({ game, error: "Dados incompletos" });
          continue;
        }

        // Verificar se já existe
        const [existing] = await pool.query(
          "SELECT id FROM games WHERE external_id = ? AND provider_id = ?",
          [externalId, providerId]
        );

        if (Array.isArray(existing) && existing.length > 0) {
          errors.push({ game, error: "Jogo já existe" });
          continue;
        }

        // Inserir
        const [result] = await pool.query(
          "INSERT INTO games (provider_id, name, external_id, active) VALUES (?, ?, ?, ?)",
          [providerId, name, externalId, true]
        );

        const [rows] = await pool.query(
          `SELECT g.id, g.provider_id as providerId, g.name, g.external_id as externalId, g.active
           FROM games g WHERE g.id = ?`,
          [(result as any).insertId]
        );

        imported.push((rows as any[])[0]);
      } catch (error: any) {
        errors.push({ game, error: error.message });
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
    console.error("Erro ao importar jogos em massa:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Erro ao importar jogos"
    });
  }
});

