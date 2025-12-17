import { Router } from "express";
import { bonusController } from "../controllers/bonusController";
import { authenticate, requireAdmin } from "../middleware/auth";

export const bonusesRouter = Router();

// Todas as rotas requerem autenticação e admin
bonusesRouter.use(authenticate, requireAdmin);

bonusesRouter.get("/", bonusController.listBonuses);
bonusesRouter.post("/", bonusController.createBonus);
bonusesRouter.put("/:id", bonusController.updateBonus);
bonusesRouter.delete("/:id", bonusController.deleteBonus);
