import { Router } from "express";
import {
  createProviderController,
  deleteProviderController,
  listProvidersController,
  updateProviderController
} from "../controllers/providersController";
import { asyncHandler } from "../middleware/asyncHandler";

export const providersRouter = Router();

providersRouter.get("/", asyncHandler(listProvidersController));
providersRouter.post("/", asyncHandler(createProviderController));
providersRouter.put("/:id", asyncHandler(updateProviderController));
providersRouter.delete("/:id", asyncHandler(deleteProviderController));

