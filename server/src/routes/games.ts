import { Router } from "express";
import {
  createGameController,
  listGamesController,
  syncGamePlayfiversController
} from "../controllers/gamesController";

export const gamesRouter = Router();

gamesRouter.get("/", listGamesController);
gamesRouter.post("/", createGameController);
gamesRouter.post("/:id/sync-playfivers", syncGamePlayfiversController);

