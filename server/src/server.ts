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

// Criar diretório de uploads se não existir
const uploadsDir = path.resolve(__dirname, "..", "..", "server", "uploads");
try {
  if (!require("fs").existsSync(uploadsDir)) {
    require("fs").mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));
} catch (error) {
  // eslint-disable-next-line no-console
  console.warn("⚠️ Aviso: Não foi possível configurar diretório de uploads:", error);
}

app.use("/api", apiRouter);

// Health check endpoint (importante para Coolify)
app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "healthy" });
});

// Rota raiz - apenas para API
app.get("/", (_req, res) => {
  res.json({ 
    message: "API Backend BigBet777",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      api: "/api"
    }
  });
});

// 404 para rotas não encontradas
app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.use(errorHandler);

// Tratamento de erros assíncronos não capturados (não deve crashar o servidor)
process.on("unhandledRejection", (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Não fazer exit - apenas logar o erro
});

process.on("uncaughtException", (error) => {
  // eslint-disable-next-line no-console
  console.error("❌ Uncaught Exception:", error);
  // Não fazer exit imediatamente - dar tempo para o servidor processar
  // O Coolify vai reiniciar se necessário
});

// Inicializar banco e servidor
void initDb()
  .then(() => {
    const server = app.listen(env.port, "0.0.0.0", () => {
      // eslint-disable-next-line no-console
      console.log(`✅ Servidor API rodando na porta ${env.port}`);
    });

    // Tratamento de erros do servidor
    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        // eslint-disable-next-line no-console
        console.error(`❌ Porta ${env.port} já está em uso`);
      } else {
        // eslint-disable-next-line no-console
        console.error("❌ Erro no servidor:", error);
      }
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("❌ Erro fatal ao inicializar servidor:", error);
    // Não fazer exit imediatamente - dar tempo para logs
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

