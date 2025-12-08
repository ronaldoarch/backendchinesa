import { Router } from "express";
import {
  createBannerController,
  deleteBannerController,
  listBannersController,
  updateBannerController
} from "../controllers/bannersController";

export const bannersRouter = Router();

bannersRouter.get("/", listBannersController);
bannersRouter.post("/", createBannerController);
bannersRouter.put("/:id", updateBannerController);
bannersRouter.delete("/:id", deleteBannerController);

