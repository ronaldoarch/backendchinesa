import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { getVipDataController } from "../controllers/vipController";

export const vipRouter = Router();

vipRouter.get("/data", authenticate, getVipDataController);
