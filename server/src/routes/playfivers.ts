import { Router } from "express";
import {
  importGameController,
  importGamesBulkController,
  importProviderController,
  listGamesPlayfiversController,
  listProvidersPlayfiversController,
  testConnectionController
} from "../controllers/playfiversController";

export const playfiversRouter = Router();

playfiversRouter.get("/test-connection", testConnectionController);
playfiversRouter.get("/providers", listProvidersPlayfiversController);
playfiversRouter.get("/games", listGamesPlayfiversController);
playfiversRouter.post("/import-provider", importProviderController);
playfiversRouter.post("/import-game", importGameController);
playfiversRouter.post("/import-games-bulk", importGamesBulkController);

