import { Router } from "express";
import { listSettingsController, upsertSettingsController } from "../controllers/settingsController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, requireAdmin } from "../middleware/auth";

export const settingsRouter = Router();

// GET público (branding, favicon, logo etc. para home)
settingsRouter.get("/", asyncHandler(listSettingsController));
// PUT protegido (somente admin)
settingsRouter.put("/", authenticate, requireAdmin, asyncHandler(upsertSettingsController));

