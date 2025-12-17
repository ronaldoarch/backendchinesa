import { Router } from "express";
import {
  createProviderController,
  deleteProviderController,
  listProvidersController,
  updateProviderController
} from "../controllers/providersController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, requireAdmin } from "../middleware/auth";

export const providersRouter = Router();

// GET público (qualquer um pode ver)
providersRouter.get("/", asyncHandler(listProvidersController));

// POST, PUT, DELETE requerem autenticação e admin
providersRouter.post("/", authenticate, requireAdmin, asyncHandler(createProviderController));
providersRouter.put("/:id", authenticate, requireAdmin, asyncHandler(updateProviderController));
providersRouter.delete("/:id", authenticate, requireAdmin, asyncHandler(deleteProviderController));

