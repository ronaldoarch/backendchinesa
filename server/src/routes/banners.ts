import { Router } from "express";
import {
  createBannerController,
  deleteBannerController,
  listBannersController,
  updateBannerController
} from "../controllers/bannersController";
import { asyncHandler } from "../middleware/asyncHandler";

export const bannersRouter = Router();

bannersRouter.get("/", asyncHandler(listBannersController));
bannersRouter.post("/", asyncHandler(createBannerController));
bannersRouter.put("/:id", asyncHandler(updateBannerController));
bannersRouter.delete("/:id", asyncHandler(deleteBannerController));

