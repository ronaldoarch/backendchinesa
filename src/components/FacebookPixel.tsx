import { useEffect } from "react";
import { api } from "../services/api";

export function FacebookPixel() {
  useEffect(() => {
    async function loadPixelId() {
      try {
        const res = await api.get<Record<string, string>>("/settings");
        const pixelId = res.data?.["facebookPixelId"];

        if (!pixelId) {
          return; // Sem pixel ID configurado
        }

        // Carregar script do Facebook Pixel
        if (typeof window !== "undefined" && !(window as any).fbq) {
          const script = document.createElement("script");
          script.innerHTML = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `;
          document.head.appendChild(script);
        } else if ((window as any).fbq) {
          // Pixel já carregado, apenas track PageView
          (window as any).fbq("track", "PageView");
        }
      } catch (error) {
        console.error("Erro ao carregar Facebook Pixel:", error);
      }
    }

    void loadPixelId();
  }, []);

  return null;
}

// Função helper para disparar eventos do Pixel
export function trackFacebookEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq("track", eventName, params);
  }
}
