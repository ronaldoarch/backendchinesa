import { Request, Response } from "express";

export function uploadFileController(req: Request, res: Response): void {
  if (!req.file) {
    res.status(400).json({ message: "Nenhum arquivo enviado" });
    return;
  }

  const urlPath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: urlPath });
}



