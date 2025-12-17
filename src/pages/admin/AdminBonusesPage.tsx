import { useState, useEffect } from "react";
import { api } from "../../services/api";

type Bonus = {
  id: number;
  name: string;
  type: "first_deposit" | "deposit" | "vip_level" | "custom";
  bonusPercentage: number;
  bonusFixed: number;
  minDeposit: number;
  maxBonus: number | null;
  rolloverMultiplier: number;
  rtpPercentage: number;
  vipLevelRequired: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const BONUS_TYPES = [
  { value: "first_deposit", label: "Primeiro Depósito" },
  { value: "deposit", label: "Depósito" },
  { value: "vip_level", label: "VIP" },
  { value: "custom", label: "Personalizado" }
];

export function AdminBonusesPage() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [bonusForm, setBonusForm] = useState({
    name: "",
    type: "first_deposit" as Bonus["type"],
    bonusPercentage: 100,
    bonusFixed: 0,
    minDeposit: 0,
    maxBonus: null as number | null,
    rolloverMultiplier: 1,
    rtpPercentage: 96,
    vipLevelRequired: null as number | null,
    active: true
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState({
    loadingData: true,
    saving: false
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    void loadBonuses();
  }, []);

  async function loadBonuses() {
    setLoading((prev) => ({ ...prev, loadingData: true }));
    try {
      const res = await api.get<Bonus[]>("/bonuses");
      setBonuses(res.data || []);
    } catch (error: any) {
      console.error("Erro ao carregar bônus:", error);
      showMessage("error", "Erro ao carregar bônus");
    } finally {
      setLoading((prev) => ({ ...prev, loadingData: false }));
    }
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, saving: true }));
    try {
      if (editingId) {
        await api.put(`/bonuses/${editingId}`, bonusForm);
        showMessage("success", "Bônus atualizado com sucesso!");
      } else {
        await api.post("/bonuses", bonusForm);
        showMessage("success", "Bônus criado com sucesso!");
      }
      setBonusForm({
        name: "",
        type: "first_deposit",
        bonusPercentage: 100,
        bonusFixed: 0,
        minDeposit: 0,
        maxBonus: null,
        rolloverMultiplier: 1,
        rtpPercentage: 96,
        vipLevelRequired: null,
        active: true
      });
      setEditingId(null);
      await loadBonuses();
    } catch (error: any) {
      console.error("Erro ao salvar bônus:", error);
      showMessage("error", error.response?.data?.error || "Erro ao salvar bônus");
    } finally {
      setLoading((prev) => ({ ...prev, saving: false }));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja remover este bônus?")) return;

    try {
      await api.delete(`/bonuses/${id}`);
      await loadBonuses();
      showMessage("success", "Bônus removido com sucesso!");
    } catch (error: any) {
      console.error("Erro ao deletar bônus:", error);
      showMessage("error", "Erro ao deletar bônus");
    }
  }

  function handleEdit(bonus: Bonus) {
    setBonusForm({
      name: bonus.name,
      type: bonus.type,
      bonusPercentage: bonus.bonusPercentage,
      bonusFixed: bonus.bonusFixed,
      minDeposit: bonus.minDeposit,
      maxBonus: bonus.maxBonus,
      rolloverMultiplier: bonus.rolloverMultiplier,
      rtpPercentage: bonus.rtpPercentage,
      vipLevelRequired: bonus.vipLevelRequired,
      active: bonus.active
    });
    setEditingId(bonus.id);
  }

  function handleCancel() {
    setBonusForm({
      name: "",
      type: "first_deposit",
      bonusPercentage: 100,
      bonusFixed: 0,
      minDeposit: 0,
      maxBonus: null,
      rolloverMultiplier: 1,
      rtpPercentage: 96,
      vipLevelRequired: null,
      active: true
    });
    setEditingId(null);
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  if (loading.loadingData) {
    return (
      <section className="admin-section">
        <p>Carregando bônus...</p>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <h1>Gerenciar Bônus</h1>

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

      {/* Formulário de criação/edição */}
      <div style={{ marginBottom: "32px", padding: "20px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid rgba(246, 196, 83, 0.2)" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px", color: "var(--gold)" }}>
          {editingId ? "Editar Bônus" : "Criar Novo Bônus"}
        </h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-label">Nome do Bônus</label>
            <input
              type="text"
              placeholder="Ex: Bônus do Primeiro Depósito"
              value={bonusForm.name}
              onChange={(e) => setBonusForm((b) => ({ ...b, name: e.target.value }))}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Tipo</label>
            <select
              value={bonusForm.type}
              onChange={(e) => setBonusForm((b) => ({ ...b, type: e.target.value as Bonus["type"] }))}
            >
              {BONUS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Percentual de Bônus (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={bonusForm.bonusPercentage}
              onChange={(e) => setBonusForm((b) => ({ ...b, bonusPercentage: Number(e.target.value) || 0 }))}
            />
            <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Ex: 100 = dobra o valor depositado
            </small>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Valor Fixo de Bônus (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={bonusForm.bonusFixed}
              onChange={(e) => setBonusForm((b) => ({ ...b, bonusFixed: Number(e.target.value) || 0 }))}
            />
            <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Valor fixo adicional (opcional)
            </small>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Depósito Mínimo (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={bonusForm.minDeposit}
              onChange={(e) => setBonusForm((b) => ({ ...b, minDeposit: Number(e.target.value) || 0 }))}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Bônus Máximo (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Sem limite"
              value={bonusForm.maxBonus || ""}
              onChange={(e) => setBonusForm((b) => ({ ...b, maxBonus: e.target.value ? Number(e.target.value) : null }))}
            />
            <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Deixe vazio para sem limite
            </small>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Multiplicador de Rollover</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={bonusForm.rolloverMultiplier}
              onChange={(e) => setBonusForm((b) => ({ ...b, rolloverMultiplier: Number(e.target.value) || 1 }))}
            />
            <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Ex: 1 = precisa apostar o valor do depósito + bônus
            </small>
          </div>

          <div className="admin-form-group">
            <label className="admin-label">RTP (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={bonusForm.rtpPercentage}
              onChange={(e) => setBonusForm((b) => ({ ...b, rtpPercentage: Number(e.target.value) || 96 }))}
            />
            <small style={{ color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
              Return to Player (taxa de retorno)
            </small>
          </div>

          {bonusForm.type === "vip_level" && (
            <div className="admin-form-group">
              <label className="admin-label">Nível VIP Requerido</label>
              <input
                type="number"
                min="0"
                value={bonusForm.vipLevelRequired || ""}
                onChange={(e) => setBonusForm((b) => ({ ...b, vipLevelRequired: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
          )}

          <label className="checkbox-line" style={{ marginBottom: "12px" }}>
            <input
              type="checkbox"
              checked={bonusForm.active}
              onChange={(e) => setBonusForm((b) => ({ ...b, active: e.target.checked }))}
            />
            Ativo
          </label>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="submit"
              className="btn btn-gold"
              disabled={loading.saving}
            >
              {loading.saving ? "Salvando..." : editingId ? "Atualizar Bônus" : "Criar Bônus"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCancel}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lista de bônus */}
      <div>
        <h2 style={{ fontSize: "16px", marginBottom: "12px" }}>
          Bônus Configurados ({bonuses.length})
        </h2>
        {bonuses.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Nenhum bônus configurado. Crie um bônus acima.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Bônus</th>
                <th>Dep. Mín.</th>
                <th>Rollover</th>
                <th>RTP</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {bonuses.map((bonus) => (
                <tr key={bonus.id}>
                  <td>{bonus.name}</td>
                  <td>
                    {BONUS_TYPES.find((t) => t.value === bonus.type)?.label || bonus.type}
                  </td>
                  <td>
                    {bonus.bonusPercentage > 0 && `${bonus.bonusPercentage}%`}
                    {bonus.bonusPercentage > 0 && bonus.bonusFixed > 0 && " + "}
                    {bonus.bonusFixed > 0 && formatCurrency(bonus.bonusFixed)}
                  </td>
                  <td>{formatCurrency(bonus.minDeposit)}</td>
                  <td>{bonus.rolloverMultiplier}x</td>
                  <td>{bonus.rtpPercentage}%</td>
                  <td>
                    <span style={{ 
                      fontSize: "11px", 
                      color: bonus.active ? "#4ade80" : "var(--text-muted)" 
                    }}>
                      {bonus.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => handleEdit(bonus)}
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => handleDelete(bonus.id)}
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
    </section>
  );
}
