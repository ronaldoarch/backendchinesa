import path from "node:path";
import fs from "node:fs";
import { Router } from "express";
import multer from "multer";

export const uploadsRouter = Router();

// IMPORTANTE: Usar o mesmo caminho que o index.ts usa para servir arquivos
// Caminho relativo ao diretório raiz do projeto (server/uploads)
// Se compilado: __dirname = dist-server/routes, então .. = dist-server, .. = raiz, server/uploads
// Se não compilado: __dirname = server/routes, então .. = server, .. = raiz, server/uploads
const projectRoot = path.resolve(__dirname, "..", "..");
const uploadDir = path.join(projectRoot, "server", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Diretório de uploads criado (routes):", uploadDir);
}

// Usar uploadDir como finalUploadDir
const finalUploadDir = uploadDir;

console.log("📁 [UPLOADS ROUTE] Diretório configurado:", finalUploadDir);
console.log("📁 [UPLOADS ROUTE] __dirname:", __dirname);
console.log("📁 [UPLOADS ROUTE] Project root:", projectRoot);
console.log("📁 [UPLOADS ROUTE] Diretório existe?", fs.existsSync(finalUploadDir));

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

const upload = multer({ storage });

uploadsRouter.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Nenhum arquivo enviado" });
  }

  // Log detalhado do upload
  console.log("📤 Arquivo recebido:", {
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    destination: req.file.destination,
    path: req.file.path,
    uploadDir: finalUploadDir
  });

  // Verificar se o arquivo realmente foi salvo
  const filePath = path.join(finalUploadDir, req.file.filename);
  if (fs.existsSync(filePath)) {
    console.log("✅ Arquivo salvo com sucesso em:", filePath);
  } else {
    console.error("❌ ERRO: Arquivo não foi salvo! Caminho esperado:", filePath);
  }

  const urlPath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: urlPath });
});


