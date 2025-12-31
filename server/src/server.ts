import path from "node:path";
import express from "express";
import cors from "cors";
import { json } from "express";
import fs from "fs";
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

// Middleware de logging global ANTES de tudo - PRIMEIRO MIDDLEWARE
// Apenas logar em modo desenvolvimento
const isDebug = process.env.NODE_ENV === "development" || process.env.DEBUG === "true";
app.use((req, res, next) => {
  if (isDebug) {
    console.log(`🌐 [GLOBAL] ${req.method} ${req.originalUrl || req.url}`);
  }
  next();
});

app.use(requestLogger);

// Criar diretório de uploads se não existir
// IMPORTANTE: Usar o mesmo caminho que routes/uploads.ts usa para salvar arquivos
// Se __dirname = /app/server/src, então:
// .. = /app/server
// Então precisamos apenas "uploads" (não "server/uploads" novamente)
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

// Log antes de montar as rotas (apenas em debug)
if (isDebug) {
  console.log("🔧 [SERVER] Montando apiRouter em /api");
  console.log("🔧 [SERVER] Rotas disponíveis:", [
    "/health", "/auth", "/providers", "/games", "/banners",
    "/promotions", "/settings", "/payments", "/stats",
    "/tracking", "/bonuses", "/uploads", "/playfivers"
  ]);
}

// Middleware que captura TODAS as requisições que começam com /api
// Logs apenas em modo debug
app.use("/api", (req, res, next) => {
  if (isDebug) {
    console.log(`🚨 [API] ${req.method} ${req.path}`);
  }
  next();
});

app.use("/api", apiRouter);

console.log("🔧 [SERVER] DEPOIS de montar apiRouter em /api");

// Health check endpoint (importante para Coolify)
app.get("/health", (_req, res) => {
  res.json({ ok: true, status: "healthy" });
});

// Servir frontend estático (SPA)
// Verificar se existe dist-client (build do frontend)
const distClientPath = path.resolve(__dirname, "..", "..", "dist-client");
const distClientExists = fs.existsSync(distClientPath);

if (distClientExists) {
  console.log("✅ [SERVER] Frontend encontrado em:", distClientPath);
  
  // Servir arquivos estáticos do frontend (CSS, JS, imagens, etc)
  app.use(express.static(distClientPath, {
    maxAge: "1d", // Cache de 1 dia para assets
    etag: true,
    // Não servir index.html aqui, apenas assets
    index: false
  }));
  
  // Para todas as rotas GET que não são /api, /health, /uploads, servir index.html (SPA routing)
  // IMPORTANTE: Esta rota deve ser a ÚLTIMA, depois de todas as outras
  app.get("*", (req, res, next) => {
    // Ignorar rotas da API e outras rotas específicas
    if (req.path.startsWith("/api") || 
        req.path === "/health" || 
        req.path.startsWith("/uploads")) {
      return next();
    }
    
    // Servir index.html para todas as outras rotas (SPA)
    const indexPath = path.join(distClientPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
  
  console.log("✅ [SERVER] Frontend configurado para servir na raiz");
} else {
  console.warn("⚠️ [SERVER] Frontend não encontrado em:", distClientPath);
  console.warn("⚠️ [SERVER] Certifique-se de que o build do frontend foi executado (npm run build:client)");
  
  // Fallback: retornar mensagem da API apenas se frontend não existir
  app.get("/", (_req, res) => {
    res.json({ 
      message: "API Backend H2bet",
      version: "1.0.0",
      endpoints: {
        health: "/health",
        api: "/api"
      },
      warning: "Frontend não encontrado. Execute 'npm run build:client' para gerar o build."
    });
  });
  
  // 404 para rotas não encontradas (apenas se não for SPA)
  app.use((_req, res) => {
    res.status(404).json({ error: "Rota não encontrada" });
  });
}

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

