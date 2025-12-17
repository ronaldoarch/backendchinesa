import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import { getRewardStatusController, redeemRewardController } from "../controllers/rewardsController";

export const rewardsRouter = Router();

// Todas as rotas de recompensas requerem autenticação
rewardsRouter.use(authenticate);

rewardsRouter.get("/status/:rewardId", asyncHandler(getRewardStatusController));
rewardsRouter.post("/redeem", asyncHandler(redeemRewardController));
