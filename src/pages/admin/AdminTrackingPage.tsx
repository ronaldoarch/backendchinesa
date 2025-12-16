import { useState, useEffect } from "react";
import { api } from "../../services/api";

type Webhook = {
  id: number;
  url: string;
  enabled: boolean;
  events: string[];
  createdAt: string;
  updatedAt: string;
};

const TRACKING_EVENTS = [
  { value: "*", label: "Todos os eventos" },
  { value: "user_registered", label: "Usuário Registrado" },
  { value: "user_login", label: "Usuário Fez Login" },
  { value: "deposit_created", label: "Depósito Criado" },
  { value: "deposit_paid", label: "Depósito Pago" },
  { value: "deposit_failed", label: "Depósito Falhou" },
  { value: "withdrawal_created", label: "Saque Criado" },
  { value: "withdrawal_paid", label: "Saque Processado" },
  { value: "bonus_applied", label: "Bônus Aplicado" },
  { value: "bet_placed", label: "Aposta Realizada" }
];

export function AdminTrackingPage() {
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [utmfyApiKey, setUtmfyApiKey] = useState("");
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookForm, setWebhookForm] = useState({
    url: "",
    events: [] as string[],
    enabled: true
  });
  const [loading, setLoading] = useState({
    loadingData: true,
    saving: false,
    savingWebhook: false
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading((prev) => ({ ...prev, loadingData: true }));
    try {
      const [settingsRes, webhooksRes] = await Promise.all([
        api.get<Record<string, string>>("/settings"),
        api.get<Webhook[]>("/tracking/webhooks")
      ]);

      const settings = settingsRes.data || {};
      setFacebookPixelId(settings["facebookPixelId"] || "");
      setUtmfyApiKey(settings["utmfyApiKey"] || "");
      setWebhooks(webhooksRes.data || []);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      showMessage("error", "Erro ao carregar configurações");
    } finally {
      setLoading((prev) => ({ ...prev, loadingData: false }));
    }
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleSaveFacebookPixel(e: React.FormEvent) {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, saving: true }));
    try {
      await api.put("/settings", {
        "facebookPixelId": facebookPixelId
      });
      showMessage("success", "Facebook Pixel salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      showMessage("error", "Erro ao salvar Facebook Pixel");
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  }

  async function handleSaveUtmfy(e: React.FormEvent) {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, saving: true }));
    try {
      await api.put("/settings", {
        "utmfyApiKey": utmfyApiKey
      });
      showMessage("success", "UTMfy API Key salva com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      showMessage("error", "Erro ao salvar UTMfy API Key");
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  }

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookForm.url || webhookForm.events.length === 0) {
      showMessage("error", "Preencha a URL e selecione pelo menos um evento");
      return;
    }

    setLoading((prev) => ({ ...prev, savingWebhook: true }));
    try {
      await api.post("/tracking/webhooks", webhookForm);
      setWebhookForm({ url: "", events: [], enabled: true });
      await loadData();
      showMessage("success", "Webhook adicionado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao criar webhook:", error);
      showMessage("error", error.response?.data?.error || "Erro ao criar webhook");
    } finally {
      setLoading((prev) => ({ ...prev, savingWebhook: false }));
    }
  }

  async function handleDeleteWebhook(id: number) {
    if (!confirm("Tem certeza que deseja remover este webhook?")) return;

    try {
      await api.delete(`/tracking/webhooks/${id}`);
      await loadData();
      showMessage("success", "Webhook removido com sucesso!");
    } catch (error: any) {
      console.error("Erro ao deletar webhook:", error);
      showMessage("error", "Erro ao deletar webhook");
    }
  }

  async function handleToggleWebhook(id: number, enabled: boolean) {
    try {
      await api.put(`/tracking/webhooks/${id}`, { enabled: !enabled });
      await loadData();
    } catch (error: any) {
      console.error("Erro ao atualizar webhook:", error);
      showMessage("error", "Erro ao atualizar webhook");
    }
  }

  function handleEventToggle(eventValue: string) {
    setWebhookForm((prev) => {
      if (eventValue === "*") {
        // Se selecionar "Todos", limpar outros e adicionar apenas *
        return { ...prev, events: ["*"] };
      }
      // Remover * se estiver selecionado
      let newEvents = prev.events.filter((e) => e !== "*");
      
      if (newEvents.includes(eventValue)) {
        newEvents = newEvents.filter((e) => e !== eventValue);
      } else {
        newEvents.push(eventValue);
      }
      return { ...prev, events: newEvents };
    });
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
      <h1>Tracking & Webhooks</h1>

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

      {/* Facebook Pixel */}
      <div style={{ marginBottom: "32px", padding: "20px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid rgba(246, 196, 83, 0.2)" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>Facebook Pixel (Meta)</h2>
        <form onSubmit={handleSaveFacebookPixel}>
          <div className="admin-form-group">
            <label className="admin-label">Facebook Pixel ID</label>
            <input
              type="text"
              placeholder="Ex: 123456789012345"
              value={facebookPixelId}
              onChange={(e) => setFacebookPixelId(e.target.value)}
            />
            <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Encontre seu Pixel ID no Facebook Events Manager
            </small>
          </div>
          <button
            type="submit"
            className="btn btn-gold"
            disabled={loading.saving}
            style={{ marginTop: "12px" }}
          >
            {loading.saving ? "Salvando..." : "Salvar Facebook Pixel"}
          </button>
        </form>
      </div>

      {/* UTMfy */}
      <div style={{ marginBottom: "32px", padding: "20px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid rgba(246, 196, 83, 0.2)" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>UTMfy</h2>
        <form onSubmit={handleSaveUtmfy}>
          <div className="admin-form-group">
            <label className="admin-label">UTMfy API Key</label>
            <input
              type="text"
              placeholder="Sua chave API do UTMfy"
              value={utmfyApiKey}
              onChange={(e) => setUtmfyApiKey(e.target.value)}
            />
            <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Configure sua API Key do UTMfy para tracking avançado de UTMs
            </small>
          </div>
          <button
            type="submit"
            className="btn btn-gold"
            disabled={loading.saving}
            style={{ marginTop: "12px" }}
          >
            {loading.saving ? "Salvando..." : "Salvar UTMfy"}
          </button>
        </form>
      </div>

      {/* Webhooks */}
      <div style={{ marginBottom: "32px", padding: "20px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid rgba(246, 196, 83, 0.2)" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>Webhooks de Tracking</h2>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>
          Configure webhooks para receber notificações de eventos em tempo real
        </p>

        <form onSubmit={handleCreateWebhook}>
          <div className="admin-form-group">
            <label className="admin-label">URL do Webhook</label>
            <input
              type="url"
              placeholder="https://seu-webhook.com/endpoint"
              value={webhookForm.url}
              onChange={(e) => setWebhookForm((w) => ({ ...w, url: e.target.value }))}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Eventos</label>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
              gap: "8px",
              padding: "12px",
              background: "var(--bg-elevated)",
              borderRadius: "8px",
              border: "1px solid rgba(246, 196, 83, 0.2)",
              maxHeight: "200px",
              overflowY: "auto"
            }}>
              {TRACKING_EVENTS.map((event) => (
                <label key={event.value} className="checkbox-line" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={webhookForm.events.includes(event.value)}
                    onChange={() => handleEventToggle(event.value)}
                  />
                  <span>{event.label}</span>
                </label>
              ))}
            </div>
            <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Segure Ctrl/Cmd para selecionar múltiplos eventos. Use '*' para todos.
            </small>
          </div>

          <label className="checkbox-line" style={{ marginBottom: "12px" }}>
            <input
              type="checkbox"
              checked={webhookForm.enabled}
              onChange={(e) => setWebhookForm((w) => ({ ...w, enabled: e.target.checked }))}
            />
            Habilitado
          </label>

          <button
            type="submit"
            className="btn btn-gold"
            disabled={loading.savingWebhook}
          >
            {loading.savingWebhook ? "Adicionando..." : "Adicionar Webhook"}
          </button>
        </form>

        <div style={{ marginTop: "24px" }}>
          <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>
            Webhooks Configurados ({webhooks.length})
          </h3>
          {webhooks.length === 0 ? (
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Nenhum webhook configurado. Adicione um webhook acima.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Eventos</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map((webhook) => (
                  <tr key={webhook.id}>
                    <td style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {webhook.url}
                    </td>
                    <td>
                      {webhook.events.includes("*") ? (
                        <span style={{ fontSize: "11px" }}>Todos</span>
                      ) : (
                        <span style={{ fontSize: "11px" }}>{webhook.events.length} evento(s)</span>
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        fontSize: "11px", 
                        color: webhook.enabled ? "#4ade80" : "var(--text-muted)" 
                      }}>
                        {webhook.enabled ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleToggleWebhook(webhook.id, webhook.enabled)}
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                        >
                          {webhook.enabled ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleDeleteWebhook(webhook.id)}
                          style={{ fontSize: "11px", padding: "4px 8px", color: "#ff4b4b" }}
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Informações */}
      <div style={{ padding: "16px", background: "rgba(246, 196, 83, 0.05)", borderRadius: "8px" }}>
        <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>ℹ️ Informações:</h3>
        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "var(--text-muted)" }}>
          <li>Facebook Pixel: Rastreia conversões e eventos no Facebook Ads</li>
          <li>UTMfy: Tracking avançado de parâmetros UTM e atribuição</li>
          <li>Webhooks: Receba notificações em tempo real de eventos importantes</li>
          <li>Os webhooks recebem um payload JSON com os dados do evento</li>
          <li>Use '*' nos eventos para receber todas as notificações</li>
        </ul>
      </div>
    </section>
  );
}
