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

// Rota de teste pública para verificar se o router está funcionando
paymentsRouter.get("/test", (_req, res) => {
  console.log("✅ [PAYMENTS TEST] Endpoint de teste do payments router chamado");
  res.json({ 
    message: "Payments router está funcionando!",
    timestamp: new Date().toISOString()
  });
});

// Rotas protegidas (requerem autenticação)
paymentsRouter.post("/pix", (req, res, next) => {
  console.log("🔵 [ROUTE] Rota /pix chamada");
  console.log("🔵 [ROUTE] Method:", req.method);
  console.log("🔵 [ROUTE] URL:", req.url);
  console.log("🔵 [ROUTE] Headers:", {
    authorization: req.headers.authorization ? "presente" : "ausente"
  });
  next();
}, authenticate, asyncHandler(createPixPaymentController));
paymentsRouter.post("/card", authenticate, asyncHandler(createCardPaymentController));
paymentsRouter.post("/boleto", authenticate, asyncHandler(createBoletoPaymentController));
paymentsRouter.get("/transactions", authenticate, asyncHandler(listTransactionsController));
paymentsRouter.get("/transactions/:requestNumber", authenticate, asyncHandler(getTransactionController));
paymentsRouter.post("/transactions/:requestNumber/cancel", authenticate, asyncHandler(cancelTransactionController));
paymentsRouter.post("/test-connection", authenticate, requireAdmin, asyncHandler(testConnectionController));

// Webhook público (não requer autenticação, mas valida hash)
paymentsRouter.post("/webhook", asyncHandler(webhookController));
