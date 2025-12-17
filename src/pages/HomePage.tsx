import { useEffect, useState, useMemo } from "react";
import { GameCard } from "../components/GameCard";
import { api, getUser } from "../services/api";

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

  if (imageError || !imageUrl) {
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
        aspectRatio: "16 / 9", // Proporção ideal para banners (16:9)
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
          // Silenciar erro 404 - arquivo não existe, mas já temos fallback
          // Apenas logar em modo debug se necessário
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ Imagem do banner não encontrada (404 esperado):", imageUrl);
          }
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
  const [showOfferPopup, setShowOfferPopup] = useState(false);
  const [user, setUser] = useState<any>(null);

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

  // Verificar se deve mostrar popup de ofertas
  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) {
      setUser(savedUser);
      // Verificar se já mostrou o popup hoje
      const lastPopupDate = localStorage.getItem("offerPopupDate");
      const today = new Date().toDateString();
      if (lastPopupDate !== today) {
        setShowOfferPopup(true);
      }
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        console.log("🔄 Carregando dados da API...", api.defaults.baseURL);
        const [gamesRes, providersRes, bannersRes] = await Promise.all([
          api.get<Game[]>("/games").catch((err) => {
            console.error("❌ Erro ao carregar jogos:", err.response?.status, err.message);
            throw err;
          }),
          api.get<Provider[]>("/providers").catch((err) => {
            console.error("❌ Erro ao carregar provedores:", err.response?.status, err.message);
            throw err;
          }),
          api.get<Banner[]>("/banners").catch((err) => {
            console.warn("⚠️ Erro ao carregar banners (continuando sem banners):", err.response?.status);
            return { data: [] };
          })
        ]);
        console.log("✅ Dados carregados:", {
          games: gamesRes.data?.length || 0,
          providers: providersRes.data?.length || 0,
          banners: bannersRes.data?.length || 0
        });
        setGames((gamesRes.data || []).filter((g) => g.active));
        setProviders(providersRes.data || []);
        setBanners((bannersRes.data || []).filter((b) => b.active));
      } catch (error: any) {
        console.error("❌ Erro ao carregar dados:", error);
        console.error("❌ URL da API:", api.defaults.baseURL);
        console.error("❌ Status:", error.response?.status);
        console.error("❌ Mensagem:", error.response?.data || error.message);
        // Manter arrays vazios em caso de erro
        setGames([]);
        setProviders([]);
        setBanners([]);
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
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Auto-rotacionar banners a cada 5 segundos
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const currentBanner = activeBanners[currentBannerIndex];

  return (
    <div className="home-layout">
      {/* Popup de Ofertas */}
      {showOfferPopup && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => {
            setShowOfferPopup(false);
            localStorage.setItem("offerPopupDate", new Date().toDateString());
          }}
        >
          <div 
            style={{
              background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
              border: "2px solid var(--gold)",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              position: "relative",
              boxShadow: "0 8px 32px rgba(246, 196, 83, 0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowOfferPopup(false);
                localStorage.setItem("offerPopupDate", new Date().toDateString());
              }}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "transparent",
                border: "none",
                color: "var(--gold)",
                fontSize: "24px",
                cursor: "pointer",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </button>
            
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <h2 style={{ 
                color: "var(--gold)", 
                margin: "0 0 8px 0",
                fontSize: "24px",
                fontWeight: "bold"
              }}>
                🎁 Oferta Especial!
              </h2>
              <p style={{ color: "var(--text-main)", margin: 0, fontSize: "14px" }}>
                Resgate seu bônus exclusivo
              </p>
            </div>

            <div style={{
              background: "rgba(246, 196, 83, 0.1)",
              border: "1px solid var(--gold)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "20px"
            }}>
              <h3 style={{ 
                color: "var(--gold)", 
                margin: "0 0 8px 0",
                fontSize: "18px"
              }}>
                💰 Baú de 30 reais
              </h3>
              <p style={{ 
                color: "var(--text-main)", 
                margin: "0 0 12px 0",
                fontSize: "14px",
                lineHeight: "1.5"
              }}>
                Aposte R$ 100,00 e ganhe R$ 30,00 de bônus!
              </p>
              <button
                onClick={() => {
                  window.location.href = "/promocoes?tab=recompensas";
                  setShowOfferPopup(false);
                  localStorage.setItem("offerPopupDate", new Date().toDateString());
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "var(--gold)",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "opacity 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
              >
                Ver Ofertas
              </button>
            </div>

            <p style={{ 
              color: "var(--text-muted)", 
              fontSize: "12px",
              textAlign: "center",
              margin: 0
            }}>
              Esta oferta aparece uma vez por dia
            </p>
          </div>
        </div>
      )}

      {activeBanners.length > 0 ? (
        <section
          className="banner"
          style={{
            cursor: currentBanner?.linkUrl ? "pointer" : "default",
            position: "relative"
          }}
          onClick={() => {
            if (currentBanner?.linkUrl) {
              if (currentBanner.linkUrl.startsWith("http")) {
                window.open(currentBanner.linkUrl, "_blank");
              } else {
                window.location.href = currentBanner.linkUrl;
              }
            }
          }}
        >
          {currentBanner?.imageUrl ? (
            <BannerImage
              imageUrl={getImageUrl(currentBanner.imageUrl || "")}
              title={currentBanner.title}
              bannerId={currentBanner.id}
            />
          ) : (
            <div className="banner-content">
              <span className="badge-gold">Promoção</span>
              <h1>{currentBanner?.title || "Banner promocional"}</h1>
            </div>
          )}
          
          {/* Indicadores de carrossel */}
          {activeBanners.length > 1 && (
            <div style={{
              position: "absolute",
              bottom: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "8px",
              zIndex: 10
            }}>
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBannerIndex(index);
                  }}
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    border: "none",
                    background: index === currentBannerIndex ? "var(--gold)" : "rgba(255, 255, 255, 0.3)",
                    cursor: "pointer",
                    transition: "background 0.3s"
                  }}
                  aria-label={`Banner ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Botões de navegação */}
          {activeBanners.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
                }}
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0, 0, 0, 0.5)",
                  border: "1px solid rgba(246, 196, 83, 0.3)",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  color: "var(--gold)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  zIndex: 10,
                  transition: "background 0.3s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
                }}
                aria-label="Banner anterior"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length);
                }}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(0, 0, 0, 0.5)",
                  border: "1px solid rgba(246, 196, 83, 0.3)",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  color: "var(--gold)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  zIndex: 10,
                  transition: "background 0.3s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
                }}
                aria-label="Próximo banner"
              >
                ›
              </button>
            </>
          )}
        </section>
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


