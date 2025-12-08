import axios from "axios";

const baseURL =
  (import.meta.env as any).VITE_API_URL ??
  (import.meta.env as any).VITE_API_BASE_URL ??
  "/api";

export const api = axios.create({ baseURL });

