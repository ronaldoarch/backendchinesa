import { Router } from "express";
import { registerController, loginController, meController, updateProfileController, updatePasswordController } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/asyncHandler";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(registerController));
authRouter.post("/login", asyncHandler(loginController));
authRouter.get("/me", authenticate, asyncHandler(meController));
authRouter.put("/profile", authenticate, asyncHandler(updateProfileController));
authRouter.put("/password", authenticate, asyncHandler(updatePasswordController));
