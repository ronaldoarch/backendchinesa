import { Navigate, useLocation } from "react-router-dom";
import { getUser } from "../services/api";

type Props = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const location = useLocation();
  const user = getUser();
  const token = localStorage.getItem("token");

  // Se não estiver autenticado
  if (!token || !user) {
    // eslint-disable-next-line no-console
    console.log("ProtectedRoute: Não autenticado", { token: !!token, user: !!user });
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Garantir que is_admin é boolean (pode vir como string do JSON ou número do MySQL)
  // MySQL pode retornar 0/1, JSON pode serializar como string "true"/"false" ou número
  const isAdmin = 
    user.is_admin === true || 
    user.is_admin === "true" || 
    user.is_admin === 1 || 
    user.is_admin === "1" ||
    String(user.is_admin).toLowerCase() === "true";

  // Se requer admin mas o usuário não é admin
  if (requireAdmin && !isAdmin) {
    // eslint-disable-next-line no-console
    console.log("ProtectedRoute: Usuário não é admin", { 
      is_admin: user.is_admin, 
      type: typeof user.is_admin,
      isAdmin,
      userObject: user
    });
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // eslint-disable-next-line no-console
  console.log("ProtectedRoute: Acesso permitido", { requireAdmin, is_admin: user.is_admin, isAdmin });
  return <>{children}</>;
}

export function ManagerRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = getUser();
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const userType = (user as any).user_type || (user as any).userType;
  if (userType !== "manager") {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
