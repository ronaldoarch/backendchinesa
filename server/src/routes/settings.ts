import { Router } from "express";
import { listSettingsController, upsertSettingsController } from "../controllers/settingsController";

export const settingsRouter = Router();

settingsRouter.get("/", listSettingsController);
settingsRouter.put("/", upsertSettingsController);

