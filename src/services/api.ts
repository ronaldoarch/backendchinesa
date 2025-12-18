import axios from "axios";

// Usar URL do backend via env ou fallback para o backend real
// IMPORTANTE: Como o proxy do .htaccess não está funcionando no Hostinger (503),
// vamos usar a URL direta do backend no Coolify
const backendUrl = "https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api";

// Preferir VITE_API_URL (explícito) ou VITE_API_BASE_URL; depois usar backendUrl diretamente
// Não usar proxy do .htaccess pois está retornando 503 no Hostinger
const baseURL =
  (import.meta.env as any).VITE_API_URL ??
  (import.meta.env as any).VITE_API_BASE_URL ??
  backendUrl; // Usar URL direta do backend (proxy não funciona no Hostinger)

export const api = axios.create({ baseURL });

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  console.log("🌐 [FRONTEND API] Fazendo requisição:", config.method?.toUpperCase(), config.url);
  console.log("🌐 [FRONTEND API] Base URL:", config.baseURL);
  console.log("🌐 [FRONTEND API] URL completa:", `${config.baseURL}${config.url}`);
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("🌐 [FRONTEND API] Token presente:", token.substring(0, 20) + "...");
  } else {
    console.log("🌐 [FRONTEND API] Token ausente");
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => {
    console.log("✅ [FRONTEND API] Resposta recebida:", response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error("❌ [FRONTEND API] Erro na requisição:", error.config?.method?.toUpperCase(), error.config?.url);
    console.error("❌ [FRONTEND API] Status:", error.response?.status);
    console.error("❌ [FRONTEND API] Erro:", error.message);
    console.error("❌ [FRONTEND API] Response data:", error.response?.data);
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

// Função utilitária para construir URLs de imagens
// IMPORTANTE: Como o proxy do .htaccess não está funcionando no Hostinger,
// sempre usar a URL direta do backend para imagens
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Se já é uma URL completa (http/https), retornar diretamente
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  
  // Para URLs relativas (começando com /), usar a URL do backend diretamente
  // O proxy pode não estar funcionando, então sempre usar o backend
  const baseUrl = api.defaults.baseURL?.replace("/api", "") || "";
  const fullUrl = `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  
  return fullUrl;
}

