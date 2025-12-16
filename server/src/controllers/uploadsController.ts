import { Request, Response } from "express";
import path from "path";
import fs from "fs";

export async function uploadFileController(req: Request, res: Response): Promise<void> {
  try {
    console.log("📤 [UPLOAD] Requisição recebida:", {
      method: req.method,
      headers: req.headers["content-type"],
      hasFile: !!req.file,
      body: req.body
    });

    if (!req.file) {
      console.error("❌ [UPLOAD] Nenhum arquivo recebido");
      console.error("❌ [UPLOAD] Headers:", req.headers);
      console.error("❌ [UPLOAD] Body:", req.body);
      res.status(400).json({ 
        error: "Nenhum arquivo enviado",
        message: "Certifique-se de enviar o arquivo com o campo 'file'"
      });
      return;
    }

    // Log detalhado do upload
    const uploadDir = path.resolve(__dirname, "..", "..", "uploads");
    const filePath = path.join(uploadDir, req.file.filename);
    
    console.log("📤 [UPLOAD] Arquivo recebido:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
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
      res.status(500).json({ 
        error: "Erro ao salvar arquivo",
        message: "O arquivo não foi salvo no servidor"
      });
      return;
    }

    const urlPath = `/uploads/${req.file.filename}`;
    console.log("✅ [UPLOAD] URL gerada:", urlPath);
    res.status(201).json({ url: urlPath });
  } catch (error: any) {
    console.error("❌ [UPLOAD] Erro no controller:", error);
    res.status(500).json({ 
      error: "Erro ao processar upload",
      message: error.message || "Erro desconhecido"
    });
  }
}



