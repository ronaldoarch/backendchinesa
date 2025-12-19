import { Router } from "express";
import { providersRouter } from "./providers";
import { gamesRouter } from "./games";
import { bannersRouter } from "./banners";
import { settingsRouter } from "./settings";
import { uploadsRouter } from "./uploads";
import { playfiversRouter } from "./playfivers";
import { authRouter } from "./auth";
import { promotionsRouter } from "./promotions";
import { paymentsRouter } from "./payments";
import { statsRouter } from "./stats";
import { trackingRouter } from "./tracking";
import { bonusesRouter } from "./bonuses";
import { rewardsRouter } from "./rewards";
import { managersRouter } from "./managers";
import { affiliatesRouter } from "./affiliates";
import { commissionsRouter } from "./commissions";
import { referralsRouter } from "./referrals";
import { vipRouter } from "./vip";
import { authenticate, requireAdmin } from "../middleware/auth";
import { playfiversCallbackController } from "../controllers/playfiversCallbackController";

export const apiRouter = Router();

console.log("🚀 [ROUTES] apiRouter criado e rotas sendo registradas...");

// Middleware de logging para todas as rotas da API
// Logs apenas em modo debug
const isDebug = process.env.NODE_ENV === "development" || process.env.DEBUG === "true";
apiRouter.use((req, res, next) => {
  if (isDebug) {
    console.log(`🔵 [API ROUTER] ${req.method} ${req.path}`);
  }
  next();
});

// IMPORTANTE: Registrar /test ANTES de /health para testar ordem
apiRouter.get("/test", (_req, res) => {
  console.log("✅ [TEST] Endpoint de teste chamado - ROTA FUNCIONANDO!");
  console.log("✅ [TEST] Request path:", _req.path);
  console.log("✅ [TEST] Request url:", _req.url);
  res.json({ 
    message: "API está funcionando!",
    timestamp: new Date().toISOString(),
    routes: [
      "/api/health",
      "/api/payments/pix",
      "/api/payments/card",
      "/api/payments/boleto"
    ]
  });
});

apiRouter.get("/health", (_req, res) => {
  console.log("✅ [HEALTH] Health check chamado");
  console.log("✅ [HEALTH] Request path:", _req.path);
  console.log("✅ [HEALTH] Request url:", _req.url);
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Teste alternativo - mesma rota mas com método diferente
apiRouter.all("/test-all", (_req, res) => {
  console.log("✅ [TEST-ALL] Endpoint de teste ALL chamado!");
  res.json({ 
    message: "API está funcionando (ALL method)!",
    method: _req.method,
    path: _req.path,
    url: _req.url
  });
});

console.log("✅ [ROUTES] Rotas básicas registradas: /health, /test");

// Endpoint temporário para descobrir o IP do servidor
apiRouter.get("/ip-info", (req, res) => {
  // Obter IP real considerando proxies (Cloudflare, etc)
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const cfConnectingIp = req.headers["cf-connecting-ip"]; // Cloudflare
  
  const ip = 
    (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : null) ||
    (typeof realIp === "string" ? realIp : null) ||
    (typeof cfConnectingIp === "string" ? cfConnectingIp : null) ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown";

  res.json({
    ip: ip,
    headers: {
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
      "cf-connecting-ip": req.headers["cf-connecting-ip"],
      "x-forwarded": req.headers["x-forwarded"],
      "forwarded": req.headers["forwarded"]
    },
    socket: {
      remoteAddress: req.socket.remoteAddress,
      remoteFamily: req.socket.remoteFamily
    },
    message: "Este é o IP que a PlayFivers verá quando você fizer requisições. Adicione este IP na whitelist da PlayFivers."
  });
});

// Webhooks do PlayFivers (conforme documentação oficial)
// POST /webhook - Webhook de Saldo (type: "BALANCE")
// POST /api/webhook - Webhook de Transação (type: "WinBet", "LoseBet", "Bet")
apiRouter.post("/playfivers/callback", playfiversCallbackController);
apiRouter.post("/webhook", playfiversCallbackController);
apiRouter.post("/api/webhook", playfiversCallbackController);

// Rotas públicas
apiRouter.use("/auth", authRouter);

// Rotas de leitura públicas, escrita protegida
apiRouter.use("/providers", providersRouter);
apiRouter.use("/games", gamesRouter);
apiRouter.use("/banners", bannersRouter);
apiRouter.use("/promotions", promotionsRouter);

// Settings: GET público, PUT protegido (proteção aplicada no próprio router)
apiRouter.use("/settings", settingsRouter);
// Pagamentos (proteção aplicada no próprio router)
apiRouter.use("/payments", paymentsRouter);
// Estatísticas (proteção aplicada no próprio router)
apiRouter.use("/stats", statsRouter);
// Tracking (proteção aplicada no próprio router)
apiRouter.use("/tracking", trackingRouter);
// Bônus (proteção aplicada no próprio router)
apiRouter.use("/bonuses", bonusesRouter);
// Recompensas (proteção aplicada no próprio router)
apiRouter.use("/rewards", rewardsRouter);
// Gerentes (proteção aplicada no próprio router)
apiRouter.use("/managers", managersRouter);
// Afiliados (proteção aplicada no próprio router)
apiRouter.use("/affiliates", affiliatesRouter);
// Comissões (proteção aplicada no próprio router)
apiRouter.use("/commissions", commissionsRouter);
// Indicações (proteção aplicada no próprio router)
apiRouter.use("/referrals", referralsRouter);
// VIP (proteção aplicada no próprio router)
apiRouter.use("/vip", vipRouter);
// Protegidas
apiRouter.use("/uploads", authenticate, requireAdmin, uploadsRouter);
apiRouter.use("/playfivers", authenticate, requireAdmin, playfiversRouter);

console.log("✅ [ROUTES] Todas as rotas registradas no apiRouter");



