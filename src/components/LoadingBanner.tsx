import { useEffect, useState } from "react";
import { api, getImageUrl } from "../services/api";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

export function LoadingBanner({ className, style }: Props) {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<Record<string, string>>("/settings");
        const url = res.data["branding.loadingBannerUrl"];
        setBannerUrl(url || null);
      } catch (error) {
        console.error("Erro ao carregar banner de carregamento:", error);
      }
    })();
  }, []);


  if (!bannerUrl) {
    return null;
  }

  return (
    <img
      src={getImageUrl(bannerUrl) || ""}
      alt="Carregando..."
      className={className}
      style={style}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}
