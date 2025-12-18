import { useEffect, useState, useRef } from "react";
import { api, getImageUrl } from "../../services/api";

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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      const res = await api.get<Banner[]>("/banners");
      setBanners(res.data);
    })();
  }, []);

  async function uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      console.log("📤 [UPLOAD] Enviando arquivo:", {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
    const res = await api.post<{ url: string }>("/uploads", formData, {
        headers: { 
          "Content-Type": "multipart/form-data"
        }
    });
      
      console.log("✅ [UPLOAD] Upload bem-sucedido:", res.data.url);
    return res.data.url;
    } catch (error: any) {
      console.error("❌ [UPLOAD] Erro ao fazer upload:", error);
      console.error("❌ [UPLOAD] Resposta:", error.response?.data);
      throw error;
    }
  }

  async function handleFileUpload(file: File) {
    if (!file) {
      console.warn("⚠️ Nenhum arquivo selecionado");
      return;
    }
    
    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas arquivos de imagem.");
      return;
    }
    
    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. Tamanho máximo: 10MB");
      return;
    }
    
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setBannerForm((b) => ({ ...b, imageUrl: url }));
      alert("✅ Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error("❌ Erro ao fazer upload:", error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || "Erro desconhecido";
      alert(`❌ Erro ao fazer upload: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateBanner(e: React.FormEvent) {
    e.preventDefault();
    try {
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
      alert("Banner adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar banner:", error);
      alert("Erro ao criar banner.");
    }
  }

  async function handleDeleteBanner(id: number | undefined) {
    if (!id) return;
    if (!confirm("Tem certeza que deseja remover este banner?")) return;
    try {
    await api.delete(`/banners/${id}`);
    const res = await api.get<Banner[]>("/banners");
    setBanners(res.data);
      alert("Banner removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover banner:", error);
      alert("Erro ao remover banner.");
    }
  }


  return (
    <section className="admin-section">
      <h1>Banners da Home</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Gerencie os banners promocionais exibidos na página inicial.
      </p>

      <form className="admin-form" onSubmit={handleCreateBanner}>
        <div className="admin-form-group">
          <label className="admin-label">Título do Banner</label>
        <input
            placeholder="Ex: Bônus de Boas-Vindas"
          value={bannerForm.title}
          onChange={(e) =>
            setBannerForm((b) => ({ ...b, title: e.target.value }))
          }
            required
        />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Imagem do Banner</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
        <input
                placeholder="URL da imagem (ou faça upload abaixo)"
          value={bannerForm.imageUrl}
          onChange={(e) =>
            setBannerForm((b) => ({ ...b, imageUrl: e.target.value }))
          }
                style={{ marginBottom: "8px" }}
                required
        />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    console.log("🔄 onChange disparado, arquivo:", file ? `${file.name} (${file.size} bytes)` : "nenhum");
                    if (file) {
                      console.log("📎 Arquivo selecionado:", file.name, file.size, file.type);
                      handleFileUpload(file);
                    } else {
                      console.warn("⚠️ Nenhum arquivo selecionado no onChange");
                    }
                    // Limpar o input para permitir selecionar o mesmo arquivo novamente
                    if (e.target) {
                      e.target.value = "";
                    }
                  }}
                  disabled={uploading}
                  style={{ display: "none" }}
                  id="banner-file-input"
                />
                <label 
                  htmlFor="banner-file-input"
                  className="admin-file-upload" 
                  style={{ 
                    cursor: uploading ? "not-allowed" : "pointer",
                    pointerEvents: uploading ? "none" : "auto",
                    display: "inline-block",
                    textAlign: "center"
                  }}
                  onClick={(e) => {
                    if (uploading) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    // Garantir que o input seja clicado
                    if (fileInputRef.current && !uploading) {
                      console.log("🖱️ Label clicado, disparando clique no input");
                      fileInputRef.current.click();
                    }
                  }}
                >
                  {uploading ? "⏳ Enviando..." : "📤 Fazer upload da imagem"}
                </label>
              </div>
            </div>
            {bannerForm.imageUrl && (
              <div
                style={{
                  width: "200px",
                  aspectRatio: "16 / 9", // Proporção ideal 16:9
                  border: "1px solid rgba(246, 196, 83, 0.3)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  background: "var(--bg-card)"
                }}
              >
                <img
                  src={getImageUrl(bannerForm.imageUrl) || ""}
                  alt="Preview banner"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "cover"
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
          }}
        />
              </div>
            )}
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">URL de Destino (Opcional)</label>
        <input
            placeholder="Ex: /promocoes ou https://..."
          value={bannerForm.linkUrl}
          onChange={(e) =>
            setBannerForm((b) => ({ ...b, linkUrl: e.target.value }))
          }
        />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">Posição</label>
        <input
            placeholder="0, 1, 2..."
          type="number"
          value={bannerForm.position}
          onChange={(e) =>
            setBannerForm((b) => ({
              ...b,
              position: Number(e.target.value) || 0
            }))
          }
            min="0"
        />
        </div>

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

        <button
          className="btn btn-gold"
          type="submit"
          disabled={uploading}
        >
          {uploading ? "Enviando..." : "Adicionar Banner"}
        </button>
      </form>

      <div style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "16px", marginBottom: "16px" }}>
          Banners Cadastrados ({banners.length})
        </h2>
        {banners.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "24px" }}>
            Nenhum banner cadastrado. Adicione um banner acima.
          </p>
        ) : (
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
                    {b.imageUrl ? (
                      <a
                        href={getImageUrl(b.imageUrl) || b.imageUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--gold)" }}
                      >
                        Ver imagem
                </a>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>Sem imagem</span>
                    )}
              </td>
              <td>{b.position}</td>
                  <td>
                    <span
                      style={{
                        color: b.active ? "#4ade80" : "var(--text-muted)",
                        fontWeight: b.active ? 600 : 400
                      }}
                    >
                      {b.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
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
        )}
      </div>
    </section>
  );
}


