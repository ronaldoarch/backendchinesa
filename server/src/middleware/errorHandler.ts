import { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // eslint-disable-next-line no-console
  console.error("❌ Erro capturado:", err);
  // eslint-disable-next-line no-console
  console.error("Stack:", err.stack);
  
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  res.status(500).json({
    message: "Erro interno do servidor",
    ...(isDevelopment && {
      error: err.message,
      stack: err.stack
    })
  });
}

