import { useEffect } from "react";
import { api } from "../services/api";

export function UtmfyTracker() {
  useEffect(() => {
    async function trackUTM() {
      try {
        // Buscar API Key do UTMfy
        const res = await api.get<Record<string, string>>("/settings");
        const apiKey = res.data?.["utmfyApiKey"];

        if (!apiKey) {
          return; // Sem API Key configurada
        }

        // Capturar parâmetros UTM da URL
        const urlParams = new URLSearchParams(window.location.search);
        const utmParams: Record<string, string> = {};

        const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
        let hasUTM = false;

        for (const key of utmKeys) {
          const value = urlParams.get(key);
          if (value) {
            utmParams[key] = value;
            hasUTM = true;
          }
        }

        // Se não houver parâmetros UTM, não fazer nada
        if (!hasUTM) {
          return;
        }

        // Enviar para API UTMfy (assumindo endpoint padrão)
        // Ajuste a URL conforme a documentação do UTMfy
        try {
          await fetch("https://api.utmfy.com/track", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              ...utmParams,
              url: window.location.href,
              timestamp: new Date().toISOString()
            })
          });
        } catch (error) {
          console.error("Erro ao enviar dados para UTMfy:", error);
          // Não bloquear o fluxo se houver erro
        }
      } catch (error) {
        console.error("Erro ao processar UTM tracking:", error);
      }
    }

    void trackUTM();
  }, []);

  return null;
}
