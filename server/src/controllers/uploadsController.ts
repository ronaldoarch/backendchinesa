import { Request, Response } from "express";

export function uploadFileController(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "Nenhum arquivo enviado" });
  }

  const urlPath = `/uploads/${req.file.filename}`;
  res.status(201).json({ url: urlPath });
}

