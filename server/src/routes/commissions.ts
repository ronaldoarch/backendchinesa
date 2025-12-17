import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  calculateCommissionsController,
  listManagerCommissionsController,
  listAffiliateCommissionsController,
  approveCommissionsController,
  trackReferralController,
  processWeeklyCommissionsController
} from "../controllers/commissionsController";

export const commissionsRouter = Router();

// Rastrear referência (usuário autenticado)
commissionsRouter.post("/track-referral", authenticate, asyncHandler(trackReferralController));

// Listar comissões do gerente logado
commissionsRouter.get("/manager", authenticate, asyncHandler(listManagerCommissionsController));

// Listar comissões de um afiliado específico
commissionsRouter.get("/affiliate/:affiliateId", authenticate, asyncHandler(listAffiliateCommissionsController));

// Calcular comissões (admin ou gerente)
commissionsRouter.post("/calculate", authenticate, asyncHandler(calculateCommissionsController));

// Aprovar comissões (apenas segunda-feira) - admin
commissionsRouter.post("/approve", authenticate, requireAdmin, asyncHandler(approveCommissionsController));

// Processar comissões semanais automaticamente (admin)
commissionsRouter.post("/process-weekly", authenticate, requireAdmin, asyncHandler(processWeeklyCommissionsController));
