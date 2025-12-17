import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  listManagersController,
  createManagerController,
  updateManagerController,
  deleteManagerController,
  getManagerProfileController
} from "../controllers/managersController";

export const managersRouter = Router();

// Rotas administrativas (apenas admin)
managersRouter.get("/", authenticate, requireAdmin, asyncHandler(listManagersController));
managersRouter.post("/", authenticate, requireAdmin, asyncHandler(createManagerController));
managersRouter.put("/:id", authenticate, requireAdmin, asyncHandler(updateManagerController));
managersRouter.delete("/:id", authenticate, requireAdmin, asyncHandler(deleteManagerController));

// Rota para gerente acessar seu próprio perfil
managersRouter.get("/profile", authenticate, asyncHandler(getManagerProfileController));
