import { NextFunction, Request, Response } from "express";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // eslint-disable-next-line no-console
  console.error("❌ [ERROR HANDLER] Erro capturado:", err.message);
  // eslint-disable-next-line no-console
  console.error("❌ [ERROR HANDLER] URL:", req.url);
  // eslint-disable-next-line no-console
  console.error("❌ [ERROR HANDLER] Method:", req.method);
  // eslint-disable-next-line no-console
  console.error("❌ [ERROR HANDLER] Stack:", err.stack);
  
  const isDevelopment = process.env.NODE_ENV !== "production";
  
  // Se a resposta já foi enviada, não tente enviar novamente
  if (res.headersSent) {
    console.error("❌ [ERROR HANDLER] Resposta já foi enviada, não é possível enviar erro");
    return;
  }
  
  res.status(500).json({
    message: "Erro interno do servidor",
    ...(isDevelopment && {
      error: err.message,
      stack: err.stack
    })
  });
}

