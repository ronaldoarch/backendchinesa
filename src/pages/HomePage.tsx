import { useEffect, useState } from "react";
import { GameCard } from "../components/GameCard";
import { api } from "../services/api";

type Game = {
  id: number;
  name: string;
  providerId: number;
  externalId: string;
  active: boolean;
};

type Provider = {
  id: number;
  name: string;
  externalId?: string;
  active: boolean;
};

export function HomePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [gamesRes, providersRes] = await Promise.all([
          api.get<Game[]>("/games"),
          api.get<Provider[]>("/providers")
        ]);
        setGames(gamesRes.data.filter((g) => g.active));
        setProviders(providersRes.data);
      } catch (error) {
        console.error("Erro ao carregar jogos:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getProviderName = (providerId: number) => {
    return providers.find((p) => p.id === providerId)?.name || "Provedor";
  };

  return (
    <div className="home-layout">
      <section className="banner">
        <div className="banner-content">
          <span className="badge-gold">Bônus de boas-vindas</span>
          <h1>Recarregue e ganhe até R$ 7.777</h1>
          <p>Promoções exclusivas e jackpots progressivos.</p>
        </div>
      </section>

      <section className="tabs-row">
        <button className="tab tab-active">Popular</button>
        <button className="tab">Slots</button>
        <button className="tab">Recente</button>
        <button className="tab">Favoritos</button>
        <button className="tab">VIP</button>
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
        ) : games.length > 0 ? (
          games.map((game) => (
            <GameCard
              key={game.id}
              title={game.name}
              provider={getProviderName(game.providerId)}
            />
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
            Nenhum jogo cadastrado. Adicione jogos no painel admin.
          </div>
        )}
      </section>
    </div>
  );
}


