import { Router } from "express";
import {
  createGameController,
  listGamesController,
  syncGamePlayfiversController
} from "../controllers/gamesController";
import { asyncHandler } from "../middleware/asyncHandler";

export const gamesRouter = Router();

gamesRouter.get("/", asyncHandler(listGamesController));
gamesRouter.post("/", asyncHandler(createGameController));
gamesRouter.post("/:id/sync-playfivers", asyncHandler(syncGamePlayfiversController));

