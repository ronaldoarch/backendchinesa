import { Request, Response } from "express";

export async function uploadFileController(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ message: "Nenhum arquivo enviado" });
    return;
  }

  const urlPath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: urlPath });
}



