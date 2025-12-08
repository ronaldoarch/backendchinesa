import { useState } from "react";

type Props = {
  user: { username: string } | null;
  onRequireAuth: () => void;
};

type Tab = "eventos" | "vip" | "rebate" | "recompensas" | "historico";

export function PromotionsPage({ user, onRequireAuth }: Props) {
  const [tab, setTab] = useState<Tab>("eventos");

  function handleChangeTab(next: Tab) {
    if ((next === "vip" || next === "rebate") && !user) {
      onRequireAuth();
      return;
    }
    setTab(next);
  }

  return (
    <div className="promos-page">
      <div className="promos-tabs">
        <button
          className={`promos-tab ${
            tab === "eventos" ? "promos-tab-active" : ""
          }`}
          onClick={() => handleChangeTab("eventos")}
        >
          Eventos
        </button>
        <button
          className={`promos-tab ${
            tab === "vip" ? "promos-tab-active" : ""
          } ${!user ? "promos-tab-locked" : ""}`}
          onClick={() => handleChangeTab("vip")}
        >
          VIP
        </button>
        <button
          className={`promos-tab ${
            tab === "rebate" ? "promos-tab-active" : ""
          } ${!user ? "promos-tab-locked" : ""}`}
          onClick={() => handleChangeTab("rebate")}
        >
          Taxa de Rebate
        </button>
        <button
          className={`promos-tab ${
            tab === "recompensas" ? "promos-tab-active" : ""
          }`}
          onClick={() => handleChangeTab("recompensas")}
        >
          Recompensas
        </button>
        <button
          className={`promos-tab ${
            tab === "historico" ? "promos-tab-active" : ""
          }`}
          onClick={() => handleChangeTab("historico")}
        >
          Histórico
        </button>
      </div>

      <div className="promos-content">
        {tab === "eventos" && <EventosView />}
        {tab === "vip" && <VipLevelsView user={user} />}
        {tab === "rebate" && <RebateView />}
        {tab === "recompensas" && <TarefaView />}
        {tab === "historico" && (
          <div className="promos-empty">
            Histórico de bônus aparecerá aqui no modo real.
          </div>
        )}
      </div>
    </div>
  );
}

function EventosView() {
  const cards = [
    {
      title: "Código de bônus",
      subtitle: "R$ 10 grátis",
      description: "Ative seu código diário e teste os jogos."
    },
    {
      title: "Bônus de check-in diário",
      subtitle: "Recompensas todos os dias",
      description: "Entre todos os dias para acumular bônus."
    },
    {
      title: "Depósito diário",
      subtitle: "Bônus máx. de R$ 18.888",
      description: "Recarregue e desbloqueie bônus progressivos."
    }
  ];

  return (
    <div className="promos-events">
      <div className="promos-filter-column">
        <button className="promos-filter-main">Tudo</button>
      </div>
      <div className="promos-cards-column">
        {cards.map((card) => (
          <article key={card.title} className="promo-event-card">
            <div className="promo-event-body">
              <h3>{card.title}</h3>
              <p className="promo-event-subtitle">{card.subtitle}</p>
              <p className="promo-event-desc">{card.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TarefaView() {
  const tasks = [
    { title: "Definir aniversário", bonus: "1,00" },
    { title: "Definir senha de saque", bonus: "1,00" },
    { title: "Adicionar conta de saque", bonus: "1,00" },
    { title: "Definir avatar", bonus: "1,00" },
    { title: "Adicionar conta de email", bonus: "3,00" },
    { title: "Primeira retirada", bonus: "1,00" }
  ];

  return (
    <div className="promos-tasks">
      <div className="promos-filter-column">
        <button className="promos-filter-main">Benefícios para novos</button>
        <button className="promos-filter-secondary">Histórico</button>
      </div>
      <div className="promos-cards-column">
        {tasks.map((task) => (
          <article key={task.title} className="promo-task-card">
            <div>
              <h3>{task.title}</h3>
              <p className="promo-task-bonus">Bônus {task.bonus}</p>
            </div>
            <button type="button" className="promo-task-cta">
              Resgatar
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}

function VipLevelsView({ user }: { user: { username: string } | null }) {
  if (!user) {
    return (
      <div className="promos-empty">
        Faça login ou registro para ver os benefícios VIP.
      </div>
    );
  }

  const levels = [
    { level: 0, requiredBet: "0", levelBonus: "0,00" },
    { level: 1, requiredBet: "5.000", levelBonus: "5,00" },
    { level: 2, requiredBet: "13.000", levelBonus: "18,00" },
    { level: 3, requiredBet: "93.000", levelBonus: "28,00" },
    { level: 4, requiredBet: "89.000", levelBonus: "58,00" }
  ];

  return (
    <div className="vip-wrapper">
      <div className="vip-header">
        <div>
          <span className="promos-badge">Nível atual</span>
          <p className="vip-text">
            Restantes <strong>VIP 1</strong> — você precisa apostar{" "}
            <strong>5.000,00</strong>
          </p>
        </div>
        <button className="btn btn-gold">Receber tudo</button>
      </div>

      <h3 className="vip-title">Lista de níveis VIP</h3>

      <div className="vip-subtabs">
        <button className="vip-subtab vip-subtab-active">
          Bônus de aumento de nível
        </button>
        <button className="vip-subtab">Privilégio VIP</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Nível</th>
            <th>Aposta para promoção</th>
            <th>Bônus de aumento de nível</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((l) => (
            <tr key={l.level}>
              <td>VIP {l.level}</td>
              <td>{l.requiredBet}</td>
              <td>{l.levelBonus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RebateView() {
  type RebateTab = "taxa" | "juros" | "historico";
  const [subTab, setSubTab] = useState<RebateTab>("taxa");

  if (subTab === "taxa") {
    const lines = Array.from({ length: 6 }).map((_, idx) => ({
      id: idx + 1,
      validBets: "0,00",
      rate: "0,00%",
      pending: "0,00"
    }));

    return (
      <div className="rebate-wrapper">
        <p className="rebate-info">
          Pode ser resgatado hoje <strong>0,00</strong>
        </p>
        <div className="rebate-subtabs">
          <button className="vip-subtab vip-subtab-active">Taxa de rebate</button>
          <button className="vip-subtab" onClick={() => setSubTab("juros")}>
            Juros
          </button>
          <button className="vip-subtab" onClick={() => setSubTab("historico")}>
            Histórico
          </button>
        </div>

        <div className="promos-cards-column">
          {lines.map((row) => (
            <article key={row.id} className="promo-event-card">
              <p className="promo-event-subtitle">
                Apostas válidas <strong>{row.validBets}</strong>
              </p>
              <p className="promo-event-desc">
                Taxa de rebate coletável <strong>{row.rate}</strong> — bônus{" "}
                <strong>{row.pending}</strong>
              </p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (subTab === "juros") {
    return (
      <div className="rebate-wrapper">
        <div className="rebate-subtabs">
          <button className="vip-subtab" onClick={() => setSubTab("taxa")}>
            Taxa de rebate
          </button>
          <button className="vip-subtab vip-subtab-active">Juros</button>
          <button className="vip-subtab" onClick={() => setSubTab("historico")}>
            Histórico
          </button>
        </div>
        <p className="promos-empty">
          Hoje sem registros de juros, mas aqui aparecerá a renda acumulada.
        </p>
      </div>
    );
  }

  return (
    <div className="rebate-wrapper">
      <div className="rebate-subtabs">
        <button className="vip-subtab" onClick={() => setSubTab("taxa")}>
          Taxa de rebate
        </button>
        <button className="vip-subtab" onClick={() => setSubTab("juros")}>
          Juros
        </button>
        <button className="vip-subtab vip-subtab-active">Histórico</button>
      </div>
      <p className="promos-empty">
        Hoje sem registros, mas você poderá visualizar o mês atual aqui.
      </p>
    </div>
  );
}

