import { useState, useEffect } from "react";
import { api } from "../services/api";

type Transaction = {
  id: number;
  userId: number;
  requestNumber: string;
  transactionId?: string | null;
  paymentMethod: "PIX" | "CARD" | "BOLETO" | "WITHDRAW";
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ReportSummary = {
  totalDeposits: number;
  totalWithdrawals: number;
  totalAccumulated: number;
  totalBets: number;
  totalDepositAmount: number;
  totalWithdrawalAmount: number;
};

type ReportData = {
  success: boolean;
  transactions: Transaction[];
  summary: ReportSummary;
  filters: {
    startDate: string | null;
    endDate: string | null;
    type: string;
    status: string;
    platform: string;
  };
};

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"conta" | "apostas" | "relatorio">("relatorio");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  useEffect(() => {
    loadReports();
  }, [dateFilter, typeFilter, statusFilter, platformFilter]);

  async function loadReports() {
    try {
      setLoading(true);
      
      // Calcular datas baseado no filtro
      let startDate: string | null = null;
      let endDate: string | null = null;
      const today = new Date();
      
      if (dateFilter === "today") {
        startDate = today.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        startDate = weekAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        startDate = monthAgo.toISOString().split("T")[0];
        endDate = today.toISOString().split("T")[0];
      }

      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (platformFilter !== "all") params.append("platform", platformFilter);

      const response = await api.get<ReportData>(`/payments/reports?${params.toString()}`);
      setReportData(response.data);
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

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
        return "#6b7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID_OUT":
        return "Pago";
      case "PENDING":
        return "Pendente";
      case "FAILED":
        return "Falhou";
      case "CANCELED":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getTypeLabel = (method: string) => {
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

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #2b0c12 0%, #5d1824 100%)",
      color: "#fff",
      padding: "16px"
    }}>
      {/* Navegação */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: "16px",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <button
          onClick={() => setActiveTab("conta")}
          style={{
            flex: 1,
            padding: "12px",
            background: "transparent",
            border: "none",
            color: activeTab === "conta" ? "#fff" : "rgba(255, 255, 255, 0.6)",
            borderBottom: activeTab === "conta" ? "2px solid #ff3158" : "2px solid transparent",
            cursor: "pointer",
            fontWeight: activeTab === "conta" ? "600" : "400"
          }}
        >
          Conta
        </button>
        <button
          onClick={() => setActiveTab("apostas")}
          style={{
            flex: 1,
            padding: "12px",
            background: "transparent",
            border: "none",
            color: activeTab === "apostas" ? "#fff" : "rgba(255, 255, 255, 0.6)",
            borderBottom: activeTab === "apostas" ? "2px solid #ff3158" : "2px solid transparent",
            cursor: "pointer",
            fontWeight: activeTab === "apostas" ? "600" : "400"
          }}
        >
          Apostas
        </button>
        <button
          onClick={() => setActiveTab("relatorio")}
          style={{
            flex: 1,
            padding: "12px",
            background: "transparent",
            border: "none",
            color: activeTab === "relatorio" ? "#fff" : "rgba(255, 255, 255, 0.6)",
            borderBottom: activeTab === "relatorio" ? "2px solid #ff3158" : "2px solid transparent",
            cursor: "pointer",
            fontWeight: activeTab === "relatorio" ? "600" : "400"
          }}
        >
          Relatório
        </button>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: "16px",
        flexWrap: "wrap"
      }}>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          style={{
            flex: 1,
            minWidth: "120px",
            padding: "10px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px"
          }}
        >
          <option value="today">Hoje</option>
          <option value="week">Últimos 7 dias</option>
          <option value="month">Último mês</option>
          <option value="all">Todos</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            flex: 1,
            minWidth: "120px",
            padding: "10px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px"
          }}
        >
          <option value="all">Todos os Tipos</option>
          <option value="deposit">Depósitos</option>
          <option value="withdraw">Saques</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            flex: 1,
            minWidth: "120px",
            padding: "10px",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "14px"
          }}
        >
          <option value="all">Todos os Status</option>
          <option value="PAID_OUT">Pago</option>
          <option value="PENDING">Pendente</option>
          <option value="FAILED">Falhou</option>
          <option value="CANCELED">Cancelado</option>
        </select>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255, 255, 255, 0.6)" }}>
          Carregando relatórios...
        </div>
      ) : !reportData || reportData.transactions.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ 
            fontSize: "48px", 
            marginBottom: "16px",
            opacity: 0.5
          }}>📁</div>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "8px" }}>
            {dateFilter === "today" ? "Hoje Sem Registros" : "Sem Registros"}
          </p>
          {dateFilter === "today" && (
            <button
              onClick={() => setDateFilter("all")}
              style={{
                background: "transparent",
                border: "none",
                color: "#ff3158",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: "14px"
              }}
            >
              Ver mais
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Lista de transações */}
          <div style={{ marginBottom: "16px" }}>
            {reportData.transactions.map((transaction) => (
              <div
                key={transaction.id}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                      {getTypeLabel(transaction.paymentMethod)}
                    </div>
                    <div style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.6)" }}>
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ 
                      fontWeight: "600",
                      color: transaction.paymentMethod === "WITHDRAW" ? "#ef4444" : "#4ade80",
                      marginBottom: "4px"
                    }}>
                      {transaction.paymentMethod === "WITHDRAW" ? "-" : "+"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </div>
                    <div style={{ 
                      fontSize: "12px",
                      color: getStatusColor(transaction.status)
                    }}>
                      {getStatusLabel(transaction.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Resumo */}
          <div style={{
            background: "rgba(0, 0, 0, 0.3)",
            borderRadius: "12px",
            padding: "16px",
            marginTop: "16px"
          }}>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: "12px",
              fontSize: "14px"
            }}>
              <div>
                <div style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                  Depósito Total
                </div>
                <div style={{ color: "#4ade80", fontWeight: "600" }}>
                  {formatCurrency(reportData.summary.totalDeposits)}
                </div>
              </div>
              <div>
                <div style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                  Total de Saques
                </div>
                <div style={{ color: "#ef4444", fontWeight: "600" }}>
                  {formatCurrency(reportData.summary.totalWithdrawals)}
                </div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "4px" }}>
                  Acumulado Total
                </div>
                <div style={{ color: "#f6c453", fontWeight: "600" }}>
                  {formatCurrency(reportData.summary.totalAccumulated)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
