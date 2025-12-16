import { useState, useEffect } from "react";
import { api } from "../../services/api";

type DashboardStats = {
  totalUsers: number;
  newUsersToday: number;
  totalDeposits: number;
  depositsToday: number;
  totalWithdrawals: number;
  withdrawalsToday: number;
  totalBets: number;
  totalBonus: number;
  conversionRate: number;
  ftdToday: number;
  activeUsers: number;
  averageTicket: number;
  depositStatus: {
    paid: number;
    pending: number;
    failed: number;
  };
};

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<DashboardStats>("/stats/dashboard");
      setStats(res.data);
    } catch (err: any) {
      console.error("Erro ao carregar estatísticas:", err);
      setError(err.response?.data?.error || "Erro ao carregar estatísticas");
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  if (loading) {
    return (
      <section className="admin-section">
        <h1>Dashboard</h1>
        <p>Carregando estatísticas...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-section">
        <h1>Dashboard</h1>
        <div style={{ color: "var(--error)", marginBottom: "16px" }}>{error}</div>
        <button className="btn btn-gold" onClick={loadStats}>
          Tentar novamente
        </button>
      </section>
    );
  }

  if (!stats) {
    return (
      <section className="admin-section">
        <h1>Dashboard</h1>
        <p>Nenhum dado disponível</p>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Dashboard</h1>
        <button className="btn btn-gold" onClick={loadStats} style={{ fontSize: "12px", padding: "6px 12px" }}>
          Atualizar
        </button>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-card">
          <span className="admin-card-label">Total de Depósitos</span>
          <strong className="admin-card-value">
            {formatCurrency(stats.totalDeposits)}
          </strong>
          <small style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Hoje: {formatCurrency(stats.depositsToday)}
          </small>
        </div>

        <div className="admin-card">
          <span className="admin-card-label">Total de Usuários</span>
          <strong className="admin-card-value">{stats.totalUsers}</strong>
          <small style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Novos hoje: {stats.newUsersToday}
          </small>
        </div>

        <div className="admin-card">
          <span className="admin-card-label">Taxa de Conversão</span>
          <strong className="admin-card-value">{stats.conversionRate.toFixed(2)}%</strong>
          <small style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Usuários que depositaram
          </small>
        </div>

        <div className="admin-card">
          <span className="admin-card-label">FTD Hoje</span>
          <strong className="admin-card-value">{stats.ftdToday}</strong>
          <small style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Primeiros depósitos
          </small>
        </div>

        <div className="admin-card">
          <span className="admin-card-label">Total de Saques</span>
          <strong className="admin-card-value">
            {formatCurrency(stats.totalWithdrawals)}
          </strong>
          <small style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Hoje: {formatCurrency(stats.withdrawalsToday)}
          </small>
        </div>

        <div className="admin-card">
          <span className="admin-card-label">Usuários Ativos</span>
          <strong className="admin-card-value">{stats.activeUsers}</strong>
          <small style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Últimos 30 dias
          </small>
        </div>

        <div className="admin-card">
          <span className="admin-card-label">Ticket Médio</span>
          <strong className="admin-card-value">
            {formatCurrency(stats.averageTicket)}
          </strong>
          <small style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Média por depósito
          </small>
        </div>

        <div className="admin-card">
          <span className="admin-card-label">Status dos Depósitos</span>
          <div style={{ marginTop: "8px", fontSize: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ color: "#34c759" }}>✓</span>
              <span>Pagos: {stats.depositStatus?.paid ?? 0}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <span style={{ color: "var(--gold)" }}>⏳</span>
              <span>Pendentes: {stats.depositStatus?.pending ?? 0}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "var(--error)" }}>✗</span>
              <span>Falhados: {stats.depositStatus?.failed ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


