import { Router } from "express";
import { statsController } from "../controllers/statsController";
import { authenticate, requireAdmin } from "../middleware/auth";

export const statsRouter = Router();

// Dashboard stats (requer admin)
statsRouter.get("/dashboard", authenticate, requireAdmin, statsController.getDashboard);

// Reset dashboard (requer admin)
statsRouter.post("/dashboard/reset", authenticate, requireAdmin, statsController.resetDashboard);
