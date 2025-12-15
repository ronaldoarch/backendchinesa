import { Router } from "express";
import {
  createPixPaymentController,
  createCardPaymentController,
  createBoletoPaymentController,
  createPixOutController,
  webhookController,
  xbankaccessWebhookController,
  listTransactionsController,
  getTransactionController,
  cancelTransactionController,
  testConnectionController,
  testXBankAccessConnectionController
} from "../controllers/paymentsController";
import { asyncHandler } from "../middleware/asyncHandler";
import { authenticate, requireAdmin } from "../middleware/auth";

export const paymentsRouter = Router();

// Rotas protegidas (requerem autenticação)
paymentsRouter.post("/pix", authenticate, asyncHandler(createPixPaymentController));
paymentsRouter.post("/pix/out", authenticate, asyncHandler(createPixOutController));
paymentsRouter.post("/card", authenticate, asyncHandler(createCardPaymentController));
paymentsRouter.post("/boleto", authenticate, asyncHandler(createBoletoPaymentController));
paymentsRouter.get("/transactions", authenticate, asyncHandler(listTransactionsController));
paymentsRouter.get("/transactions/:requestNumber", authenticate, asyncHandler(getTransactionController));
paymentsRouter.post("/transactions/:requestNumber/cancel", authenticate, asyncHandler(cancelTransactionController));
paymentsRouter.post("/test-connection", authenticate, requireAdmin, asyncHandler(testConnectionController));
paymentsRouter.post("/test-connection/xbankaccess", authenticate, requireAdmin, asyncHandler(testXBankAccessConnectionController));

// Webhooks públicos (não requerem autenticação)
paymentsRouter.post("/webhook", asyncHandler(webhookController)); // SuitPay
paymentsRouter.post("/webhook/xbankaccess", asyncHandler(xbankaccessWebhookController)); // XBankAccess
