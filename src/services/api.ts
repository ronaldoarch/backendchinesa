import axios from "axios";

// Usar URL direta do backend (Coolify) ou variável de ambiente
const baseURL =
  (import.meta.env as any).VITE_API_URL ??
  (import.meta.env as any).VITE_API_BASE_URL ??
  "https://g40okoockcoskwwwgc4sowso.agenciamidas.com/api";

export const api = axios.create({ baseURL });

