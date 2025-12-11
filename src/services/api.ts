import axios from "axios";

// Usar URL do backend via env ou, por padrão, o mesmo domínio do frontend
// Evita redirecionamentos em loop quando a origem é diferente (ex.: mobile + hostinger)
const defaultApi =
  typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/api`
    : "https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api";

// Preferir VITE_API_URL (explícito) ou VITE_API_BASE_URL; cair para defaultApi
const baseURL =
  (import.meta.env as any).VITE_API_URL ??
  (import.meta.env as any).VITE_API_BASE_URL ??
  defaultApi;

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
    const status = error.response?.status;
    const url = error.config?.url || "";

    // Não limpar token em rotas de autenticação (login/register)
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");
    
    // Evitar loop de reload em rotas públicas (settings, games, banners, etc.)
    const isPublicRoute =
      url.includes("/settings") ||
      url.includes("/games") ||
      url.includes("/banners") ||
      url.includes("/providers") ||
      url.includes("/promotions");

    if ((status === 401 || status === 403) && !isAuthRoute) {
      // Se for rota pública, apenas limpar token e seguir sem redirecionar
        localStorage.removeItem("token");
        localStorage.removeItem("user");

      // Redirecionar somente se estiver no admin (área protegida)
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/login";
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

