import path from "node:path";
import express from "express";
import cors from "cors";
import { json } from "express";
import { env } from "./config/env";
import { initDb } from "./config/database";
import { apiRouter } from "./routes";
import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// CORS configurado antes de tudo
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  })
);

// Handler explícito para OPTIONS (preflight)
app.options("*", (_req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(204);
});

// Headers CORS manuais (fallback)
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(json());
app.use(requestLogger);

const uploadsDir = path.resolve(__dirname, "..", "..", "server", "uploads");
app.use("/uploads", express.static(uploadsDir));

// Servir arquivos estáticos do frontend (public_html)
const frontendDir = path.resolve(__dirname, "..", "..", "public_html");
app.use(express.static(frontendDir));

app.use("/api", apiRouter);

// SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.use(errorHandler);

// Tratamento de erros assíncronos não capturados
process.on("unhandledRejection", (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  // eslint-disable-next-line no-console
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Inicializar banco e servidor
void initDb()
  .then(() => {
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`✅ Servidor API rodando na porta ${env.port}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("❌ Erro fatal ao inicializar servidor:", error);
    process.exit(1);
  });

