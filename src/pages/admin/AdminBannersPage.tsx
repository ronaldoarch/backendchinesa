import { useEffect, useState } from "react";
import { api } from "../../services/api";

type Banner = {
  id?: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position: number;
  active: boolean;
};

export function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannerForm, setBannerForm] = useState<Banner>({
    title: "",
    imageUrl: "",
    linkUrl: "",
    position: 0,
    active: true
  });

  useEffect(() => {
    void (async () => {
      const res = await api.get<Banner[]>("/banners");
      setBanners(res.data);
    })();
  }, []);

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ url: string }>("/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data.url;
  }

  async function handleCreateBanner(e: React.FormEvent) {
    e.preventDefault();
    await api.post("/banners", {
      title: bannerForm.title,
      imageUrl: bannerForm.imageUrl,
      linkUrl: bannerForm.linkUrl || undefined,
      position: bannerForm.position,
      active: bannerForm.active
    });
    setBannerForm({
      title: "",
      imageUrl: "",
      linkUrl: "",
      position: 0,
      active: true
    });
    const res = await api.get<Banner[]>("/banners");
    setBanners(res.data);
  }

  async function handleDeleteBanner(id: number | undefined) {
    if (!id) return;
    await api.delete(`/banners/${id}`);
    const res = await api.get<Banner[]>("/banners");
    setBanners(res.data);
  }

  return (
    <section className="admin-section">
      <h1>Banners da home</h1>
      <form className="admin-form" onSubmit={handleCreateBanner}>
        <input
          placeholder="Título do banner"
          value={bannerForm.title}
          onChange={(e) =>
            setBannerForm((b) => ({ ...b, title: e.target.value }))
          }
        />
        <input
          placeholder="URL da imagem"
          value={bannerForm.imageUrl}
          onChange={(e) =>
            setBannerForm((b) => ({ ...b, imageUrl: e.target.value }))
          }
        />
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadFile(file);
            setBannerForm((b) => ({ ...b, imageUrl: url }));
          }}
        />
        <input
          placeholder="URL de destino (opcional)"
          value={bannerForm.linkUrl}
          onChange={(e) =>
            setBannerForm((b) => ({ ...b, linkUrl: e.target.value }))
          }
        />
        <input
          placeholder="Posição (0, 1, 2...)"
          type="number"
          value={bannerForm.position}
          onChange={(e) =>
            setBannerForm((b) => ({
              ...b,
              position: Number(e.target.value) || 0
            }))
          }
        />
        <label className="checkbox-line">
          <input
            type="checkbox"
            checked={bannerForm.active}
            onChange={(e) =>
              setBannerForm((b) => ({ ...b, active: e.target.checked }))
            }
          />
          Ativo
        </label>
        <button className="btn btn-gold" type="submit">
          Adicionar banner
        </button>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Imagem</th>
            <th>Posição</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.title}</td>
              <td>
                <a href={b.imageUrl} target="_blank" rel="noreferrer">
                  Ver
                </a>
              </td>
              <td>{b.position}</td>
              <td>{b.active ? "Ativo" : "Inativo"}</td>
              <td>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleDeleteBanner(b.id)}
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}


