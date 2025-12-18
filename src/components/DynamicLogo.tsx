import { useEffect, useState } from "react";
import { api, getImageUrl } from "../services/api";

type Props = {
  fallback?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function DynamicLogo({ fallback, className, style }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<Record<string, string>>("/settings");
        const url = res.data["branding.logoUrl"];
        setLogoUrl(url || null);
      } catch (error) {
        console.error("Erro ao carregar logo:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  if (loading) {
    return fallback ? <>{fallback}</> : null;
  }

  if (!logoUrl) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <img
      src={getImageUrl(logoUrl) || ""}
      alt="Logo"
      className={className}
      style={style}
      onError={(e) => {
        // Se a imagem falhar, mostrar fallback
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
