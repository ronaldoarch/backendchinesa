import { useEffect, useState } from "react";
import { api } from "../../services/api";

type Promotion = {
  id?: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  active: boolean;
  position: number;
};

const CATEGORIES = [
  { value: "eventos", label: "Eventos" },
  { value: "vip", label: "VIP" },
  { value: "rebate", label: "Taxa de Rebate" },
  { value: "recompensas", label: "Recompensas" },
  { value: "historico", label: "Histórico" }
];

export function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionForm, setPromotionForm] = useState<Promotion>({
    title: "",
    subtitle: "",
    description: "",
    category: "eventos",
    active: true,
    position: 0
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    void loadPromotions();
  }, []);

  async function loadPromotions() {
    try {
      const res = await api.get<Promotion[]>("/promotions");
      setPromotions(res.data);
    } catch (error) {
      console.error("Erro ao carregar promoções:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/promotions/${editingId}`, promotionForm);
      } else {
        await api.post("/promotions", promotionForm);
      }
      setPromotionForm({
        title: "",
        subtitle: "",
        description: "",
        category: "eventos",
        active: true,
        position: 0
      });
      setEditingId(null);
      await loadPromotions();
    } catch (error) {
      console.error("Erro ao salvar promoção:", error);
      alert("Erro ao salvar promoção");
    }
  }

  async function handleDelete(id: number | undefined) {
    if (!id) return;
    if (!confirm("Tem certeza que deseja excluir esta promoção?")) return;
    
    try {
      await api.delete(`/promotions/${id}`);
      await loadPromotions();
    } catch (error) {
      console.error("Erro ao deletar promoção:", error);
      alert("Erro ao deletar promoção");
    }
  }

  function handleEdit(promotion: Promotion) {
    setPromotionForm({
      title: promotion.title,
      subtitle: promotion.subtitle || "",
      description: promotion.description || "",
      category: promotion.category,
      active: promotion.active,
      position: promotion.position
    });
    setEditingId(promotion.id || null);
  }

  function handleCancel() {
    setPromotionForm({
      title: "",
      subtitle: "",
      description: "",
      category: "eventos",
      active: true,
      position: 0
    });
    setEditingId(null);
  }

  return (
    <section className="admin-section">
      <h1>Gerenciar Promoções</h1>
      
      <form className="admin-form" onSubmit={handleSubmit}>
        <input
          placeholder="Título da promoção *"
          value={promotionForm.title}
          onChange={(e) =>
            setPromotionForm((p) => ({ ...p, title: e.target.value }))
          }
          required
        />
        <input
          placeholder="Subtítulo (ex: R$ 10 grátis)"
          value={promotionForm.subtitle || ""}
          onChange={(e) =>
            setPromotionForm((p) => ({ ...p, subtitle: e.target.value }))
          }
        />
        <textarea
          placeholder="Descrição da promoção"
          value={promotionForm.description || ""}
          onChange={(e) =>
            setPromotionForm((p) => ({ ...p, description: e.target.value }))
          }
          style={{
            background: "#050509",
            border: "1px solid rgba(246, 196, 83, 0.25)",
            borderRadius: "8px",
            padding: "6px 8px",
            color: "var(--text-main)",
            fontSize: "12px",
            minHeight: "60px",
            resize: "vertical"
          }}
        />
        <select
          value={promotionForm.category}
          onChange={(e) =>
            setPromotionForm((p) => ({ ...p, category: e.target.value }))
          }
          style={{
            background: "#050509",
            border: "1px solid rgba(246, 196, 83, 0.25)",
            borderRadius: "8px",
            padding: "6px 8px",
            color: "var(--text-main)",
            fontSize: "12px"
          }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <input
          placeholder="Posição (0, 1, 2...)"
          type="number"
          value={promotionForm.position}
          onChange={(e) =>
            setPromotionForm((p) => ({
              ...p,
              position: Number(e.target.value) || 0
            }))
          }
        />
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={promotionForm.active}
            onChange={(e) =>
              setPromotionForm((p) => ({ ...p, active: e.target.checked }))
            }
          />
          Ativo
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-gold" type="submit">
            {editingId ? "Atualizar" : "Adicionar"} Promoção
          </button>
          {editingId && (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <h2 style={{ marginTop: "20px", fontSize: "16px" }}>
        Promoções Cadastradas ({promotions.length})
      </h2>
      
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Subtítulo</th>
            <th>Categoria</th>
            <th>Posição</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {promotions.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                Nenhuma promoção cadastrada. Adicione uma promoção acima.
              </td>
            </tr>
          ) : (
            promotions.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.title}</td>
                <td>{p.subtitle || "-"}</td>
                <td>
                  {CATEGORIES.find((c) => c.value === p.category)?.label || p.category}
                </td>
                <td>{p.position}</td>
                <td>{p.active ? "Ativo" : "Inativo"}</td>
                <td>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleEdit(p)}
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleDelete(p.id)}
                      style={{ fontSize: "11px", padding: "4px 8px", color: "#ff4b4b" }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
