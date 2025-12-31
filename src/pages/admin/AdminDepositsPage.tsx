import { useState, useEffect } from "react";
import { api } from "../../services/api";

type Transaction = {
  id: number;
  userId: number;
  requestNumber: string;
  transactionId?: string | null;
  paymentMethod: "PIX" | "CARD" | "BOLETO" | "WITHDRAW";
  amount: number;
  status: string;
  qrCode?: string | null;
  barcode?: string | null;
  digitableLine?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
  user?: {
    id: number;
    username: string;
  };
};

type Settings = Record<string, string>;

export function AdminDepositsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxWithdrawLimit, setMaxWithdrawLimit] = useState<string>("10000");
  const [savingLimit, setSavingLimit] = useState(false);

  useEffect(() => {
    void loadTransactions();
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await api.get<Settings>("/settings");
      const limit = res.data["withdraw.maxLimit"] || "10000";
      setMaxWithdrawLimit(limit);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    }
  }

  async function saveMaxWithdrawLimit() {
    setSavingLimit(true);
    try {
      await api.put("/settings", {
        "withdraw.maxLimit": maxWithdrawLimit
      });
      alert("Limite máximo de saque atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar limite:", error);
      alert("Erro ao salvar limite máximo de saque");
    } finally {
      setSavingLimit(false);
    }
  }

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await api.get<Transaction[]>("/payments/admin/transactions");
      setTransactions(res.data);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  async function approveWithdraw(transactionId: number, requestNumber: string) {
    if (!confirm("Deseja aprovar este saque?")) return;
    
    try {
      await api.post(`/payments/admin/withdraws/${transactionId}/approve`, { requestNumber });
      alert("Saque aprovado com sucesso!");
      await loadTransactions();
    } catch (error: any) {
      console.error("Erro ao aprovar saque:", error);
      alert(error.response?.data?.message || "Erro ao aprovar saque");
    }
  }

  async function rejectWithdraw(transactionId: number, requestNumber: string) {
    const reason = prompt("Motivo da rejeição:");
    if (!reason) return;
    
    try {
      await api.post(`/payments/admin/withdraws/${transactionId}/reject`, { requestNumber, reason });
      alert("Saque rejeitado com sucesso!");
      await loadTransactions();
    } catch (error: any) {
      console.error("Erro ao rejeitar saque:", error);
      alert(error.response?.data?.message || "Erro ao rejeitar saque");
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID_OUT":
        return "#4ade80";
      case "PENDING":
        return "#fbbf24";
      case "FAILED":
      case "CANCELED":
        return "#ef4444";
      default:
        return "var(--text-muted)";
    }
  };

  const getStatusLabel = (status: string, metadata?: any) => {
    switch (status.toUpperCase()) {
      case "PAID_OUT":
        return "Pago";
      case "PENDING":
        if (metadata?.needsAnalysis || metadata?.reason) {
          return "Em Análise";
        }
        return "Pendente";
      case "ANALYSIS":
        return "Em Análise";
      case "FAILED":
        return "Falhou";
      case "CANCELED":
        return "Cancelado";
      case "COMPLETED":
        return "Concluído";
      default:
        return status;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "PIX":
        return "PIX";
      case "CARD":
        return "Cartão";
      case "BOLETO":
        return "Boleto";
      case "WITHDRAW":
        return "Saque";
      default:
        return method;
    }
  };

  const isWithdraw = (transaction: Transaction) => {
    return transaction.paymentMethod === "WITHDRAW" || transaction.amount < 0;
  };

  const needsApproval = (transaction: Transaction) => {
    return (
      isWithdraw(transaction) &&
      (transaction.status === "PENDING" || 
       transaction.status === "ANALYSIS" ||
       transaction.metadata?.needsAnalysis)
    );
  };

  const formatAmount = (amount: number | string): string => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return "0,00";
    return numAmount.toFixed(2).replace(".", ",");
  };

  if (loading) {
    return (
      <section className="admin-section">
        <p>Carregando transações...</p>
      </section>
    );
  }

  const deposits = transactions.filter(t => !isWithdraw(t));
  const withdraws = transactions.filter(t => isWithdraw(t));
  const pendingWithdraws = withdraws.filter(t => needsApproval(t));

  return (
    <section className="admin-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1>Depósitos e Saques</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>
            Gerencie depósitos e saques dos usuários. Configure o limite máximo de saque.
          </p>
        </div>
      </div>

      {/* Configuração de Limite Máximo de Saque */}
      <div style={{ 
        background: "var(--bg-secondary)", 
        padding: "20px", 
        borderRadius: "8px", 
        marginBottom: "24px",
        border: "1px solid var(--border)"
      }}>
        <h2 style={{ marginTop: 0, marginBottom: "12px", fontSize: "18px" }}>Configurações de Saque</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Limite Máximo de Saque (R$)
            </label>
            <input
              type="number"
              value={maxWithdrawLimit}
              onChange={(e) => setMaxWithdrawLimit(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--bg-main)",
                color: "var(--text-main)",
                fontSize: "16px"
              }}
              min="0"
              step="0.01"
            />
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
              Saques acima deste valor ou sem saldo na SuitPay serão enviados para análise.
            </p>
          </div>
          <button
            className="btn btn-gold"
            onClick={saveMaxWithdrawLimit}
            disabled={savingLimit}
            style={{ padding: "10px 20px", whiteSpace: "nowrap" }}
          >
            {savingLimit ? "Salvando..." : "Salvar Limite"}
          </button>
        </div>
      </div>

      {/* Saques Pendentes de Aprovação */}
      {pendingWithdraws.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "12px", color: "#fbbf24" }}>
            ⚠️ Saques Pendentes de Aprovação ({pendingWithdraws.length})
          </h2>
          <div style={{ 
            background: "rgba(251, 191, 36, 0.1)", 
            padding: "16px", 
            borderRadius: "8px",
            border: "1px solid #fbbf24"
          }}>
            {pendingWithdraws.map((t) => (
              <div key={t.id} style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "12px",
                background: "var(--bg-main)",
                borderRadius: "6px",
                marginBottom: "8px"
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {t.user?.username || `Usuário #${t.userId}`} - R$ {formatAmount(Math.abs(Number(t.amount)))}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {t.metadata?.pixKey && `PIX: ${t.metadata.pixKey}`}
                    {t.metadata?.reason && ` | Motivo: ${t.metadata.reason}`}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {new Date(t.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn"
                    onClick={() => approveWithdraw(t.id, t.requestNumber)}
                    style={{ background: "#4ade80", color: "#fff", border: "none" }}
                  >
                    ✓ Aprovar
                  </button>
                  <button
                    className="btn"
                    onClick={() => rejectWithdraw(t.id, t.requestNumber)}
                    style={{ background: "#ef4444", color: "#fff", border: "none" }}
                  >
                    ✗ Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs para Depósitos e Saques */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "8px", borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => {
            const depositsTab = document.getElementById("deposits-tab");
            const withdrawsTab = document.getElementById("withdraws-tab");
            if (depositsTab) depositsTab.style.display = "block";
            if (withdrawsTab) withdrawsTab.style.display = "none";
          }}
          style={{
            padding: "10px 20px",
            background: "transparent",
            border: "none",
            borderBottom: "2px solid var(--gold)",
            color: "var(--gold)",
            cursor: "pointer",
            fontWeight: 600
          }}
        >
          Depósitos ({deposits.length})
        </button>
        <button
          onClick={() => {
            const depositsTab = document.getElementById("deposits-tab");
            const withdrawsTab = document.getElementById("withdraws-tab");
            if (depositsTab) depositsTab.style.display = "none";
            if (withdrawsTab) withdrawsTab.style.display = "block";
          }}
          style={{
            padding: "10px 20px",
            background: "transparent",
            border: "none",
            borderBottom: "2px solid transparent",
            color: "var(--text-muted)",
            cursor: "pointer"
          }}
        >
          Saques ({withdraws.length})
        </button>
      </div>

      {/* Tabela de Depósitos */}
      <div id="deposits-tab">
        {deposits.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            Nenhum depósito encontrado.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuário</th>
                <th>Método</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.user?.username || `Usuário #${t.userId}`}</td>
                  <td>{getMethodLabel(t.paymentMethod)}</td>
                  <td style={{ color: "#4ade80" }}>+ R$ {formatAmount(t.amount)}</td>
                  <td>
                    <span
                      style={{
                        color: getStatusColor(t.status),
                        fontWeight: t.status === "PAID_OUT" ? 600 : 400
                      }}
                    >
                      {getStatusLabel(t.status, t.metadata)}
                    </span>
                  </td>
                  <td>{new Date(t.createdAt).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tabela de Saques */}
      <div id="withdraws-tab" style={{ display: "none" }}>
        {withdraws.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>
            Nenhum saque encontrado.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuário</th>
                <th>PIX Key</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {withdraws.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.user?.username || `Usuário #${t.userId}`}</td>
                  <td style={{ fontSize: "12px" }}>
                    {t.metadata?.pixKey || "-"}
                  </td>
                  <td style={{ color: "#ef4444" }}>- R$ {formatAmount(Math.abs(Number(t.amount)))}</td>
                  <td>
                    <span
                      style={{
                        color: getStatusColor(t.status),
                        fontWeight: t.status === "COMPLETED" ? 600 : 400
                      }}
                    >
                      {getStatusLabel(t.status, t.metadata)}
                    </span>
                  </td>
                  <td>{new Date(t.createdAt).toLocaleString("pt-BR")}</td>
                  <td>
                    {needsApproval(t) ? (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          className="btn"
                          onClick={() => approveWithdraw(t.id, t.requestNumber)}
                          style={{ 
                            background: "#4ade80", 
                            color: "#fff", 
                            border: "none",
                            padding: "4px 8px",
                            fontSize: "12px"
                          }}
                        >
                          Aprovar
                        </button>
                        <button
                          className="btn"
                          onClick={() => rejectWithdraw(t.id, t.requestNumber)}
                          style={{ 
                            background: "#ef4444", 
                            color: "#fff", 
                            border: "none",
                            padding: "4px 8px",
                            fontSize: "12px"
                          }}
                        >
                          Rejeitar
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
