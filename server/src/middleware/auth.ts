import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";

export interface AuthRequest extends Request {
  userId?: number;
  userIsAdmin?: boolean;
  user?: {
    id: number;
    username: string;
    email?: string;
  };
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  console.log("🔐 [AUTH] Middleware authenticate chamado");
  console.log("🔐 [AUTH] Path:", req.path);
  console.log("🔐 [AUTH] Method:", req.method);
  
  const authHeader = req.headers.authorization;
  console.log("🔐 [AUTH] Authorization header:", authHeader ? "presente" : "ausente");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("❌ [AUTH] Token não fornecido");
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
  // Adicionar username ao request para uso em controllers
  (req as AuthRequest).user = {
    id: decoded.id,
    username: decoded.username,
    email: decoded.username // Usar username como email também
  };
  // Garantir que is_admin seja boolean (pode vir como 0/1 do JWT)
  // Fazer cast para any para permitir verificação de diferentes tipos em runtime
  const isAdminValue: any = decoded.is_admin;
  (req as AuthRequest).userIsAdmin = Boolean(
    isAdminValue === true || 
    isAdminValue === 1 || 
    isAdminValue === "true" ||
    isAdminValue === "1"
  );

  // eslint-disable-next-line no-console
  console.log("Authenticate middleware:", {
    userId: decoded.id,
    username: decoded.username,
    is_admin_from_token: decoded.is_admin,
    is_admin_type: typeof decoded.is_admin,
    userIsAdmin: (req as AuthRequest).userIsAdmin
  });

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
  
  // eslint-disable-next-line no-console
  console.log("RequireAdmin middleware:", {
    userId: authReq.userId,
    userIsAdmin: authReq.userIsAdmin,
    isAdmin,
    path: req.path,
    method: req.method
  });
  
  if (!isAdmin) {
    // eslint-disable-next-line no-console
    console.log("❌ Acesso negado - usuário não é admin");
    res.status(403).json({ error: "Acesso negado. Apenas administradores podem acessar esta rota." });
    return;
  }
  
  // eslint-disable-next-line no-console
  console.log("✅ Acesso permitido - usuário é admin");

  next();
}
