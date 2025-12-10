import axios from "axios";

// Usar URL direta do backend (Coolify) ou variável de ambiente
const baseURL =
  (import.meta.env as any).VITE_API_URL ??
  (import.meta.env as any).VITE_API_BASE_URL ??
  "https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api";

export const api = axios.create({ baseURL });

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não limpar token em rotas de autenticação (login/register)
    const isAuthRoute = error.config?.url?.includes("/auth/login") || 
                        error.config?.url?.includes("/auth/register");
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !isAuthRoute) {
      // Se não estiver na página de admin, limpar token e redirecionar
      if (!window.location.pathname.startsWith("/admin")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// Funções auxiliares de autenticação
export function setAuthToken(token: string) {
  localStorage.setItem("token", token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export function removeAuthToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function setUser(user: any) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser(): any | null {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
}

