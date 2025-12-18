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
  userId?: number;
};

export function DepositPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("PIX");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState<{ show: boolean; amount: number } | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedUser = getUser();
    setUser(savedUser);
  }, []);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!transaction || transaction.status !== "PENDING" || !transaction.requestNumber) {
      // Limpar polling se não há transação pendente
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    console.log("🔄 [DEPOSIT] Iniciando polling para transação:", transaction.requestNumber);
    const requestNumber = transaction.requestNumber; // Capturar valor para usar no intervalo
    
    const interval = setInterval(async () => {
      try {
        const response = await api.get<Transaction>(`/payments/transactions/${requestNumber}`);
        const updatedTransaction = response.data;
        
        console.log("📊 [DEPOSIT] Status da transação:", updatedTransaction.status);
        
        if (updatedTransaction.status === "PAID_OUT") {
          console.log("✅ [DEPOSIT] Pagamento confirmado!");
          setTransaction(updatedTransaction);
          setPaymentConfirmed({ show: true, amount: updatedTransaction.amount });
          
          // Atualizar saldo do usuário
          try {
            const userResponse = await api.get("/auth/me");
            setUser(userResponse.data);
            if (window.localStorage) {
              window.localStorage.setItem("user", JSON.stringify(userResponse.data));
            }
          } catch (error) {
            console.error("Erro ao atualizar dados do usuário:", error);
          }
          
          // Parar polling
          clearInterval(interval);
          setPollingInterval(null);
        } else if (updatedTransaction.status === "CANCELED" || updatedTransaction.status === "FAILED") {
          // Parar polling se cancelado ou falhou
          clearInterval(interval);
          setPollingInterval(null);
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
      }
    }, 3000); // Verificar a cada 3 segundos
    
    setPollingInterval(interval);
    
    // Limpar intervalo após 5 minutos (300 segundos)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setPollingInterval(null);
    }, 300000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [transaction?.requestNumber, transaction?.status]);

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
        
        console.log("💰 [DEPOSIT] Criando pagamento PIX:", {
          amount: amountValue,
          dueDate,
          client: clientData
        });
        
        response = await api.post<{ success: boolean; transaction: Transaction }>("/payments/pix", {
          amount: amountValue,
          dueDate,
          client: clientData
        });
        
        console.log("✅ [DEPOSIT] Resposta do pagamento PIX:", response.data);
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
        console.log("💰 [DEPOSIT] Transação recebida:", {
          hasQrCode: !!response.data.transaction.qrCode,
          hasQrCodeBase64: !!response.data.transaction.qrCodeBase64,
          qrCode: response.data.transaction.qrCode ? response.data.transaction.qrCode.substring(0, 50) + "..." : null,
          status: response.data.transaction.status
        });
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
            
            {selectedMethod === "PIX" && (
              <div>
                {/* QR Code - sempre mostrar se disponível */}
                {transaction.qrCodeBase64 && (
                  <div style={{ marginBottom: "24px" }}>
                    <p style={{ marginBottom: "12px", fontWeight: "600", color: "var(--gold)" }}>
                      📱 Escaneie o QR Code:
                    </p>
                    <img
                      src={`data:image/png;base64,${transaction.qrCodeBase64}`}
                      alt="QR Code PIX"
                      style={{
                        width: "100%",
                        maxWidth: "300px",
                        height: "auto",
                        margin: "0 auto",
                        display: "block",
                        border: "2px solid var(--gold)",
                        borderRadius: "12px",
                        padding: "12px",
                        background: "#fff"
                      }}
                    />
                  </div>
                )}

                {/* Código Copia e Cola - sempre mostrar se disponível */}
                {transaction.qrCode && (
                  <div style={{
                    padding: "16px",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(246, 196, 83, 0.3)",
                    borderRadius: "8px",
                    marginBottom: "16px"
                  }}>
                    <p style={{ 
                      margin: "0 0 12px 0", 
                      fontWeight: "bold",
                      color: "var(--gold)",
                      fontSize: "14px"
                    }}>
                      📋 Código PIX (Copiar e Colar):
                    </p>
                    <div style={{
                      padding: "12px",
                      background: "#fff",
                      borderRadius: "6px",
                      marginBottom: "12px",
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                      fontSize: "11px",
                      color: "#000",
                      lineHeight: "1.5"
                    }}>
                      {transaction.qrCode}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(transaction.qrCode || "").then(() => {
                          alert("✅ Código PIX copiado!");
                        }).catch(() => {
                          // Fallback para navegadores antigos
                          const textArea = document.createElement("textarea");
                          textArea.value = transaction.qrCode || "";
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand("copy");
                          document.body.removeChild(textArea);
                          alert("✅ Código PIX copiado!");
                        });
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        background: "var(--gold)",
                        color: "#000",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: "14px"
                      }}
                    >
                      📋 Copiar Código PIX
                    </button>
                  </div>
                )}

                {/* Mensagem se nenhum código estiver disponível */}
                {!transaction.qrCode && !transaction.qrCodeBase64 && (
                  <div style={{
                    padding: "12px",
                    background: "rgba(255, 0, 0, 0.1)",
                    border: "1px solid rgba(255, 0, 0, 0.3)",
                    borderRadius: "4px",
                    margin: "16px 0"
                  }}>
                    <p style={{ margin: 0, color: "#ff6b6b" }}>
                      ⚠️ QR Code não disponível. Tente novamente.
                    </p>
                  </div>
                )}

                {/* Data de vencimento */}
                {transaction.dueDate && (
                  <p style={{ 
                    fontSize: "12px", 
                    color: "var(--text-muted)", 
                    marginTop: "16px",
                    textAlign: "center"
                  }}>
                    ⏰ Vencimento: {new Date(transaction.dueDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                )}
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

      {/* Popup de pagamento confirmado */}
      {paymentConfirmed && paymentConfirmed.show && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px"
          }}
          onClick={() => setPaymentConfirmed(null)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1a1a1a, #2d2d2d)",
              border: "2px solid var(--gold)",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(246, 196, 83, 0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontSize: "64px",
                marginBottom: "16px",
                animation: "bounce 0.5s ease"
              }}
            >
              ✅
            </div>
            <h2 style={{
              margin: "0 0 16px 0",
              color: "var(--gold)",
              fontSize: "24px",
              fontWeight: "bold"
            }}>
              Pagamento Confirmado!
            </h2>
            <p style={{
              margin: "0 0 24px 0",
              color: "var(--text-main)",
              fontSize: "16px"
            }}>
              Seu depósito de <strong style={{ color: "var(--gold)" }}>
                R$ {paymentConfirmed.amount.toFixed(2).replace(".", ",")}
              </strong> foi confirmado e já está disponível na sua conta!
            </p>
            <button
              className="btn btn-gold"
              onClick={() => {
                setPaymentConfirmed(null);
                setTransaction(null);
              }}
              style={{
                width: "100%",
                padding: "12px 24px",
                fontSize: "16px",
                fontWeight: "bold"
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
