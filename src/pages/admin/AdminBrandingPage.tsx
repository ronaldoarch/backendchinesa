import { useEffect, useState } from "react";
import { api } from "../../services/api";

type Settings = Record<string, string>;

export function AdminBrandingPage() {
  const [settingsForm, setSettingsForm] = useState<Settings>({
    "branding.logoUrl": "",
    "branding.faviconUrl": "",
    "branding.loadingBannerUrl": ""
  });

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await api.put("/settings", settingsForm);
    // eslint-disable-next-line no-alert
    alert("Branding salvo com sucesso.");
  }

  return (
    <section className="admin-section">
      <h1>Identidade visual</h1>
      <form className="admin-form" onSubmit={handleSave}>
        <input
          placeholder="URL do logo"
          value={settingsForm["branding.logoUrl"] ?? ""}
          onChange={(e) =>
            setSettingsForm((s) => ({
              ...s,
              "branding.logoUrl": e.target.value
            }))
          }
        />
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadFile(file);
            setSettingsForm((s) => ({ ...s, "branding.logoUrl": url }));
          }}
        />

        <input
          placeholder="URL do favicon"
          value={settingsForm["branding.faviconUrl"] ?? ""}
          onChange={(e) =>
            setSettingsForm((s) => ({
              ...s,
              "branding.faviconUrl": e.target.value
            }))
          }
        />
        <input
          type="file"
          accept="image/x-icon,image/png"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadFile(file);
            setSettingsForm((s) => ({ ...s, "branding.faviconUrl": url }));
          }}
        />

        <input
          placeholder="URL do banner de carregamento"
          value={settingsForm["branding.loadingBannerUrl"] ?? ""}
          onChange={(e) =>
            setSettingsForm((s) => ({
              ...s,
              "branding.loadingBannerUrl": e.target.value
            }))
          }
        />
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await uploadFile(file);
            setSettingsForm((s) => ({
              ...s,
              "branding.loadingBannerUrl": url
            }));
          }}
        />

        <button className="btn btn-gold" type="submit">
          Salvar branding
        </button>
      </form>
    </section>
  );
}


