import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import { json } from "express";
import fs from "node:fs";
import { apiRouter } from "./routes/index";
import { initDb } from "./db";

const app = express();

app.use(
  cors({
    origin: "*"
  })
);
app.use(json());

// ========== CONFIGURAÇÃO DE UPLOADS ==========
console.log("🔧 [INIT] Iniciando configuração de uploads...");
console.log("🔧 [INIT] __dirname:", __dirname);

// Criar diretório de uploads se não existir
// IMPORTANTE: Usar o mesmo caminho que routes/uploads.ts usa para salvar arquivos
// Caminho relativo ao diretório raiz do projeto (server/uploads)
// Se compilado: __dirname = dist-server, então .. = raiz, server/uploads
// Se não compilado: __dirname = server, então .. = raiz, server/uploads
const projectRoot = path.resolve(__dirname, "..");
const uploadsDir = path.join(projectRoot, "server", "uploads");

console.log("🔧 [INIT] Project root calculado:", projectRoot);
console.log("🔧 [INIT] Uploads dir calculado:", uploadsDir);

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ Diretório de uploads criado:", uploadsDir);
  }
  
  // Log para debug
  console.log("📁 [INDEX] Diretório de uploads configurado:", uploadsDir);
  console.log("📁 [INDEX] __dirname atual:", __dirname);
  console.log("📁 [INDEX] Project root:", projectRoot);
  console.log("📁 [INDEX] Diretório existe?", fs.existsSync(uploadsDir));
  
  // Listar arquivos no diretório se existir
  if (fs.existsSync(uploadsDir)) {
    try {
      const files = fs.readdirSync(uploadsDir);
      console.log("📂 [INDEX] Arquivos no diretório:", files.length, "arquivo(s)");
      if (files.length > 0) {
        console.log("📂 [INDEX] Primeiros arquivos:", files.slice(0, 5));
      }
    } catch (err) {
      console.error("❌ [INDEX] Erro ao listar arquivos:", err);
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

// Servir arquivos estáticos do frontend (dist-client)
const frontendDir = path.resolve(__dirname, "..", "public_html");
app.use(express.static(frontendDir));

// Montar todas as rotas da API através do apiRouter
// Isso inclui: /api/auth, /api/providers, /api/games, /api/banners, 
// /api/settings, /api/payments, /api/stats, /api/tracking, /api/bonuses, etc.
app.use("/api", apiRouter);

// Servir index.html para todas as outras rotas (SPA)
// IMPORTANTE: Esta rota deve vir DEPOIS das rotas de API e /uploads
app.get("*", (req, res) => {
  // Não interceptar rotas de API ou uploads - já foram tratadas pelos middlewares anteriores
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads")) {
    // Se chegou aqui, significa que nenhum middleware anterior respondeu
    // Isso não deveria acontecer, mas retornamos 404 para segurança
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

