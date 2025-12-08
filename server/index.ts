import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import { json } from "express";
import { providersRouter } from "./routes/providers";
import { gamesRouter } from "./routes/games";
import { bannersRouter } from "./routes/banners";
import { settingsRouter } from "./routes/settings";
import { uploadsRouter } from "./routes/uploads";
import { playfiversRouter } from "./routes/playfivers";
import { initDb } from "./db";

const app = express();

app.use(
  cors({
    origin: "*"
  })
);
app.use(json());

const uploadsDir = path.resolve(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// Servir arquivos estáticos do frontend (dist-client)
const frontendDir = path.resolve(__dirname, "..", "public_html");
app.use(express.static(frontendDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

// Endpoint para receber callbacks / webhooks da PlayFivers
app.post("/api/playfivers/callback", (req, res) => {
  // Por enquanto apenas loga e responde 200.
  // Aqui depois você pode validar assinatura, atualizar saldo, status de aposta etc.
  // eslint-disable-next-line no-console
  console.log("Callback PlayFivers recebido:", req.body);
  res.status(200).json({ ok: true });
});

app.use("/api/providers", providersRouter);
app.use("/api/games", gamesRouter);
app.use("/api/banners", bannersRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/playfivers", playfiversRouter);

// Servir index.html para todas as outras rotas (SPA)
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

const port = process.env.PORT || 4000;

void initDb().then(() => {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor API rodando na porta ${port}`);
  });
});

