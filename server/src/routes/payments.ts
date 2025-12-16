import { Router } from "express";
import {
  createPixPaymentController,
  createCardPaymentController,
  createBoletoPaymentController,
  webhookController,
  listTransactionsController,
  getTransactionController,
  cancelTransactionController,
  testConnectionController
} from "../controllers/paymentsController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, requireAdmin } from "../middleware/auth";

export const paymentsRouter = Router();

// Rotas protegidas (requerem autenticação)
paymentsRouter.post("/pix", authenticate, asyncHandler(createPixPaymentController));
paymentsRouter.post("/card", authenticate, asyncHandler(createCardPaymentController));
paymentsRouter.post("/boleto", authenticate, asyncHandler(createBoletoPaymentController));
paymentsRouter.get("/transactions", authenticate, asyncHandler(listTransactionsController));
paymentsRouter.get("/transactions/:requestNumber", authenticate, asyncHandler(getTransactionController));
paymentsRouter.post("/transactions/:requestNumber/cancel", authenticate, asyncHandler(cancelTransactionController));
paymentsRouter.post("/test-connection", authenticate, requireAdmin, asyncHandler(testConnectionController));

// Webhook público (não requer autenticação, mas valida hash)
paymentsRouter.post("/webhook", asyncHandler(webhookController));
