import { useState, useEffect } from "react";
import { api } from "../../services/api";

type Settings = Record<string, string>;

export function AdminSuitPayPage() {
  const [settingsForm, setSettingsForm] = useState<Settings>({
    "suitpay.clientId": "",
    "suitpay.clientSecret": ""
  });
  const [loading, setLoading] = useState({
    loadingData: true,
    saving: false,
    testing: false
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    setLoading((prev) => ({ ...prev, loadingData: true }));
    try {
      const res = await api.get<Settings>("/settings");
      const settings = res.data || {};
      setSettingsForm((prev) => ({
        ...prev,
        "suitpay.clientId": settings["suitpay.clientId"] ?? "",
        "suitpay.clientSecret": settings["suitpay.clientSecret"] ?? ""
      }));
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      showMessage("error", "Erro ao carregar configurações");
    } finally {
      setLoading((prev) => ({ ...prev, loadingData: false }));
    }
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, saving: true }));
    try {
      await api.put("/settings", settingsForm);
      showMessage("success", "Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      showMessage("error", "Erro ao salvar configurações");
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  }

  async function handleTestConnection() {
    setLoading((prev) => ({ ...prev, testing: true }));
    try {
      // Primeiro salvar as credenciais
      await api.put("/settings", settingsForm);
      
      // Depois testar conexão
      const res = await api.post("/payments/test-connection");
      if (res.data.success) {
        showMessage("success", "Conexão com SuitPay testada com sucesso!");
      } else {
        showMessage("error", res.data.message || "Erro ao testar conexão");
      }
    } catch (error: any) {
      console.error("Erro ao testar conexão:", error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Erro ao testar conexão";
      showMessage("error", errorMsg);
    } finally {
      setLoading((prev) => ({ ...prev, testing: false }));
    }
  }

  if (loading.loadingData) {
    return (
      <section className="admin-section">
        <p>Carregando configurações...</p>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <h1>Configurações SuitPay</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Configure as credenciais da API SuitPay para processar pagamentos.
        <br />
        <small>
          Para obter as credenciais, acesse o portal SuitPay: VENDAS → GATEWAY DE PAGAMENTO → Chaves API
        </small>
      </p>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "16px",
            background: message.type === "success" ? "rgba(74, 222, 128, 0.1)" : "rgba(255, 107, 107, 0.1)",
            border: `1px solid ${message.type === "success" ? "#4ade80" : "#ff6b6b"}`,
            color: message.type === "success" ? "#4ade80" : "#ff6b6b"
          }}
        >
          {message.text}
        </div>
      )}

      <form className="admin-form" onSubmit={handleSave}>
        <div className="admin-form-group">
          <label className="admin-label">Client ID (ci)</label>
          <input
            type="text"
            placeholder="Seu Client ID da SuitPay"
            value={settingsForm["suitpay.clientId"] ?? ""}
            onChange={(e) =>
              setSettingsForm((s) => ({
                ...s,
                "suitpay.clientId": e.target.value
              }))
            }
            required
          />
          <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Client ID obtido no portal SuitPay
          </small>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Client Secret (cs)</label>
          <input
            type="password"
            placeholder="Seu Client Secret da SuitPay"
            value={settingsForm["suitpay.clientSecret"] ?? ""}
            onChange={(e) =>
              setSettingsForm((s) => ({
                ...s,
                "suitpay.clientSecret": e.target.value
              }))
            }
            required
          />
          <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
            Client Secret obtido no portal SuitPay (não será possível visualizar novamente após gerar)
          </small>
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          <button
            type="submit"
            className="btn btn-gold"
            disabled={loading.saving}
          >
            {loading.saving ? "Salvando..." : "Salvar Credenciais"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleTestConnection}
            disabled={loading.testing || loading.saving}
          >
            {loading.testing ? "Testando..." : "Testar Conexão"}
          </button>
        </div>
      </form>

      <div style={{ marginTop: "32px", padding: "16px", background: "rgba(246, 196, 83, 0.05)", borderRadius: "8px" }}>
        <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>ℹ️ Informações importantes:</h3>
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "var(--text-muted)" }}>
          <li>As credenciais são enviadas nos headers HTTP: <code>ci</code> (Client ID) e <code>cs</code> (Client Secret)</li>
          <li>IP do webhook SuitPay: <code>3.132.137.46</code> (adicione na whitelist se necessário)</li>
          <li>Sandbox: <code>http://sandbox.w.suitpay.app</code></li>
          <li>Produção: <code>http://w.suitpay.app</code> (ou configure <code>SUITPAY_PRODUCTION_URL</code> nas variáveis de ambiente)</li>
        </ul>
      </div>
    </section>
  );
}
