import { Router } from "express";
import {
  importGameController,
  importGamesBulkController,
  importProviderController,
  listGamesPlayfiversController,
  listProvidersPlayfiversController,
  testConnectionController
} from "../controllers/playfiversController";
import { asyncHandler } from "../middleware/asyncHandler";

export const playfiversRouter = Router();

playfiversRouter.get("/test-connection", asyncHandler(testConnectionController));
playfiversRouter.get("/providers", asyncHandler(listProvidersPlayfiversController));
playfiversRouter.get("/games", asyncHandler(listGamesPlayfiversController));
playfiversRouter.post("/import-provider", asyncHandler(importProviderController));
playfiversRouter.post("/import-game", asyncHandler(importGameController));
playfiversRouter.post("/import-games-bulk", asyncHandler(importGamesBulkController));

