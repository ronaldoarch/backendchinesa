import { Request, Response } from "express";
import path from "path";
import fs from "fs";

export async function uploadFileController(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ message: "Nenhum arquivo enviado" });
    return;
  }

  // Log detalhado do upload
  // Se __dirname = /app/server/src/controllers, então:
  // .. = /app/server/src
  // .. = /app/server
  // Então precisamos apenas "uploads" (não "server/uploads" novamente)
  const uploadDir = path.resolve(__dirname, "..", "..", "uploads");
  const filePath = path.join(uploadDir, req.file.filename);
  
  console.log("📤 [UPLOAD] Arquivo recebido:", {
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    destination: req.file.destination,
    path: req.file.path,
    uploadDir: uploadDir
  });

  // Verificar se o arquivo realmente foi salvo
  if (fs.existsSync(filePath)) {
    console.log("✅ [UPLOAD] Arquivo salvo com sucesso em:", filePath);
  } else {
    console.error("❌ [UPLOAD] ERRO: Arquivo não foi salvo! Caminho esperado:", filePath);
    console.error("❌ [UPLOAD] Caminho real do arquivo:", req.file.path);
  }

  const urlPath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: urlPath });
}



