import { useEffect, useState } from "react";
import { api } from "../../services/api";

type Settings = Record<string, string>;

export function AdminBrandingPage() {
  const [settingsForm, setSettingsForm] = useState<Settings>({
    "branding.logoUrl": "",
    "branding.faviconUrl": "",
    "branding.loadingBannerUrl": ""
  });
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await api.get<Settings>("/settings");
      setSettingsForm((prev) => ({
        ...prev,
        "branding.logoUrl": res.data["branding.logoUrl"] ?? "",
        "branding.faviconUrl": res.data["branding.faviconUrl"] ?? "",
        "branding.loadingBannerUrl":
          res.data["branding.loadingBannerUrl"] ?? ""
      }));
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

  async function handleFileUpload(
    file: File | undefined,
    settingKey: string
  ) {
    if (!file) return;
    setUploading(settingKey);
    try {
      const url = await uploadFile(file);
      setSettingsForm((s) => ({ ...s, [settingKey]: url }));
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload do arquivo.");
    } finally {
      setUploading(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
    await api.put("/settings", settingsForm);
      alert("Branding salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar branding.");
    } finally {
      setSaving(false);
    }
  }

  const getImageUrl = (url: string) => {
    if (!url) return null;
    // Se já é uma URL completa (http/https), retornar como está
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Se começa com /, é uma URL relativa ao domínio atual - usar diretamente
    if (url.startsWith("/")) {
      return url;
    }
    // Caso contrário, construir URL completa
    // Se o backend está no mesmo domínio, usar window.location.origin
    // Se não, usar o baseURL da API sem /api
    const baseUrl = window.location.origin;
    return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
  };

  return (
    <section className="admin-section">
      <h1>Identidade Visual</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
        Faça upload do logo, favicon e banner de carregamento da aplicação.
      </p>

      <form className="admin-form" onSubmit={handleSave}>
        {/* Logo */}
        <div className="admin-form-group">
          <label className="admin-label">Logo</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
        <input
                placeholder="URL do logo (ou faça upload abaixo)"
          value={settingsForm["branding.logoUrl"] ?? ""}
          onChange={(e) =>
            setSettingsForm((s) => ({
              ...s,
              "branding.logoUrl": e.target.value
            }))
          }
                style={{ marginBottom: "8px" }}
        />
              <label className="admin-file-upload">
        <input
          type="file"
          accept="image/*"
                  onChange={(e) =>
                    handleFileUpload(e.target.files?.[0], "branding.logoUrl")
                  }
                  disabled={uploading === "branding.logoUrl"}
                />
                {uploading === "branding.logoUrl"
                  ? "Enviando..."
                  : "Fazer upload do logo"}
              </label>
            </div>
            {settingsForm["branding.logoUrl"] && (
              <div
                style={{
                  width: "120px",
                  height: "60px",
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
                  src={getImageUrl(settingsForm["branding.logoUrl"]) || ""}
                  alt="Preview logo"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain"
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
          }}
        />
              </div>
            )}
          </div>
        </div>

        {/* Favicon */}
        <div className="admin-form-group">
          <label className="admin-label">Favicon</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
        <input
                placeholder="URL do favicon (ou faça upload abaixo)"
          value={settingsForm["branding.faviconUrl"] ?? ""}
          onChange={(e) =>
            setSettingsForm((s) => ({
              ...s,
              "branding.faviconUrl": e.target.value
            }))
          }
                style={{ marginBottom: "8px" }}
        />
              <label className="admin-file-upload">
        <input
          type="file"
                  accept="image/x-icon,image/png,image/svg+xml"
                  onChange={(e) =>
                    handleFileUpload(
                      e.target.files?.[0],
                      "branding.faviconUrl"
                    )
                  }
                  disabled={uploading === "branding.faviconUrl"}
                />
                {uploading === "branding.faviconUrl"
                  ? "Enviando..."
                  : "Fazer upload do favicon"}
              </label>
            </div>
            {settingsForm["branding.faviconUrl"] && (
              <div
                style={{
                  width: "60px",
                  height: "60px",
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
                  src={getImageUrl(settingsForm["branding.faviconUrl"]) || ""}
                  alt="Preview favicon"
                  style={{
                    width: "32px",
                    height: "32px",
                    objectFit: "contain"
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
          }}
        />
              </div>
            )}
          </div>
        </div>

        {/* Banner de Carregamento */}
        <div className="admin-form-group">
          <label className="admin-label">Banner de Carregamento</label>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
        <input
                placeholder="URL do banner de carregamento (ou faça upload abaixo)"
          value={settingsForm["branding.loadingBannerUrl"] ?? ""}
          onChange={(e) =>
            setSettingsForm((s) => ({
              ...s,
              "branding.loadingBannerUrl": e.target.value
            }))
          }
                style={{ marginBottom: "8px" }}
        />
              <label className="admin-file-upload">
        <input
          type="file"
          accept="image/*"
                  onChange={(e) =>
                    handleFileUpload(
                      e.target.files?.[0],
                      "branding.loadingBannerUrl"
                    )
                  }
                  disabled={uploading === "branding.loadingBannerUrl"}
                />
                {uploading === "branding.loadingBannerUrl"
                  ? "Enviando..."
                  : "Fazer upload do banner"}
              </label>
            </div>
            {settingsForm["branding.loadingBannerUrl"] && (
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
                  src={
                    getImageUrl(settingsForm["branding.loadingBannerUrl"]) || ""
                  }
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

        <button
          className="btn btn-gold"
          type="submit"
          disabled={saving || uploading !== null}
        >
          {saving ? "Salvando..." : "Salvar Branding"}
        </button>
      </form>
    </section>
  );
}


