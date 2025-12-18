import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getUser } from "../services/api";

type Props = {
  user: { username: string } | null;
  onRequireAuth: () => void;
};

type Tab = "eventos" | "vip" | "recompensas" | "historico";

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
    if (tabFromUrl && ["eventos", "vip", "recompensas", "historico"].includes(tabFromUrl)) {
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
    if (next === "vip" && !user) {
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
    { id: "withdraw_account", title: "Adicionar conta de saque", bonus: "1,00", completed: false },
    { id: "treasure_referral", title: "Baú de indicação", bonus: "30,00", completed: false }
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
          if (task.id === "withdraw_account") {
            try {
              // Verificar se já cadastrou chave PIX
              const userResponse = await api.get("/auth/me");
              const hasPixKey = !!userResponse.data.pix_key;
              const rewardStatus = await api.get(`/rewards/status/${task.id}`).catch(() => null);
              return {
                ...task,
                completed: rewardStatus?.data?.redeemed || false,
                hasPixKey
              };
            } catch (error) {
              return task;
            }
          }
          if (task.id === "treasure_referral") {
            try {
              // Verificar estatísticas de indicação
              const referralStats = await api.get("/referrals/stats");
              const referralsWithBonus = referralStats.data.referrals.filter((r: any) => r.bonusCredited).length;
              const rewardStatus = await api.get(`/rewards/status/${task.id}`).catch(() => null);
              return {
                ...task,
                completed: rewardStatus?.data?.redeemed || false,
                progress: referralsWithBonus,
                canRedeem: referralsWithBonus > 0 && !rewardStatus?.data?.redeemed,
                description: `Ganhe R$ 30 quando alguém se cadastrar pelo seu link e jogar R$ 100. Você já ganhou ${referralsWithBonus} bau(s)!`
              };
            } catch (error) {
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
    if (taskId === "withdraw_account") {
      // Direcionar para página de saque para cadastrar chave PIX
      window.location.href = "/deposito?tab=withdraw&registerPix=true";
      return;
    }
    
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
                {task.id === "withdraw_account" && "hasPixKey" in task && task.hasPixKey && (
                  <p style={{ fontSize: "12px", color: "var(--gold)", marginTop: "4px" }}>
                    ✓ Chave PIX cadastrada
                  </p>
                )}
                {task.id === "treasure_referral" && (
                  <div style={{ marginTop: "8px" }}>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>
                      Ganhe R$ 30 quando alguém se cadastrar pelo seu link e jogar R$ 100
                    </p>
                    {"progress" in task && (
                      <p style={{ fontSize: "12px", color: "var(--gold)", fontWeight: "bold" }}>
                        Baús ganhos: {task.progress || 0} | Total: R$ {((task.progress || 0) * 30).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {task.id === "treasure_referral" ? (
                <div style={{
                  padding: "8px 12px",
                  background: "rgba(246, 196, 83, 0.1)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  textAlign: "center"
                }}>
                  Bônus creditado automaticamente
                </div>
              ) : (
                <button 
                  type="button" 
                  className="promo-task-cta"
                  onClick={() => handleRedeem(task.id)}
                  disabled={task.completed}
                  style={{
                    opacity: task.completed ? 0.5 : 1,
                    cursor: task.completed ? "not-allowed" : "pointer"
                  }}
                >
                  {task.completed ? "Resgatado" : "Cadastrar PIX"}
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function VipLevelsView({ user }: { user: { username: string } | null }) {
  const [vipData, setVipData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bonus" | "privileges">("bonus");

  useEffect(() => {
    if (user) {
      loadVipData();
    }
  }, [user]);

  async function loadVipData() {
    try {
      setLoading(true);
      const response = await api.get("/vip/data");
      setVipData(response.data);
    } catch (error) {
      console.error("Erro ao carregar dados VIP:", error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="promos-empty">
        Faça login ou registro para ver os benefícios VIP.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="promos-empty">
        Carregando dados VIP...
      </div>
    );
  }

  if (!vipData) {
    return (
      <div className="promos-empty">
        Erro ao carregar dados VIP.
      </div>
    );
  }

  const { currentLevel, totalDeposit, nextLevel, remainingForNext, allLevels } = vipData;
  const currentLevelInfo = allLevels?.find((l: any) => l.level === currentLevel) || allLevels?.[0];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="vip-wrapper">
      <div className="vip-header">
        <div>
          <span className="promos-badge">Nível atual</span>
          <p className="vip-text">
            {nextLevel ? (
              <>
                Restantes <strong>VIP {nextLevel.level}</strong> — você precisa depositar{" "}
                <strong>{formatCurrency(remainingForNext)}</strong>
              </>
            ) : (
              <>
                Você atingiu o nível máximo <strong>VIP {currentLevel}</strong>
              </>
            )}
          </p>
        </div>
        <button className="btn btn-gold">Receber tudo</button>
      </div>

      <h3 className="vip-title">Lista de níveis VIP</h3>

      <div className="vip-subtabs">
        <button 
          className={`vip-subtab ${activeTab === "bonus" ? "vip-subtab-active" : ""}`}
          onClick={() => setActiveTab("bonus")}
        >
          Bônus de aumento de nível
        </button>
        <button 
          className={`vip-subtab ${activeTab === "privileges" ? "vip-subtab-active" : ""}`}
          onClick={() => setActiveTab("privileges")}
        >
          Privilégio VIP
        </button>
      </div>

      {activeTab === "bonus" ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nível</th>
              <th>Depósito para promoção</th>
              <th>Bônus de aumento de nível</th>
            </tr>
          </thead>
          <tbody>
            {allLevels?.map((level: any) => (
              <tr key={level.level}>
                <td>VIP {level.level}</td>
                <td>{formatCurrency(level.requiredDeposit)}</td>
                <td>R$ {formatCurrency(level.levelBonus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nível</th>
              <th>Limite diário de saques</th>
              <th>Número de saques diários</th>
              <th>Isenção de taxas diárias</th>
            </tr>
          </thead>
          <tbody>
            {allLevels?.map((level: any) => (
              <tr key={level.level}>
                <td>VIP {level.level}</td>
                <td>{level.privileges.dailyWithdrawLimit}</td>
                <td>{level.privileges.dailyWithdrawCount}</td>
                <td>{level.privileges.dailyFeeExemption} transações</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}


