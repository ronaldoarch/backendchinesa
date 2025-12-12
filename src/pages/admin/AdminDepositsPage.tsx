import { useState, useEffect } from "react";
import { api } from "../../services/api";

type Transaction = {
  id: number;
  userId: number;
  requestNumber: string;
  transactionId?: string | null;
  paymentMethod: "PIX" | "CARD" | "BOLETO";
  amount: number;
  status: string;
  qrCode?: string | null;
  barcode?: string | null;
  digitableLine?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export function AdminDepositsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadTransactions();
  }, []);

  async function loadTransactions() {
    setLoading(true);
    try {
      // Buscar todas as transações (seria necessário criar endpoint admin para isso)
      // Por enquanto, vamos apenas mostrar uma mensagem
      setTransactions([]);
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    } finally {
      setLoading(false);
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

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "PIX":
        return "PIX";
      case "CARD":
        return "Cartão";
      case "BOLETO":
        return "Boleto";
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <section className="admin-section">
        <p>Carregando depósitos...</p>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <h1>Depósitos</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Visualize todas as transações de depósito realizadas pelos usuários.
      </p>

      {transactions.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>
          Nenhuma transação encontrada. As transações aparecerão aqui quando os usuários fizerem depósitos.
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
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.userId}</td>
                <td>{getMethodLabel(t.paymentMethod)}</td>
                <td>R$ {t.amount.toFixed(2)}</td>
                <td>
                  <span
                    style={{
                      color: getStatusColor(t.status),
                      fontWeight: t.status === "PAID_OUT" ? 600 : 400
                    }}
                  >
                    {getStatusLabel(t.status)}
                  </span>
                </td>
                <td>{new Date(t.createdAt).toLocaleDateString("pt-BR")}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      // Ver detalhes da transação
                      console.log("Detalhes:", t);
                    }}
                  >
                    Ver detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
