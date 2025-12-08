import { Router } from "express";
import {
  createProviderController,
  deleteProviderController,
  listProvidersController,
  updateProviderController
} from "../controllers/providersController";

export const providersRouter = Router();

providersRouter.get("/", listProvidersController);
providersRouter.post("/", createProviderController);
providersRouter.put("/:id", updateProviderController);
providersRouter.delete("/:id", deleteProviderController);

