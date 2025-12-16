import path from "node:path";
import fs from "node:fs";
import { Router } from "express";
import multer from "multer";
import { uploadFileController } from "../controllers/uploadsController";
import { asyncHandler } from "../middleware/asyncHandler";

export const uploadsRouter = Router();

// IMPORTANTE: Usar o mesmo caminho que server.ts usa para servir arquivos
// Se __dirname = /app/server/src/routes, então:
// .. = /app/server/src
// .. = /app/server
// Então precisamos apenas "uploads" (não "server/uploads" novamente)
const uploadDir = path.resolve(__dirname, "..", "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ [UPLOADS ROUTE] Diretório de uploads criado:", uploadDir);
}

console.log("📁 [UPLOADS ROUTE] Diretório configurado:", uploadDir);
console.log("📁 [UPLOADS ROUTE] __dirname:", __dirname);
console.log("📁 [UPLOADS ROUTE] Diretório existe?", fs.existsSync(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (_req, file, cb) => {
    // Aceitar apenas imagens
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não permitido. Apenas imagens são aceitas."));
    }
  }
});

// Middleware de erro do multer
const uploadMiddleware = (req: any, res: any, next: any) => {
  upload.single("file")(req, res, (err: any) => {
    if (err) {
      console.error("❌ [UPLOAD] Erro no multer:", err.message);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Arquivo muito grande. Tamanho máximo: 10MB" });
      }
      return res.status(400).json({ error: "Erro ao fazer upload", message: err.message });
    }
    next();
  });
};

uploadsRouter.post("/", uploadMiddleware, asyncHandler(uploadFileController));

