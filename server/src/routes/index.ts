import { Router } from "express";
import { providersRouter } from "./providers";
import { gamesRouter } from "./games";
import { bannersRouter } from "./banners";
import { settingsRouter } from "./settings";
import { uploadsRouter } from "./uploads";
import { playfiversRouter } from "./playfivers";
import { authRouter } from "./auth";
import { authenticate, requireAdmin } from "../middleware/auth";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

apiRouter.post("/playfivers/callback", (req, res) => {
  // eslint-disable-next-line no-console
  console.log("📥 Callback PlayFivers recebido:", {
    headers: req.headers,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Validar assinatura se necessário (implementar conforme documentação)
  // const signature = req.headers['x-playfivers-signature'];
  // if (signature && !validateSignature(req.body, signature)) {
  //   return res.status(401).json({ error: "Assinatura inválida" });
  // }

  // Processar diferentes tipos de eventos
  const eventType = req.body.type || req.body.event || req.body.event_type;
  const eventData = req.body.data || req.body;

  // eslint-disable-next-line no-console
  console.log(`📋 Tipo de evento: ${eventType || "desconhecido"}`);

  // Aqui você pode processar diferentes tipos de eventos:
  // - bet_placed: Aposta realizada
  // - bet_settled: Aposta finalizada
  // - balance_update: Atualização de saldo
  // - game_session: Sessão de jogo
  // etc.

  // Por enquanto, apenas logar e responder OK
  res.status(200).json({ 
    ok: true, 
    received: true,
    timestamp: new Date().toISOString()
  });
});

// Rotas públicas
apiRouter.use("/auth", authRouter);

// Rotas de leitura públicas, escrita protegida
apiRouter.use("/providers", providersRouter);
apiRouter.use("/games", gamesRouter);
apiRouter.use("/banners", bannersRouter);

// Rotas protegidas (requerem autenticação e admin)
apiRouter.use("/settings", authenticate, requireAdmin, settingsRouter);
apiRouter.use("/uploads", authenticate, requireAdmin, uploadsRouter);
apiRouter.use("/playfivers", authenticate, requireAdmin, playfiversRouter);



