import { useEffect, useState, useMemo } from "react";
import { GameCard } from "../components/GameCard";
import { api } from "../services/api";

type Game = {
  id: number;
  name: string;
  providerId: number;
  externalId: string;
  imageUrl?: string | null;
  active: boolean;
};

type Provider = {
  id: number;
  name: string;
  externalId?: string;
  active: boolean;
};

type FilterType = "popular" | "slots" | "recente" | "favoritos" | "vip";

function BannerImage({ imageUrl, title, bannerId }: { imageUrl: string; title?: string; bannerId: number }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="banner-content">
        <span className="badge-gold">Promoção</span>
        <h1>{title || "Banner promocional"}</h1>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "160px",
        borderRadius: "16px",
        overflow: "hidden"
      }}
    >
      <img
        src={imageUrl || ""}
        alt={title || "Banner"}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }}
        onError={(e) => {
          console.error("❌ Erro ao carregar imagem do banner:", imageUrl);
          console.error("❌ Banner ID:", bannerId, "Title:", title);
          setImageError(true);
        }}
      />
      {title && (
        <div
          className="banner-content"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            padding: "16px"
          }}
        >
          <h1 style={{ margin: 0, fontSize: "18px" }}>{title}</h1>
        </div>
      )}
    </div>
  );
}

type Banner = {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: number;
  active: boolean;
};

export function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("popular");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Carregar favoritos do localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem("gameFavorites");
    if (savedFavorites) {
      try {
        const favArray = JSON.parse(savedFavorites) as number[];
        setFavorites(new Set(favArray));
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
      }
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [gamesRes, providersRes, bannersRes] = await Promise.all([
          api.get<Game[]>("/games"),
          api.get<Provider[]>("/providers"),
          api.get<Banner[]>("/banners").catch(() => ({ data: [] }))
        ]);
        setGames(gamesRes.data.filter((g) => g.active));
        setProviders(providersRes.data);
        setBanners(bannersRes.data.filter((b) => b.active));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getProviderName = (providerId: number) => {
    return providers.find((p) => p.id === providerId)?.name || "Provedor";
  };

  // Filtrar e ordenar jogos baseado no filtro ativo
  const filteredGames = useMemo(() => {
    let filtered = [...games];

    switch (activeFilter) {
      case "popular":
        // Popular: ordenar por ID (mais recentes primeiro, assumindo que IDs maiores = mais recentes)
        filtered = filtered.sort((a, b) => b.id - a.id);
        break;

      case "slots":
        // Slots: filtrar jogos que contenham palavras-chave de slots ou sejam de provedores conhecidos de slots
        const slotKeywords = ["slot", "slots", "reel", "spin", "jackpot"];
        const slotProviders = ["pg soft", "pragmatic", "pragmatic play", "netent", "netentertainment"];
        filtered = filtered.filter((game) => {
          const gameName = game.name.toLowerCase();
          const providerName = getProviderName(game.providerId).toLowerCase();
          return (
            slotKeywords.some((keyword) => gameName.includes(keyword)) ||
            slotProviders.some((provider) => providerName.includes(provider))
          );
        });
        // Ordenar por nome
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case "recente":
        // Recente: ordenar por ID DESC (mais recentes primeiro)
        filtered = filtered.sort((a, b) => b.id - a.id);
        break;

      case "favoritos":
        // Favoritos: apenas jogos marcados como favoritos
        filtered = filtered.filter((game) => favorites.has(game.id));
        // Ordenar por nome
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case "vip":
        // VIP: jogos de provedores premium ou com nomes específicos
        const vipProviders = ["evolution", "evolution gaming", "ezugi", "netent"];
        const vipKeywords = ["vip", "premium", "exclusive", "live", "casino"];
        filtered = filtered.filter((game) => {
          const gameName = game.name.toLowerCase();
          const providerName = getProviderName(game.providerId).toLowerCase();
          return (
            vipProviders.some((provider) => providerName.includes(provider)) ||
            vipKeywords.some((keyword) => gameName.includes(keyword))
          );
        });
        // Ordenar por nome
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;

      default:
        break;
    }

    return filtered;
  }, [games, activeFilter, favorites, providers]);

  const getImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const baseUrl = api.defaults.baseURL?.replace("/api", "") || "";
    return `${baseUrl}${url}`;
  };

  const activeBanners = banners.filter((b) => b.active).sort((a, b) => a.position - b.position);

  return (
    <div className="home-layout">
      {activeBanners.length > 0 ? (
        activeBanners.map((banner) => {
          const imageUrl = getImageUrl(banner.imageUrl || "");
          
          return (
            <section
              key={banner.id}
              className="banner"
              style={{
                cursor: banner.linkUrl ? "pointer" : "default"
              }}
              onClick={() => {
                if (banner.linkUrl) {
                  if (banner.linkUrl.startsWith("http")) {
                    window.open(banner.linkUrl, "_blank");
                  } else {
                    window.location.href = banner.linkUrl;
                  }
                }
              }}
            >
            {banner.imageUrl ? (
              <BannerImage
                imageUrl={imageUrl}
                title={banner.title}
                bannerId={banner.id}
              />
            ) : (
              <div className="banner-content">
                <span className="badge-gold">Promoção</span>
                <h1>{banner.title || "Banner promocional"}</h1>
              </div>
            )}
            </section>
          );
        })
      ) : (
      <section className="banner">
        <div className="banner-content">
          <span className="badge-gold">Bônus de boas-vindas</span>
          <h1>Recarregue e ganhe até R$ 7.777</h1>
          <p>Promoções exclusivas e jackpots progressivos.</p>
        </div>
      </section>
      )}

      <section className="tabs-row">
        <button
          className={`tab ${activeFilter === "popular" ? "tab-active" : ""}`}
          onClick={() => setActiveFilter("popular")}
        >
          Popular
        </button>
        <button
          className={`tab ${activeFilter === "slots" ? "tab-active" : ""}`}
          onClick={() => setActiveFilter("slots")}
        >
          Slots
        </button>
        <button
          className={`tab ${activeFilter === "recente" ? "tab-active" : ""}`}
          onClick={() => setActiveFilter("recente")}
        >
          Recente
        </button>
        <button
          className={`tab ${activeFilter === "favoritos" ? "tab-active" : ""}`}
          onClick={() => setActiveFilter("favoritos")}
        >
          Favoritos {favorites.size > 0 && `(${favorites.size})`}
        </button>
        <button
          className={`tab ${activeFilter === "vip" ? "tab-active" : ""}`}
          onClick={() => setActiveFilter("vip")}
        >
          VIP
        </button>
      </section>

      <section className="jackpot-bar">
        <span className="jackpot-label">JACKPOT</span>
        <span className="jackpot-value">115.752.746,45</span>
      </section>

      <section className="games-grid">
        {loading ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
            Carregando jogos...
          </div>
        ) : filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <GameCard
              key={game.id}
              title={game.name}
              provider={getProviderName(game.providerId)}
              gameId={game.id}
              imageUrl={game.imageUrl || undefined}
              isFavorite={favorites.has(game.id)}
              onToggleFavorite={(gameId) => {
                const newFavorites = new Set(favorites);
                if (newFavorites.has(gameId)) {
                  newFavorites.delete(gameId);
                } else {
                  newFavorites.add(gameId);
                }
                setFavorites(newFavorites);
                localStorage.setItem("gameFavorites", JSON.stringify(Array.from(newFavorites)));
              }}
            />
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
            {activeFilter === "favoritos"
              ? "Nenhum jogo favorito. Clique no coração nos jogos para adicionar aos favoritos."
              : activeFilter === "slots"
              ? "Nenhum jogo de slots encontrado."
              : activeFilter === "vip"
              ? "Nenhum jogo VIP encontrado."
              : "Nenhum jogo cadastrado. Adicione jogos no painel admin."}
          </div>
        )}
      </section>
    </div>
  );
}


