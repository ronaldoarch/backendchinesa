import { useState, useEffect } from "react";
import { api } from "../../services/api";

type Manager = {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  createdAt: string;
  userType: string;
};

export function AdminManagersPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
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
    password: ""
  });

  useEffect(() => {
    loadManagers();
  }, []);

  async function loadManagers() {
    try {
      setLoading(true);
      const response = await api.get<Manager[]>("/managers");
      setManagers(response.data);
    } catch (error: any) {
      console.error("Erro ao carregar gerentes:", error);
      alert("Erro ao carregar gerentes");
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
      await api.post("/managers", form);
      alert("Gerente criado com sucesso!");
      setForm({ username: "", password: "", email: "", phone: "" });
      loadManagers();
    } catch (error: any) {
      console.error("Erro ao criar gerente:", error);
      alert(error.response?.data?.error || "Erro ao criar gerente");
    }
  }

  async function handleUpdate(id: number) {
    try {
      const updateData: any = {
        email: editForm.email,
        phone: editForm.phone
      };
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      await api.put(`/managers/${id}`, updateData);
      alert("Gerente atualizado com sucesso!");
      setEditingId(null);
      setEditForm({ email: "", phone: "", password: "" });
      loadManagers();
    } catch (error: any) {
      console.error("Erro ao atualizar gerente:", error);
      alert(error.response?.data?.error || "Erro ao atualizar gerente");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza que deseja deletar este gerente?")) return;

    try {
      await api.delete(`/managers/${id}`);
      alert("Gerente deletado com sucesso!");
      loadManagers();
    } catch (error: any) {
      console.error("Erro ao deletar gerente:", error);
      alert(error.response?.data?.error || "Erro ao deletar gerente");
    }
  }

  function startEdit(manager: Manager) {
    setEditingId(manager.id);
    setEditForm({
      email: manager.email || "",
      phone: manager.phone || "",
      password: ""
    });
  }

  return (
    <section className="admin-section">
      <h1>Gerenciar Gerentes</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Crie e gerencie contas de gerentes. Gerentes podem criar e gerenciar afiliados.
      </p>

      <form className="admin-form" onSubmit={handleCreate}>
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Criar Novo Gerente</h2>
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
          Criar Gerente
        </button>
      </form>

      <div style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Lista de Gerentes</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : managers.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Nenhum gerente cadastrado.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((manager) => (
                <tr key={manager.id}>
                  <td>{manager.id}</td>
                  <td>{manager.username}</td>
                  <td>{manager.email || "-"}</td>
                  <td>{manager.phone || "-"}</td>
                  <td>{new Date(manager.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>
                    {editingId === manager.id ? (
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
                          placeholder="Telefone"
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, phone: e.target.value }))
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
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className="btn btn-gold"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            onClick={() => handleUpdate(manager.id)}
                          >
                            Salvar
                          </button>
                          <button
                            className="btn"
                            style={{ padding: "4px 8px", fontSize: "12px" }}
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({ email: "", phone: "", password: "" });
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
                          onClick={() => startEdit(manager)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn"
                          style={{ padding: "4px 8px", fontSize: "12px" }}
                          onClick={() => handleDelete(manager.id)}
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
