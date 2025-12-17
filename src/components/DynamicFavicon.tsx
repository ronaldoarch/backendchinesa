import { useEffect } from "react";
import { api } from "../services/api";

export function DynamicFavicon() {
  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<Record<string, string>>("/settings");
        const faviconUrl = res.data["branding.faviconUrl"];
        
        if (faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement("link");
          link.type = "image/x-icon";
          link.rel = "shortcut icon";
          
          // Se for URL absoluta, usar diretamente, senão adicionar baseURL
          if (faviconUrl.startsWith("http")) {
            link.href = faviconUrl;
          } else {
            const baseUrl = api.defaults.baseURL?.replace("/api", "") || "";
            link.href = `${baseUrl}${faviconUrl}`;
          }
          
          if (!document.querySelector("link[rel*='icon']")) {
            document.getElementsByTagName("head")[0].appendChild(link);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar favicon:", error);
      }
    })();
  }, []);

  return null;
}
