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

// IMPORTANTE: NÃO definir rota raiz "/" aqui
// A rota raiz será servida pelo frontend (SPA) para que links de afiliados/gerentes funcionem

// Servir frontend estático (SPA)
// Verificar se existe dist-client (build do frontend)
// Tentar múltiplos caminhos possíveis (desenvolvimento e produção)
const cwd = process.cwd();
const possiblePaths = [
  path.resolve(cwd, "dist-client"), // Produção Docker: /app/dist-client
  path.resolve(__dirname, "..", "..", "dist-client"), // Desenvolvimento: server/src -> server -> raiz -> dist-client
  path.resolve(__dirname, "..", "dist-client"), // Se compilado: dist-server -> raiz -> dist-client
  path.join(cwd, "dist-client"), // Alternativa com join
  path.join(__dirname, "..", "..", "..", "dist-client") // Alternativa
];

let distClientPath: string | null = null;
let distClientExists = false;

for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    distClientPath = possiblePath;
    distClientExists = true;
    console.log("=".repeat(60));
    console.log(`✅ [SERVER] Frontend encontrado em: ${distClientPath}`);
    console.log(`✅ [SERVER] __dirname: ${__dirname}`);
    console.log(`✅ [SERVER] process.cwd(): ${process.cwd()}`);
    
    // Verificar se index.html existe
    const indexPath = path.join(distClientPath, "index.html");
    if (fs.existsSync(indexPath)) {
      console.log(`✅ [SERVER] index.html encontrado: ${indexPath}`);
    } else {
      console.warn(`⚠️ [SERVER] index.html NÃO encontrado em: ${indexPath}`);
    }
    console.log("=".repeat(60));
    break;
  }
}

if (!distClientExists) {
  console.error("=".repeat(60));
  console.error("⚠️ [SERVER] Frontend NÃO encontrado!");
  console.error("⚠️ [SERVER] Caminhos testados:");
  possiblePaths.forEach(p => {
    const exists = fs.existsSync(p);
    console.error(`   ${exists ? "✅" : "❌"} ${p}`);
  });
  console.error(`   - __dirname: ${__dirname}`);
  console.error(`   - process.cwd(): ${process.cwd()}`);
  console.error("=".repeat(60));
}

if (distClientExists && distClientPath) {
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
    const indexPath = path.join(distClientPath!, "index.html");
    if (fs.existsSync(indexPath)) {
      // Log apenas em debug para não poluir logs
      if (isDebug) {
        console.log(`📄 [SPA] Servindo index.html para: ${req.path}`);
      }
      res.sendFile(indexPath);
    } else {
      console.error(`❌ [SERVER] index.html não encontrado em: ${indexPath}`);
      // Se index.html não existe, retornar erro 500 em vez de JSON
      res.status(500).send(`
        <html>
          <head><title>Erro - Frontend não encontrado</title></head>
          <body style="font-family: Arial; padding: 20px; background: #1a1a1a; color: #fff;">
            <h1>Erro: Frontend não encontrado</h1>
            <p>O arquivo index.html não foi encontrado em: ${indexPath}</p>
            <p>Verifique se o build do frontend foi executado corretamente.</p>
          </body>
        </html>
      `);
    }
  });
  
  console.log("✅ [SERVER] Frontend configurado para servir na raiz");
} else {
  console.error("=".repeat(60));
  console.error("❌ [SERVER] Frontend NÃO encontrado!");
  console.error("❌ [SERVER] Certifique-se de que o build do frontend foi executado (npm run build:client)");
  console.error("=".repeat(60));
  
  // Fallback: retornar mensagem HTML em vez de JSON para facilitar debug
  app.get("/", (_req, res) => {
    res.status(503).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Frontend não encontrado</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #1a1a1a;
              color: #fff;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            h1 { color: #ff6b6b; }
            code { background: #2d2d2d; padding: 2px 6px; border-radius: 3px; }
            .warning { background: #ff6b6b20; border-left: 4px solid #ff6b6b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>⚠️ Frontend não encontrado</h1>
          <div class="warning">
            <p><strong>O frontend não foi encontrado no servidor.</strong></p>
            <p>Execute <code>npm run build:client</code> para gerar o build do frontend.</p>
          </div>
          <h2>Informações da API:</h2>
          <ul>
            <li><strong>Mensagem:</strong> API Backend H2bet</li>
            <li><strong>Versão:</strong> 1.0.0</li>
            <li><strong>Endpoints:</strong>
              <ul>
                <li><code>/health</code> - Health check</li>
                <li><code>/api</code> - API principal</li>
              </ul>
            </li>
          </ul>
          <h2>Caminhos testados:</h2>
          <ul>
            ${possiblePaths.map(p => `<li><code>${p}</code> ${fs.existsSync(p) ? '✅' : '❌'}</li>`).join('\n')}
          </ul>
          <p><strong>__dirname:</strong> <code>${__dirname}</code></p>
          <p><strong>process.cwd():</strong> <code>${process.cwd()}</code></p>
        </body>
      </html>
    `);
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

