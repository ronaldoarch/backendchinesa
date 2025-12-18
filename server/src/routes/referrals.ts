import { Router } from "express";
import {
  getReferralLinkController,
  getReferralStatsController,
  trackBetController
} from "../controllers/referralController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

export const referralsRouter = Router();

// Obter link de indicação
referralsRouter.get("/link", authenticate, asyncHandler(getReferralLinkController));

// Obter estatísticas de indicação
referralsRouter.get("/stats", authenticate, asyncHandler(getReferralStatsController));

// Rastrear aposta (pode ser chamado após cada aposta)
referralsRouter.post("/track-bet", authenticate, asyncHandler(trackBetController));
