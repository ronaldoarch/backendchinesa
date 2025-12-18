import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getUser } from "../services/api";

type Props = {
  user: { username: string } | null;
  onRequireAuth: () => void;
};

type Tab = "eventos" | "vip" | "rebate" | "recompensas" | "historico";

type Promotion = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  active: boolean;
  position: number;
};

export function PromotionsPage({ user, onRequireAuth }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(tabFromUrl || "eventos");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  // Atualizar tab quando a URL mudar
  useEffect(() => {
    if (tabFromUrl && ["eventos", "vip", "rebate", "recompensas", "historico"].includes(tabFromUrl)) {
      setTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    void loadPromotions();
  }, []);

  async function loadPromotions() {
    try {
      const res = await api.get<Promotion[]>("/promotions");
      setPromotions(res.data.filter((p) => p.active));
    } catch (error) {
      console.error("Erro ao carregar promoções:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleChangeTab(next: Tab) {
    if ((next === "vip" || next === "rebate") && !user) {
      onRequireAuth();
      return;
    }
    setTab(next);
    setSearchParams({ tab: next });
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
        {tab === "eventos" && <EventosView promotions={promotions.filter((p) => p.category === "eventos")} loading={loading} />}
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

function EventosView({ promotions, loading }: { promotions: Promotion[]; loading: boolean }) {
  return (
    <div className="promos-events">
      <div className="promos-filter-column">
        <button className="promos-filter-main">Tudo</button>
      </div>
      <div className="promos-cards-column">
        {loading ? (
          <div className="promos-empty">Carregando promoções...</div>
        ) : promotions.length > 0 ? (
          promotions.map((promo) => (
            <article key={promo.id} className="promo-event-card">
            <div className="promo-event-body">
                <h3>{promo.title}</h3>
                {promo.subtitle && (
                  <p className="promo-event-subtitle">{promo.subtitle}</p>
                )}
                {promo.description && (
                  <p className="promo-event-desc">{promo.description}</p>
                )}
            </div>
          </article>
          ))
        ) : (
          <div className="promos-empty">
            Nenhuma promoção disponível no momento.
          </div>
        )}
      </div>
    </div>
  );
}

function TarefaView() {
  const initialTasks = [
    { id: "birthday", title: "Definir aniversário", bonus: "1,00", completed: false },
    { id: "withdraw_password", title: "Definir senha de saque", bonus: "1,00", completed: false },
    { id: "withdraw_account", title: "Adicionar conta de saque", bonus: "1,00", completed: false },
    { id: "avatar", title: "Definir avatar", bonus: "1,00", completed: false },
    { id: "email", title: "Adicionar conta de email", bonus: "3,00", completed: false },
    { id: "first_withdraw", title: "Primeira retirada", bonus: "1,00", completed: false },
    { id: "treasure_100", title: "Baú de 30 reais para 100 apostados", bonus: "30,00", completed: false, requiredBet: 100 }
  ];
  
  const [tasks, setTasks] = useState(initialTasks);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      
      // Verificar status das tarefas usando initialTasks como base
      const updatedTasks = await Promise.all(
        initialTasks.map(async (task) => {
          if (task.id === "treasure_100") {
            try {
              // Verificar se já resgatou ou se atingiu 100 em apostas
              const rewardStatus = await api.get(`/rewards/status/${task.id}`);
              return {
                ...task,
                completed: rewardStatus?.data?.redeemed || false,
                progress: rewardStatus?.data?.totalBet || 0,
                canRedeem: (rewardStatus?.data?.totalBet || 0) >= 100 && !rewardStatus?.data?.redeemed
              };
            } catch (error) {
              // Se não estiver autenticado ou houver erro, retornar task sem progresso
              return task;
            }
          }
          return task;
        })
      );
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(taskId: string) {
    try {
      const response = await api.post(`/rewards/redeem`, { rewardId: taskId });
      if (response.data.success) {
        alert(`Bônus de R$ ${tasks.find(t => t.id === taskId)?.bonus} resgatado com sucesso!`);
        await loadUserData(); // Recarregar dados
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao resgatar recompensa");
    }
  }

  return (
    <div className="promos-tasks">
      <div className="promos-filter-column">
        <button className="promos-filter-main">Benefícios para novos</button>
        <button className="promos-filter-secondary">Histórico</button>
      </div>
      <div className="promos-cards-column">
        {loading ? (
          <div className="promos-empty">Carregando recompensas...</div>
        ) : (
          tasks.map((task) => (
            <article key={task.id} className="promo-task-card">
              <div>
                <h3>{task.title}</h3>
                <p className="promo-task-bonus">Bônus R$ {task.bonus}</p>
                {task.id === "treasure_100" && "progress" in task && (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Progresso: R$ {new Intl.NumberFormat("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }).format(task.progress || 0)} / R$ 100,00
                  </p>
                )}
              </div>
              <button 
                type="button" 
                className="promo-task-cta"
                onClick={() => handleRedeem(task.id)}
                disabled={task.completed || (task.id === "treasure_100" && !("canRedeem" in task ? task.canRedeem : false))}
                style={{
                  opacity: task.completed || (task.id === "treasure_100" && !("canRedeem" in task ? task.canRedeem : false)) ? 0.5 : 1,
                  cursor: task.completed || (task.id === "treasure_100" && !("canRedeem" in task ? task.canRedeem : false)) ? "not-allowed" : "pointer"
                }}
              >
                {task.completed ? "Resgatado" : "Resgatar"}
              </button>
            </article>
          ))
        )}
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

