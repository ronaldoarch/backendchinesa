import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  listAffiliatesController,
  createAffiliateController,
  updateAffiliateController,
  deleteAffiliateController
} from "../controllers/affiliatesController";

export const affiliatesRouter = Router();

// Todas as rotas requerem autenticação (gerente logado)
affiliatesRouter.use(authenticate);

affiliatesRouter.get("/", asyncHandler(listAffiliatesController));
affiliatesRouter.post("/", asyncHandler(createAffiliateController));
affiliatesRouter.put("/:id", asyncHandler(updateAffiliateController));
affiliatesRouter.delete("/:id", asyncHandler(deleteAffiliateController));
