import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import { json } from "express";
import fs from "node:fs";
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

// Criar diretório de uploads se não existir
const uploadsDir = path.resolve(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ Diretório de uploads criado:", uploadsDir);
  }
  // Servir arquivos estáticos de uploads ANTES da rota catch-all
  app.use("/uploads", express.static(uploadsDir, {
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=31536000");
    },
    fallthrough: false // Não passar para próximo middleware se arquivo não existir
  }));
  
  // Middleware para tratar arquivos não encontrados em /uploads
  app.use("/uploads", (req, res) => {
    res.status(404).json({ error: "Arquivo não encontrado" });
  });
  
  console.log("✅ Rota /uploads configurada para servir arquivos de:", uploadsDir);
} catch (error) {
  console.warn("⚠️ Aviso: Não foi possível configurar diretório de uploads:", error);
}

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

// Rotas da API
app.use("/api/providers", providersRouter);
app.use("/api/games", gamesRouter);
app.use("/api/banners", bannersRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/playfivers", playfiversRouter);

// Servir index.html para todas as outras rotas (SPA)
// IMPORTANTE: Esta rota deve vir DEPOIS das rotas de API e /uploads
app.get("*", (req, res) => {
  // Não interceptar rotas de API ou uploads - deixar que express.static trate
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads")) {
    return res.status(404).json({ error: "Rota não encontrada" });
  }
  res.sendFile(path.join(frontendDir, "index.html"), (err) => {
    if (err) {
      res.status(404).json({ error: "Arquivo não encontrado" });
    }
  });
});

const port = process.env.PORT || 4000;

void initDb().then(() => {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Servidor API rodando na porta ${port}`);
  });
});

