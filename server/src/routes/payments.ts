import { Router } from "express";
import {
  createPixPaymentController,
  createCardPaymentController,
  createBoletoPaymentController,
  createWithdrawController,
  webhookController,
  listTransactionsController,
  listAllTransactionsController,
  getTransactionController,
  cancelTransactionController,
  testConnectionController,
  approveWithdrawController,
  rejectWithdrawController
} from "../controllers/paymentsController";
import { getReportsController } from "../controllers/reportsController";
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
paymentsRouter.post("/withdraw", authenticate, asyncHandler(createWithdrawController));
paymentsRouter.get("/transactions", authenticate, asyncHandler(listTransactionsController));
paymentsRouter.get("/admin/transactions", authenticate, requireAdmin, asyncHandler(listAllTransactionsController));
paymentsRouter.get("/transactions/:requestNumber", authenticate, asyncHandler(getTransactionController));
paymentsRouter.post("/transactions/:requestNumber/cancel", authenticate, asyncHandler(cancelTransactionController));
paymentsRouter.post("/admin/withdraws/:id/approve", authenticate, requireAdmin, asyncHandler(approveWithdrawController));
paymentsRouter.post("/admin/withdraws/:id/reject", authenticate, requireAdmin, asyncHandler(rejectWithdrawController));
paymentsRouter.get("/reports", authenticate, asyncHandler(getReportsController));
paymentsRouter.post("/test-connection", authenticate, requireAdmin, asyncHandler(testConnectionController));

// Webhook público (não requer autenticação, mas valida hash)
paymentsRouter.post("/webhook", asyncHandler(webhookController));
