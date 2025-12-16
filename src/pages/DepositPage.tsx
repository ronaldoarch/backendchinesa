import { useState, useEffect } from "react";
import { api } from "../services/api";
import { getUser } from "../services/api";
import { trackFacebookEvent } from "../components/FacebookPixel";

type PaymentMethod = "PIX" | "CARD" | "BOLETO";

type Transaction = {
  id: number;
  requestNumber: string;
  transactionId?: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: string;
  qrCode?: string;
  qrCodeBase64?: string;
  barcode?: string;
  digitableLine?: string;
  dueDate?: string;
};

export function DepositPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("PIX");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = getUser();
    setUser(savedUser);
  }, []);

  const quickAmounts = [50, 100, 500, 1000, 3000, 5000, 10000, 50000];

  const handleAmountClick = (value: number) => {
    setAmount(value.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("Você precisa estar logado para fazer um depósito");
      return;
    }

    const amountValue = parseFloat(amount.replace(/[^\d,]/g, "").replace(",", "."));
    
    if (isNaN(amountValue) || amountValue < 10 || amountValue > 50000) {
      setError("Valor inválido. Mínimo: R$ 10,00 | Máximo: R$ 50.000,00");
      return;
    }

    setLoading(true);
    setError(null);
    setTransaction(null);

    try {
      const clientData = {
        name: user.username || "Cliente",
        email: user.email || undefined,
        document: user.document || undefined,
        phone: user.phone || undefined
      };

      let response;
      
      if (selectedMethod === "PIX") {
        // Calcular data de vencimento (1 dia a partir de agora)
        const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        response = await api.post<{ success: boolean; transaction: Transaction }>("/payments/pix", {
          amount: amountValue,
          dueDate,
          client: clientData
        });
      } else if (selectedMethod === "CARD") {
        // Para cartão, precisaríamos de um formulário de cartão
        setError("Pagamento com cartão em desenvolvimento. Use PIX por enquanto.");
        setLoading(false);
        return;
      } else {
        // Boleto
        const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        
        response = await api.post<{ success: boolean; transaction: Transaction }>("/payments/boleto", {
          amount: amountValue,
          dueDate,
          client: {
            ...clientData,
            document: clientData.document || "00000000000" // Boleto requer documento
          }
        });
      }

      if (response.data.success && response.data.transaction) {
        setTransaction(response.data.transaction);
        setAmount("");

        // Disparar evento do Facebook Pixel
        trackFacebookEvent("AddPaymentInfo", {
          value: amountValue,
          currency: "BRL"
        });
      } else {
        setError("Erro ao criar pagamento. Tente novamente.");
      }
    } catch (error: any) {
      console.error("Erro ao criar pagamento:", error);
      let errorMsg = "Erro ao processar pagamento";
      
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      // Mensagens mais amigáveis para erros comuns
      if (errorMsg.includes("ENOTFOUND") || errorMsg.includes("conexão") || errorMsg.includes("conectar")) {
        errorMsg = "Erro de conexão com o gateway de pagamento. Verifique a configuração do SuitPay.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="deposit-page">
      <header className="deposit-header">
        <h1>Depósito online</h1>
      </header>

      <section className="deposit-section">
        <div className="deposit-provider-card">
          <div className="deposit-provider-logo">🏦</div>
          <div className="deposit-provider-info">
            <span>SuitPay</span>
            <small>Gateway de pagamento</small>
          </div>
        </div>

        <div className="deposit-method-tabs">
          <button
            className={`deposit-method-tab ${selectedMethod === "PIX" ? "deposit-method-tab-active" : ""}`}
            onClick={() => setSelectedMethod("PIX")}
            type="button"
          >
            PIX
          </button>
        </div>

        {transaction && transaction.status === "PENDING" && (
          <div style={{
            padding: "16px",
            background: "rgba(246, 196, 83, 0.1)",
            border: "1px solid var(--gold)",
            borderRadius: "8px",
            marginBottom: "16px"
          }}>
            <h3 style={{ marginTop: 0, color: "var(--gold)" }}>Pagamento criado com sucesso!</h3>
            
            {selectedMethod === "PIX" && transaction.qrCode && (
              <div>
                <p>Escaneie o QR Code abaixo para pagar:</p>
                {transaction.qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${transaction.qrCodeBase64}`}
                    alt="QR Code PIX"
                    style={{
                      maxWidth: "100%",
                      height: "auto",
                      margin: "16px 0",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px"
                    }}
                  />
                ) : (
                  <div style={{
                    padding: "16px",
                    background: "#fff",
                    borderRadius: "8px",
                    margin: "16px 0",
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                    fontSize: "12px"
                  }}>
                    {transaction.qrCode}
                  </div>
                )}
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                  Vencimento: {transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString("pt-BR") : "N/A"}
                </p>
              </div>
            )}

            {selectedMethod === "BOLETO" && transaction.digitableLine && (
              <div>
                <p>Linha digitável do boleto:</p>
                <div style={{
                  padding: "16px",
                  background: "#fff",
                  borderRadius: "8px",
                  margin: "16px 0",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  color: "#000",
                  fontWeight: 600
                }}>
                  {transaction.digitableLine}
                </div>
                {transaction.barcode && (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Código de barras: {transaction.barcode}
                  </p>
                )}
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                  Vencimento: {transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString("pt-BR") : "N/A"}
                </p>
              </div>
            )}

            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "16px" }}>
              Status: {transaction.status} | Aguardando pagamento...
            </p>
          </div>
        )}

        {error && (
          <div style={{
            padding: "12px",
            background: "rgba(255, 107, 107, 0.1)",
            border: "1px solid #ff6b6b",
            borderRadius: "8px",
            marginBottom: "16px",
            color: "#ff6b6b"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="deposit-amount-grid">
            {quickAmounts.map((v) => (
              <button
                key={v}
                className={`deposit-amount-btn ${amount === v.toString() ? "active" : ""}`}
                type="button"
                onClick={() => handleAmountClick(v)}
              >
                R$ {v.toLocaleString("pt-BR")}
              </button>
            ))}
          </div>

          <input
            className="deposit-input"
            placeholder="R$ Mínimo 10 – Máximo 50.000"
            value={amount}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d,]/g, "");
              setAmount(value);
            }}
            required
          />

          <button
            className="btn btn-gold deposit-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Processando..." : "Deposite agora"}
          </button>
        </form>
      </section>
    </div>
  );
}
