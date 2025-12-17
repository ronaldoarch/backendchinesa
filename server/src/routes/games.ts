import { Router } from "express";
import {
  createGameController,
  listGamesController,
  updateGameController,
  syncGamePlayfiversController,
  launchGameController
} from "../controllers/gamesController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, requireAdmin } from "../middleware/auth";

export const gamesRouter = Router();

// GET público (qualquer um pode ver)
gamesRouter.get("/", asyncHandler(listGamesController));

// POST requer autenticação e admin
gamesRouter.post("/", authenticate, requireAdmin, asyncHandler(createGameController));
gamesRouter.put("/:id", authenticate, requireAdmin, asyncHandler(updateGameController));
gamesRouter.post("/:id/sync-playfivers", authenticate, requireAdmin, asyncHandler(syncGamePlayfiversController));

// Lançar jogo (requer autenticação - usuário logado pode jogar)
gamesRouter.post("/:id/launch", authenticate, asyncHandler(launchGameController));

