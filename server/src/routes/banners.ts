import { Router } from "express";
import {
  createBannerController,
  deleteBannerController,
  listBannersController,
  updateBannerController
} from "../controllers/bannersController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, requireAdmin } from "../middleware/auth";

export const bannersRouter = Router();

// GET público (qualquer um pode ver)
bannersRouter.get("/", asyncHandler(listBannersController));

// POST, PUT, DELETE requerem autenticação e admin
bannersRouter.post("/", authenticate, requireAdmin, asyncHandler(createBannerController));
bannersRouter.put("/:id", authenticate, requireAdmin, asyncHandler(updateBannerController));
bannersRouter.delete("/:id", authenticate, requireAdmin, asyncHandler(deleteBannerController));

