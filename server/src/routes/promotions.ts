import { Router } from "express";
import {
  listPromotionsController,
  getPromotionController,
  createPromotionController,
  updatePromotionController,
  deletePromotionController
} from "../controllers/promotionsController";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

export const promotionsRouter = Router();

// Rotas públicas (leitura)
promotionsRouter.get("/", asyncHandler(listPromotionsController));
promotionsRouter.get("/:id", asyncHandler(getPromotionController));

// Rotas protegidas (admin)
promotionsRouter.post("/", authenticate, requireAdmin, asyncHandler(createPromotionController));
promotionsRouter.put("/:id", authenticate, requireAdmin, asyncHandler(updatePromotionController));
promotionsRouter.delete("/:id", authenticate, requireAdmin, asyncHandler(deletePromotionController));
