import { Router } from "express";
import { trackingController } from "../controllers/trackingController";
import { authenticate, requireAdmin } from "../middleware/auth";

export const trackingRouter = Router();

// Todas as rotas requerem autenticação e admin
trackingRouter.use(authenticate, requireAdmin);

trackingRouter.get("/webhooks", trackingController.listWebhooks);
trackingRouter.post("/webhooks", trackingController.createWebhook);
trackingRouter.put("/webhooks/:id", trackingController.updateWebhook);
trackingRouter.delete("/webhooks/:id", trackingController.deleteWebhook);
