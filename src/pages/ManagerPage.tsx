import { useState, useEffect } from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { api } from "../services/api";

type Affiliate = {
  id: number;
  code: string;
  referralLink: string;
  commissionRate: number;
  active: boolean;
  username: string;
  email?: string;
  createdAt: string;
  totalReferrals: number;
};

type ManagerProfile = {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  balance: number;
  createdAt: string;
};

function AffiliatesManagement() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    phone: ""
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    email: "",
    phone: "",
    password: "",
    active: true
  });

  useEffect(() => {
    loadAffiliates();
  }, []);

  async function loadAffiliates() {
    try {
      setLoading(true);
      const response = await api.get<Affiliate[]>("/affiliates");
      setAffiliates(response.data);
    } catch (error: any) {
      console.error("Erro ao carregar afiliados:", error);
      alert("Erro ao carregar afiliados");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.password) {
      alert("Username e senha são obrigatórios");
      return;
    }

    try {
      await api.post("/affiliates", form);
      alert("Afiliado criado com sucesso!");
      setForm({ username: "", password: "", email: "", phone: "" });
      loadAffiliates();
    } catch (error: any) {
      console.error("Erro ao criar afiliado:", error);
      alert(error.response?.data?.error || "Erro ao criar afiliado");
    }
  }

  async function handleUpdate(id: number) {
    try {
      const updateData: any = {
        email: editForm.email,
        phone: editForm.phone,
        active: editForm.active
      };
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      await api.put(`/affiliates/${id}`, updateData);
      alert("Afiliado atualizado com sucesso!");
      setEditingId(null);
      setEditForm({ email: "", phone: "", password: "", active: true });
      loadAffiliates();
    } catch (error: any) {
      console.error("Erro ao atualizar afiliado:", error);
      alert(error.response?.data?.error || "Erro ao atualizar afiliado");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja deletar este afiliado?")) return;

    try {
      await api.delete(`/affiliates/${id}`);
      alert("Afiliado deletado com sucesso!");
      loadAffiliates();
    } catch (error: any) {
      console.error("Erro ao deletar afiliado:", error);
      alert(error.response?.data?.error || "Erro ao deletar afiliado");
    }
  }

  function startEdit(affiliate: Affiliate) {
    setEditingId(affiliate.id);
    setEditForm({
      email: affiliate.email || "",
      phone: "",
      password: "",
      active: affiliate.active
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("Link copiado para a área de transferência!");
  }

  return (
    <section className="admin-section">
      <h1>Gerenciar Afiliados</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Crie e gerencie seus afiliados. Cada afiliado recebe 5% de comissão sobre o positivo.
      </p>

      <form className="admin-form" onSubmit={handleCreate}>
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Criar Novo Afiliado</h2>
        <input
          placeholder="Username *"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          required
        />
        <input
          type="password"
          placeholder="Senha *"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          placeholder="Telefone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <button className="btn btn-gold" type="submit">
          Criar Afiliado
        </button>
      </form>

      <div style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Lista de Afiliados</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : affiliates.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Nenhum afiliado cadastrado.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Código</th>
                <th>Link de Referência</th>
                <th>Comissão</th>
                <th>Referidos</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => (
                <tr key={affiliate.id}>
                  <td>{affiliate.id}</td>
                  <td>{affiliate.username}</td>
                  <td>
                    <code style={{ background: "var(--bg-card)", padding: "4px 8px", borderRadius: "4px" }}>
                      {affiliate.code}
                    </code>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {affiliate.referralLink}
                      </span>
                      <button
                        className="btn"
                        style={{ padding: "4px 8px", fontSize: "12px" }}
                        onClick={() => copyToClipboard(affiliate.referralLink)}
                      >
                        Copiar
                      </button>
                    </div>
                  </td>
                  <td>{affiliate.commissionRate}%</td>
                  <td>{affiliate.totalReferrals || 0}</td>
                  <td>
                    <span style={{ color: affiliate.active ? "var(--gold)" : "var(--text-muted)" }}>
                      {affiliate.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>{new Date(affiliate.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>
                    {editingId === affiliate.id ? (
                      <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
                        <input
                          type="email"
                          placeholder="Email"
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, email: e.target.value }))
                          }
                          style={{ width: "150px" }}
                        />
                        <input
                          type="password"
                          placeholder="Nova senha (opcional)"
                          value={editForm.password}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, password: e.target.value }))
                          }
                          style={{ width: "150px" }}
                        />
                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                          <input
                            type="checkbox"
                            checked={editForm.active}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, active: e.target.checked }))
                            }
                          />
                          Ativo
                        </label>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className="btn btn-gold"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            onClick={() => handleUpdate(affiliate.id)}
                          >
                            Salvar
                          </button>
                          <button
                            className="btn"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({ email: "", phone: "", password: "", active: true });
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn btn-gold"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                          onClick={() => startEdit(affiliate)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                          onClick={() => handleDelete(affiliate.id)}
                        >
                          Deletar
                        </button>
                      </div>
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

function ManagerDashboard() {
  const [profile, setProfile] = useState<ManagerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const response = await api.get<ManagerProfile>("/managers/profile");
      setProfile(response.data);
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-section">
        <p>Carregando...</p>
      </section>
    );
  }

  return (
    <section className="admin-section">
      <h1>Painel do Gerente</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Bem-vindo ao seu painel de gerente. Aqui você pode gerenciar seus afiliados e acompanhar suas comissões.
      </p>

      {profile && (
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid rgba(246, 196, 83, 0.3)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px"
        }}>
          <h2 style={{ fontSize: "20px", marginBottom: "16px", color: "var(--gold)" }}>
            Seus Dados
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "4px" }}>Username</p>
              <p style={{ fontSize: "16px", fontWeight: "bold" }}>{profile.username}</p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "4px" }}>Email</p>
              <p style={{ fontSize: "16px" }}>{profile.email || "-"}</p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "4px" }}>Saldo</p>
              <p style={{ fontSize: "16px", fontWeight: "bold", color: "var(--gold)" }}>
                R$ {new Intl.NumberFormat("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(profile.balance || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={{
        background: "rgba(246, 196, 83, 0.1)",
        border: "1px solid var(--gold)",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px"
      }}>
        <h2 style={{ fontSize: "18px", marginBottom: "12px", color: "var(--gold)" }}>
          📊 Informações sobre Comissões
        </h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li style={{ marginBottom: "8px" }}>
            • Você recebe <strong>20%</strong> de comissão sobre o positivo dos seus afiliados
          </li>
          <li style={{ marginBottom: "8px" }}>
            • Seus afiliados recebem <strong>5%</strong> de comissão sobre o positivo
          </li>
          <li style={{ marginBottom: "8px" }}>
            • Fechamento e liberação de saque: <strong>Toda segunda-feira</strong>
          </li>
          <li>
            • Período de cálculo: <strong>1 semana</strong> (segunda a domingo)
          </li>
        </ul>
      </div>
    </section>
  );
}

function CommissionsView() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommissions();
  }, []);

  async function loadCommissions() {
    try {
      setLoading(true);
      const response = await api.get<any[]>("/commissions/manager");
      setCommissions(response.data);
    } catch (error: any) {
      console.error("Erro ao carregar comissões:", error);
      alert("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-section">
      <h1>Minhas Comissões</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Você recebe 20% de comissão sobre o positivo dos seus afiliados. Fechamento toda segunda-feira.
      </p>

      {loading ? (
        <p>Carregando...</p>
      ) : commissions.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }}>Nenhuma comissão registrada ainda.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Período</th>
              <th>Afiliado</th>
              <th>Usuário Referido</th>
              <th>Resultado Líquido</th>
              <th>Minha Comissão (20%)</th>
              <th>Status</th>
              <th>Data de Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map((commission) => (
              <tr key={commission.id}>
                <td>
                  {new Date(commission.periodStart).toLocaleDateString("pt-BR")} até{" "}
                  {new Date(commission.periodEnd).toLocaleDateString("pt-BR")}
                </td>
                <td>
                  <code style={{ background: "var(--bg-card)", padding: "4px 8px", borderRadius: "4px" }}>
                    {commission.affiliateCode}
                  </code>
                </td>
                <td>{commission.referredUser}</td>
                <td>
                  R$ {new Intl.NumberFormat("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(commission.netResult || 0)}
                </td>
                <td style={{ color: "var(--gold)", fontWeight: "bold" }}>
                  R$ {new Intl.NumberFormat("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(commission.managerCommission || 0)}
                </td>
                <td>
                  <span style={{
                    color: commission.status === "paid" ? "var(--gold)" : 
                           commission.status === "approved" ? "#4CAF50" : "var(--text-muted)"
                  }}>
                    {commission.status === "paid" ? "Pago" : 
                     commission.status === "approved" ? "Aprovado" : "Pendente"}
                  </span>
                </td>
                <td>
                  {commission.paidAt 
                    ? new Date(commission.paidAt).toLocaleDateString("pt-BR")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function ManagerPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-shell">
      <button
        type="button"
        className="admin-menu-toggle"
        onClick={() => setMenuOpen((v) => !v)}
      >
        ☰
      </button>

      <aside className={`admin-menu ${menuOpen ? "open" : ""}`}>
        <h2 className="admin-menu-title">Painel Gerente</h2>
        <nav className="admin-menu-list">
          <NavLink
            to="/gerente"
            end
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/gerente/afiliados"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Afiliados
          </NavLink>
          <NavLink
            to="/gerente/comissoes"
            className={({ isActive }) =>
              `admin-menu-item${isActive ? " active" : ""}`
            }
            onClick={() => setMenuOpen(false)}
          >
            Comissões
          </NavLink>
        </nav>
      </aside>

      <div className="admin-layout">
        <Routes>
          <Route path="/" element={<ManagerDashboard />} />
          <Route path="afiliados" element={<AffiliatesManagement />} />
          <Route path="comissoes" element={<CommissionsView />} />
          <Route path="*" element={<Navigate to="/gerente" replace />} />
        </Routes>
      </div>
    </div>
  );
}
