import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";

export interface AuthRequest extends Request {
  userId?: number;
  userIsAdmin?: boolean;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: "Token inválido ou expirado" });
    return;
  }

  (req as AuthRequest).userId = decoded.id;
  // Garantir que is_admin seja boolean (pode vir como 0/1 do JWT)
  // Fazer cast para any para permitir verificação de diferentes tipos em runtime
  const isAdminValue: any = decoded.is_admin;
  (req as AuthRequest).userIsAdmin = Boolean(
    isAdminValue === true || 
    isAdminValue === 1 || 
    isAdminValue === "true" ||
    isAdminValue === "1"
  );

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;
  
  if (!authReq.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  // Verificar novamente se é admin (já é boolean, mas verificamos para garantir)
  const isAdmin = Boolean(authReq.userIsAdmin);
  
  if (!isAdmin) {
    res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar esta rota." });
    return;
  }

  next();
}
