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
// IMPORTANTE: Usar o mesmo caminho que routes/uploads.ts usa para salvar arquivos
// Se __dirname = /app/server/src, então:
// .. = /app/server
// Então precisamos apenas "uploads" (não "server/uploads" novamente)
const fs = require("fs");
const uploadsDir = path.resolve(__dirname, "..", "uploads");

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ Diretório de uploads criado:", uploadsDir);
  }
  
  // Log para debug
  console.log("📁 [SERVER] Diretório de uploads configurado:", uploadsDir);
  console.log("📁 [SERVER] __dirname:", __dirname);
  console.log("📁 [SERVER] Diretório existe?", fs.existsSync(uploadsDir));
  
  // Listar arquivos no diretório se existir
  if (fs.existsSync(uploadsDir)) {
    try {
      const files = fs.readdirSync(uploadsDir);
      console.log("📂 [SERVER] Arquivos no diretório:", files.length, "arquivo(s)");
      if (files.length > 0) {
        console.log("📂 [SERVER] Primeiros arquivos:", files.slice(0, 5));
      }
    } catch (err) {
      console.error("❌ [SERVER] Erro ao listar arquivos:", err);
    }
  }
  
  // Servir arquivos estáticos de uploads ANTES da rota catch-all
  app.use("/uploads", express.static(uploadsDir, {
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=31536000");
    }
  }));
  
  // Middleware para tratar arquivos não encontrados em /uploads (após express.static)
  app.use("/uploads", (req, res) => {
    const requestedFile = req.path.replace("/uploads/", "");
    const filePath = path.join(uploadsDir, requestedFile);
    
    console.log("⚠️ [404] Arquivo não encontrado:", req.path);
    console.log("⚠️ [404] Caminho completo procurado:", filePath);
    console.log("⚠️ [404] Diretório base:", uploadsDir);
    console.log("⚠️ [404] Arquivo existe?", fs.existsSync(filePath));
    
    // Listar arquivos no diretório para debug
    try {
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        console.log("📂 [404] Total de arquivos no diretório:", files.length);
        console.log("📂 [404] Arquivos:", files);
        console.log("📂 [404] Arquivo procurado está na lista?", files.includes(requestedFile));
      } else {
        console.log("❌ [404] Diretório não existe!");
      }
    } catch (err) {
      console.log("❌ [404] Erro ao listar arquivos:", err);
    }
    
    res.status(404).json({ error: "Arquivo não encontrado" });
  });
  
  console.log("✅ Rota /uploads configurada para servir arquivos de:", uploadsDir);
} catch (error) {
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

