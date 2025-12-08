import { Router } from "express";
import { listSettingsController, upsertSettingsController } from "../controllers/settingsController";
import { asyncHandler } from "../middleware/asyncHandler";

export const settingsRouter = Router();

settingsRouter.get("/", asyncHandler(listSettingsController));
settingsRouter.put("/", asyncHandler(upsertSettingsController));

