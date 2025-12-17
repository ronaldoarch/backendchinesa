import { useEffect, useState } from "react";
import { api } from "../../services/api";

type Provider = {
  id?: number;
  name: string;
  externalId?: string;
  active: boolean;
};

type Game = {
  id?: number;
  providerId: number;
  name: string;
  externalId: string;
  imageUrl?: string | null;
  active: boolean;
};

type Settings = Record<string, string>;

type PlayFiversProvider = {
  id?: string;
  provider_id?: string;
  name?: string;
  title?: string;
  enabled?: boolean;
  [key: string]: unknown;
};

type PlayFiversGame = {
  id?: string;
  game_id?: string;
  provider_id?: string;
  provider?: string;
  name?: string;
  title?: string;
  thumbnail?: string;
  category?: string;
  enabled?: boolean;
  [key: string]: unknown;
};

export function AdminPlayfiversPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [settingsForm, setSettingsForm] = useState<Settings>({
    "playfivers.agentId": "",
    "playfivers.secret": "",
    "playfivers.token": "",
    "playfivers.authMethod": "agent"
  });

  // Estados para busca e importação
  const [playfiversProviders, setPlayfiversProviders] = useState<PlayFiversProvider[]>([]);
  const [playfiversGames, setPlayfiversGames] = useState<PlayFiversGame[]>([]);
  const [selectedProviderForGames, setSelectedProviderForGames] = useState<string>("");
  const [gamesLimit, setGamesLimit] = useState<string>("");

  // Estados de loading e mensagens
  const [loading, setLoading] = useState({
    testConnection: false,
    fetchProviders: false,
    fetchGames: false,
    importing: false,
    loadingData: true
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [providerForm, setProviderForm] = useState<Provider>({
    name: "",
    externalId: "",
    active: true
  });

  const [gameForm, setGameForm] = useState<Game>({
    name: "",
    externalId: "",
    providerId: 0,
    imageUrl: "",
    active: true
  });
  const [editingGameId, setEditingGameId] = useState<number | null>(null);

  // Função para gerar URL da imagem baseada no padrão PlayFivers
  function generatePlayFiversImageUrl(providerName: string, gameExternalId: string): string {
    // Normalizar nome do provedor (remover espaços, caracteres especiais)
    const normalizedProvider = providerName
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    // Normalizar ID do jogo (remover espaços, caracteres especiais)
    const normalizedGameId = gameExternalId
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    return `https://imagensfivers.com/Games/${normalizedProvider}/${normalizedGameId}.webp`;
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading((prev) => ({ ...prev, loadingData: true }));
    try {
      // Carregar dados separadamente para não bloquear tudo se uma requisição falhar
      try {
        const pRes = await api.get<Provider[]>("/providers");
        setProviders(pRes.data || []);
        console.log("✅ Provedores carregados:", pRes.data?.length || 0);
      } catch (error: any) {
        console.error("❌ Erro ao carregar provedores:", error.response?.status, error.message);
        const errorMsg = error.response?.data?.error || error.message || "Erro desconhecido";
        if (error.response?.status === 401 || error.response?.status === 403) {
          showMessage("error", `Erro de autenticação ao carregar provedores. Verifique se está logado como admin.`);
        } else {
          showMessage("error", `Erro ao carregar provedores: ${errorMsg}`);
        }
        setProviders([]);
      }

      try {
        const gRes = await api.get<Game[]>("/games");
        setGames(gRes.data || []);
        console.log("✅ Jogos carregados:", gRes.data?.length || 0);
      } catch (error: any) {
        console.error("❌ Erro ao carregar jogos:", error.response?.status, error.message);
        const errorMsg = error.response?.data?.error || error.message || "Erro desconhecido";
        if (error.response?.status === 401 || error.response?.status === 403) {
          showMessage("error", `Erro de autenticação ao carregar jogos. Verifique se está logado como admin.`);
        } else {
          showMessage("error", `Erro ao carregar jogos: ${errorMsg}`);
        }
        setGames([]);
      }

      try {
        const sRes = await api.get<Settings>("/settings");
        console.log("✅ Settings carregados:", Object.keys(sRes.data || {}));
        const settings = sRes.data || {};
      setSettingsForm((prev) => ({
        ...prev,
          "playfivers.agentId": settings["playfivers.agentId"] ?? "",
          "playfivers.secret": settings["playfivers.secret"] ?? "",
          "playfivers.token": settings["playfivers.token"] ?? "",
          "playfivers.authMethod": settings["playfivers.authMethod"] ?? "agent"
        }));
      } catch (error: any) {
        console.error("❌ Erro ao carregar settings:", error.response?.status, error.message);
        if (error.response?.status === 401 || error.response?.status === 403) {
          showMessage("error", `Erro de autenticação ao carregar credenciais. Verifique se está logado como admin.`);
        } else {
          // Não mostrar erro para settings, apenas usar valores padrão
          console.warn("⚠️ Usando valores padrão para credenciais PlayFivers");
        }
      }
    } catch (error: any) {
      console.error("❌ Erro geral ao carregar dados:", error);
      showMessage("error", `Erro ao carregar dados: ${error.message || "Erro desconhecido"}`);
    } finally {
      setLoading((prev) => ({ ...prev, loadingData: false }));
    }
  }

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
    await api.put("/settings", settingsForm);
      showMessage("success", "Credenciais PlayFivers salvas com sucesso!");
    } catch (error) {
      showMessage("error", "Erro ao salvar credenciais");
    }
  }

  async function handleTestConnection() {
    setLoading((prev) => ({ ...prev, testConnection: true }));
    try {
      const response = await api.get("/playfivers/test-connection");
      if (response.data.success) {
        showMessage("success", "✅ Conexão com PlayFivers OK!");
      } else {
        const errorMsg = response.data.error || response.data.message || "Erro desconhecido";
        // Melhorar mensagem de erro para ser mais clara
        if (errorMsg.includes("health check")) {
          showMessage("error", `⚠️ API PlayFivers não respondeu. Verifique se as credenciais estão corretas e se a API está acessível.`);
        } else {
          showMessage("error", `❌ Erro: ${errorMsg}`);
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || "Erro desconhecido";
      // Melhorar mensagem de erro para ser mais clara
      if (errorMsg.includes("health check")) {
        showMessage("error", `⚠️ API PlayFivers não respondeu. Verifique se as credenciais estão corretas e se a API está acessível.`);
      } else if (error.response?.status === 403) {
        showMessage("error", `❌ Acesso negado. Verifique se você tem permissões de administrador.`);
      } else {
        showMessage("error", `Erro ao testar conexão: ${errorMsg}`);
      }
    } finally {
      setLoading((prev) => ({ ...prev, testConnection: false }));
    }
  }

  async function handleSetCallbackUrl() {
    // Obter a URL base da API (remover /api do final se existir)
    const apiBaseUrl = api.defaults.baseURL?.replace(/\/api$/, "") || "";
    const callbackUrl = `${apiBaseUrl}/api/playfivers/callback`;
    
    try {
      const response = await api.post("/playfivers/set-callback-url", {
        callbackUrl
      });
      
      if (response.data.success) {
        showMessage("success", `✅ Callback URL configurada: ${callbackUrl}`);
      } else {
        showMessage("error", `❌ Erro: ${response.data.error || response.data.message}`);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || "Erro desconhecido";
      showMessage("error", `Erro ao configurar callback URL: ${errorMsg}`);
    }
  }

  async function handleFetchProviders() {
    setLoading((prev) => ({ ...prev, fetchProviders: true }));
    try {
      const response = await api.get("/playfivers/providers");
      if (response.data.success && response.data.data) {
        setPlayfiversProviders(response.data.data);
        showMessage("success", `${response.data.data.length} provedores encontrados!`);
      } else {
        showMessage("error", response.data.error || "Erro ao buscar provedores");
      }
    } catch (error: any) {
      showMessage("error", `Erro: ${error.response?.data?.error || error.message}`);
      setPlayfiversProviders([]);
    } finally {
      setLoading((prev) => ({ ...prev, fetchProviders: false }));
    }
  }

  async function handleFetchGames(providerId?: string, limit?: number) {
    setLoading((prev) => ({ ...prev, fetchGames: true }));
    try {
      let url = providerId
        ? `/playfivers/games?provider_id=${providerId}`
        : "/playfivers/games";
      // Adicionar parâmetro limit se fornecido (para testar se a API suporta paginação)
      // Nota: A documentação não menciona este parâmetro, mas vamos testar
      if (limit && limit > 0) {
        url += (url.includes("?") ? "&" : "?") + `limit=${limit}`;
      }
      const response = await api.get(url);
      if (response.data.success && response.data.data) {
        setPlayfiversGames(response.data.data);
        showMessage("success", `${response.data.data.length} jogos encontrados!`);
      } else {
        showMessage("error", response.data.error || "Erro ao buscar jogos");
      }
    } catch (error: any) {
      showMessage("error", `Erro: ${error.response?.data?.error || error.message}`);
      setPlayfiversGames([]);
    } finally {
      setLoading((prev) => ({ ...prev, fetchGames: false }));
    }
  }

  async function handleImportProvider(provider: PlayFiversProvider) {
    try {
      const providerId = provider.provider_id || provider.id || "";
      const name = provider.name || provider.title || "";

      if (!name || !providerId) {
        showMessage("error", "Dados do provedor incompletos");
        return;
      }

      const response = await api.post("/playfivers/import-provider", {
        name,
        externalId: providerId
      });

      if (response.data.success) {
        showMessage("success", `Provedor "${name}" importado com sucesso!`);
        await loadData();
      } else {
        showMessage("error", response.data.message || "Erro ao importar provedor");
      }
    } catch (error: any) {
      showMessage("error", error.response?.data?.message || "Erro ao importar provedor");
    }
  }

  async function handleImportGame(game: PlayFiversGame, localProviderId: number, imageUrl?: string) {
    try {
      // Garantir que todos os valores sejam strings (não objetos)
      const gameId = String(game.game_id || game.id || "").trim();
      const name = String(game.name || game.title || "").trim();

      if (!name || !gameId) {
        showMessage("error", "Dados do jogo incompletos");
        return;
      }

      if (!localProviderId || localProviderId === 0) {
        showMessage("error", "ID do provedor inválido. Importe o provedor primeiro!");
        return;
      }

      const localProvider = providers.find((p) => p.id === localProviderId);
      // Gerar URL automaticamente se não fornecida
      const finalImageUrl = imageUrl || (localProvider ? generatePlayFiversImageUrl(localProvider.name, gameId) : null);

      const response = await api.post("/playfivers/import-game", {
        providerId: Number(localProviderId),
        name: String(name).trim(),
        externalId: String(gameId).trim(),
        imageUrl: finalImageUrl
      });

      if (response.data.success) {
        showMessage("success", `Jogo "${name}" importado com sucesso!`);
        await loadData();
      } else {
        showMessage("error", response.data.message || "Erro ao importar jogo");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      "Erro ao importar jogo";
      console.error("Erro ao importar jogo:", error);
      showMessage("error", `Erro: ${errorMsg}`);
    }
  }

  async function handleBulkImportGames() {
    if (!selectedProviderForGames) {
      showMessage("error", "Selecione um provedor primeiro");
      return;
    }

    const localProvider = providers.find((p) => p.externalId === selectedProviderForGames);
    if (!localProvider || !localProvider.id) {
      showMessage("error", "Provedor não encontrado no banco local. Importe o provedor primeiro!");
      return;
    }

    setLoading((prev) => ({ ...prev, importing: true }));

    try {
      // Filtrar e validar jogos antes de enviar
      const gamesToImport = playfiversGames
        .map((game) => {
          // Garantir que todos os valores sejam strings (não objetos)
          const gameId = String(game.game_id || game.id || "").trim();
          const name = String(game.name || game.title || "").trim();
          
          // Validar dados
          if (!name || !gameId || gameId === "undefined" || name === "undefined") {
            return null;
          }

          // Gerar URL da imagem automaticamente
          const imageUrl = generatePlayFiversImageUrl(localProvider.name, gameId);

          return {
            providerId: Number(localProvider.id!),
            name: name,
            externalId: gameId,
            imageUrl: imageUrl
          };
        })
        .filter((g): g is { providerId: number; name: string; externalId: string; imageUrl: string } => g !== null && g.name !== "" && g.externalId !== "");

      if (gamesToImport.length === 0) {
        showMessage("error", "Nenhum jogo válido para importar. Verifique se os jogos têm nome e ID.");
        setLoading((prev) => ({ ...prev, importing: false }));
        return;
      }

      console.log(`Enviando ${gamesToImport.length} jogos para importação...`, gamesToImport.slice(0, 3));

      const response = await api.post("/playfivers/import-games-bulk", {
        games: gamesToImport
      });

      if (response.data.success) {
        showMessage(
          "success",
          `✅ ${response.data.data.imported} jogos importados! ${response.data.data.errors > 0 ? `${response.data.data.errors} erros.` : ""}`
        );
        await loadData();
      } else {
        showMessage("error", response.data.message || "Erro ao importar jogos");
      }
    } catch (error: any) {
      console.error("Erro ao importar jogos em massa:", error);
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      "Erro ao importar jogos";
      showMessage("error", `Erro: ${errorMsg}`);
      
      // Se houver detalhes dos erros, mostrar
      if (error.response?.data?.errorsList && Array.isArray(error.response.data.errorsList)) {
        console.error("Erros detalhados:", error.response.data.errorsList);
      }
    } finally {
      setLoading((prev) => ({ ...prev, importing: false }));
    }
  }

  async function handleCreateProvider(e: React.FormEvent) {
    e.preventDefault();
    try {
    await api.post("/providers", providerForm);
    setProviderForm({ name: "", externalId: "", active: true });
      showMessage("success", "Provedor criado com sucesso!");
      await loadData();
    } catch (error) {
      showMessage("error", "Erro ao criar provedor");
    }
  }

  async function handleCreateGame(e: React.FormEvent) {
    e.preventDefault();
    if (!gameForm.providerId) {
      showMessage("error", "Selecione um provedor");
      return;
    }
    try {
      if (editingGameId) {
        // Atualizar jogo existente
        await api.put(`/games/${editingGameId}`, gameForm);
        showMessage("success", "Jogo atualizado com sucesso!");
      } else {
        // Criar novo jogo
    await api.post("/games", gameForm);
        showMessage("success", "Jogo criado com sucesso!");
      }
    setGameForm({
      name: "",
      externalId: "",
      providerId: 0,
        imageUrl: "",
      active: true
    });
      setEditingGameId(null);
      await loadData();
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || "Erro desconhecido";
      showMessage("error", `Erro ao ${editingGameId ? "atualizar" : "criar"} jogo: ${errorMsg}`);
    }
  }

  function handleEditGame(game: Game) {
    setGameForm({
      name: game.name,
      externalId: game.externalId,
      providerId: game.providerId,
      imageUrl: game.imageUrl || "",
      active: game.active
    });
    setEditingGameId(game.id || null);
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setGameForm({
      name: "",
      externalId: "",
      providerId: 0,
      imageUrl: "",
      active: true
    });
    setEditingGameId(null);
  }

  async function handleSyncGame(id: number | undefined) {
    if (!id) return;
    try {
      const response = await api.post(`/games/${id}/sync-playfivers`);
      if (response.data.ok) {
        showMessage("success", "Jogo sincronizado com PlayFivers!");
      } else {
        showMessage("error", "Erro ao sincronizar jogo");
      }
    } catch (error) {
      showMessage("error", "Erro ao sincronizar jogo");
    }
  }

  return (
    <>
      {/* Mensagens de feedback */}
      {message && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "12px 20px",
            background: message.type === "success" ? "#4caf50" : "#f44336",
            color: "white",
            borderRadius: "8px",
            zIndex: 10000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}
        >
          {message.text}
        </div>
      )}

      {/* Credenciais */}
      <section className="admin-section">
        <h1>Credenciais PlayFivers (agente)</h1>
        {loading.loadingData && (
          <p style={{ color: "#999", fontSize: "14px", marginBottom: "10px" }}>
            Carregando dados...
          </p>
        )}
        <form className="admin-form" onSubmit={handleSaveSettings}>
          <input
            placeholder="ID do agente"
            value={settingsForm["playfivers.agentId"] ?? ""}
            onChange={(e) =>
              setSettingsForm((s) => ({
                ...s,
                "playfivers.agentId": e.target.value
              }))
            }
          />
          <input
            type="password"
            placeholder="Secret do agente"
            value={settingsForm["playfivers.secret"] ?? ""}
            onChange={(e) =>
              setSettingsForm((s) => ({
                ...s,
                "playfivers.secret": e.target.value
              }))
            }
          />
          <input
            type="password"
            placeholder="Token (API key) da PlayFivers"
            value={settingsForm["playfivers.token"] ?? ""}
            onChange={(e) =>
              setSettingsForm((s) => ({
                ...s,
                "playfivers.token": e.target.value
              }))
            }
          />
          <label>
            <span>Método de Autenticação</span>
            <select
              value={settingsForm["playfivers.authMethod"] ?? "agent"}
              onChange={(e) =>
                setSettingsForm((s) => ({
                  ...s,
                  "playfivers.authMethod": e.target.value
                }))
              }
            >
              <option value="agent">Agent (agentToken + secretKey no body) - Padrão PlayFivers</option>
              <option value="bearer">Bearer Token (Authorization header)</option>
              <option value="api_key">API Key (X-API-Key header)</option>
              <option value="basic">Basic Auth</option>
            </select>
          </label>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button className="btn btn-gold" type="submit">
            Salvar credenciais
          </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleTestConnection}
              disabled={loading.testConnection}
            >
              {loading.testConnection ? "Testando..." : "Testar Conexão"}
            </button>
          </div>
        </form>
        
        {/* Callback URL */}
        <div style={{ marginTop: "20px", padding: "15px", background: "#1a1a1a", borderRadius: "8px", border: "1px solid #333" }}>
          <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Callback URL</h3>
          <p style={{ margin: "5px 0", color: "#999", fontSize: "14px" }}>
            URL para receber callbacks/webhooks da PlayFivers:
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <code style={{ 
              flex: 1, 
              minWidth: "300px", 
              padding: "10px", 
              background: "#0a0a0a", 
              borderRadius: "4px", 
              color: "#4caf50",
              wordBreak: "break-all"
            }}>
              {api.defaults.baseURL?.replace(/\/api$/, "") || ""}/api/playfivers/callback
            </code>
            <button
              type="button"
              className="btn btn-gold"
              onClick={handleSetCallbackUrl}
            >
              Configurar na PlayFivers
            </button>
          </div>
          <p style={{ margin: "10px 0 0 0", color: "#666", fontSize: "12px" }}>
            ⚠️ Certifique-se de que esta URL está acessível publicamente (HTTPS) para receber callbacks.
          </p>
        </div>
      </section>

      {/* Buscar e Importar Provedores da PlayFivers */}
      <section className="admin-section">
        <h2>Buscar Provedores da PlayFivers</h2>
        <div style={{ marginBottom: "20px" }}>
          <button
            className="btn btn-gold"
            onClick={handleFetchProviders}
            disabled={loading.fetchProviders}
          >
            {loading.fetchProviders ? "Buscando..." : "Buscar Provedores"}
          </button>
        </div>

        {playfiversProviders.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3>Provedores encontrados ({playfiversProviders.length})</h3>
            <div
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "10px"
              }}
            >
              {playfiversProviders.map((pfProvider, idx) => {
                const providerId = pfProvider.provider_id || pfProvider.id || "";
                const name = pfProvider.name || pfProvider.title || "";
                const alreadyImported = providers.some(
                  (p) => p.externalId === providerId
                );

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                      marginBottom: "8px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "6px"
                    }}
                  >
                    <div>
                      <strong>{name}</strong>
                      <br />
                      <small style={{ color: "#9b9bb2" }}>ID: {providerId}</small>
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleImportProvider(pfProvider)}
                      disabled={alreadyImported}
                      style={{ opacity: alreadyImported ? 0.5 : 1 }}
                    >
                      {alreadyImported ? "✓ Já importado" : "Importar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Provedores Locais */}
      <section className="admin-section">
        <h2>Provedores (Local) {providers.length > 0 && `(${providers.length})`}</h2>
        <form className="admin-form" onSubmit={handleCreateProvider}>
          <input
            placeholder="Nome do provedor"
            value={providerForm.name}
            onChange={(e) =>
              setProviderForm((p) => ({ ...p, name: e.target.value }))
            }
          />
          <input
            placeholder="ID externo (PlayFivers)"
            value={providerForm.externalId}
            onChange={(e) =>
              setProviderForm((p) => ({ ...p, externalId: e.target.value }))
            }
          />
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={providerForm.active}
              onChange={(e) =>
                setProviderForm((p) => ({ ...p, active: e.target.checked }))
              }
            />
            Ativo
          </label>
          <button className="btn btn-gold" type="submit">
            Adicionar provedor
          </button>
        </form>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Externo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                  Nenhum provedor cadastrado. Adicione um provedor acima ou importe da PlayFivers.
                </td>
              </tr>
            ) : (
              providers.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.externalId}</td>
                <td>{p.active ? "Ativo" : "Inativo"}</td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Buscar e Importar Jogos da PlayFivers */}
      <section className="admin-section">
        <h2>Buscar Jogos da PlayFivers</h2>
        <div style={{ marginBottom: "20px" }}>
          <select
            value={selectedProviderForGames}
            onChange={(e) => {
              setSelectedProviderForGames(e.target.value);
              setPlayfiversGames([]);
              setGamesLimit(""); // Limpar limite ao trocar provedor
            }}
            style={{
              padding: "10px",
              marginRight: "10px",
              background: "var(--bg-elevated)",
              color: "var(--text-main)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              minWidth: "200px"
            }}
          >
            <option value="">Todos os provedores</option>
            {providers
              .filter((p) => p.externalId)
              .map((p) => (
                <option key={p.id} value={p.externalId}>
                  {p.name} ({p.externalId})
                </option>
              ))}
          </select>
          <input
            type="number"
            placeholder="Limite (ex: 100)"
            min="1"
            max="10000"
            value={gamesLimit}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || (Number(val) > 0 && Number(val) <= 10000)) {
                setGamesLimit(val);
              }
            }}
            style={{
              padding: "10px",
              marginRight: "10px",
              background: "var(--bg-elevated)",
              color: "var(--text-main)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              width: "120px"
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                const limit = gamesLimit ? Number(gamesLimit) : undefined;
                handleFetchGames(selectedProviderForGames || undefined, limit);
              }
            }}
          />
          <button
            className="btn btn-gold"
            onClick={() => {
              const limit = gamesLimit ? Number(gamesLimit) : undefined;
              handleFetchGames(selectedProviderForGames || undefined, limit);
            }}
            disabled={loading.fetchGames}
          >
            {loading.fetchGames ? "Buscando..." : "Buscar Jogos"}
          </button>
          {playfiversGames.length > 0 && (
            <button
              className="btn btn-gold"
              onClick={handleBulkImportGames}
              disabled={loading.importing || !selectedProviderForGames}
              style={{ marginLeft: "10px" }}
            >
              {loading.importing ? "Importando..." : `Importar Todos (${playfiversGames.length})`}
            </button>
          )}
        </div>

        {playfiversGames.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h3>Jogos encontrados ({playfiversGames.length})</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>
              {playfiversGames.length > 100 && "⚠️ Muitos jogos encontrados. Mostrando apenas os primeiros 100 para melhor performance."}
            </p>
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "10px"
              }}
            >
              {playfiversGames.slice(0, 100).map((pfGame, idx) => {
                // Garantir que todos os valores sejam strings (não objetos)
                const gameId = String(pfGame.game_id || pfGame.id || "").trim();
                const name = String(pfGame.name || pfGame.title || "").trim();
                const providerId = String(pfGame.provider_id || pfGame.provider || "").trim();
                const localProvider = providers.find((p) => p.externalId === providerId);
                const alreadyImported = localProvider
                  ? games.some(
                      (g) =>
                        String(g.externalId || "").trim() === gameId &&
                        g.providerId === localProvider.id
                    )
                  : false;

                // Validar que temos dados válidos antes de renderizar
                if (!gameId || !name) {
                  return null;
                }

                // Gerar URL da imagem
                const imageUrl = localProvider ? generatePlayFiversImageUrl(localProvider.name, gameId) : null;

                return (
                  <div
                    key={`${gameId}-${idx}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                      marginBottom: "8px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "6px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                      {imageUrl && (
                        <img 
                          src={imageUrl} 
                          alt={name}
                          style={{ 
                            width: "60px", 
                            height: "60px", 
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid rgba(255,255,255,0.1)"
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                    <div>
                        <strong>{name || "Sem nome"}</strong>
                      <br />
                      <small style={{ color: "#9b9bb2" }}>
                          ID: {gameId || "N/A"} | Provider: {providerId || "N/A"}
                      </small>
                        {imageUrl && (
                          <>
                            <br />
                            <small style={{ color: "#4caf50", fontSize: "10px" }}>
                              <a href={imageUrl} target="_blank" rel="noreferrer" style={{ color: "#4caf50" }}>
                                Ver imagem
                              </a>
                            </small>
                          </>
                        )}
                      </div>
                    </div>
                    {localProvider && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleImportGame(pfGame, localProvider.id!, imageUrl || undefined)}
                        disabled={alreadyImported}
                        style={{ opacity: alreadyImported ? 0.5 : 1 }}
                      >
                        {alreadyImported ? "✓ Já importado" : "Importar"}
                      </button>
                    )}
                    {!localProvider && (
                      <small style={{ color: "#9b9bb2" }}>
                        Provedor não encontrado
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Jogos Locais */}
      <section className="admin-section">
        <h2>{editingGameId ? "Editar Jogo" : "Jogos (Local)"} {games.length > 0 && `(${games.length})`}</h2>
        <form className="admin-form" onSubmit={handleCreateGame}>
          <select
            value={gameForm.providerId}
            onChange={(e) =>
              setGameForm((g) => ({
                ...g,
                providerId: Number(e.target.value)
              }))
            }
          >
            <option value={0}>Selecione o provedor</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Nome do jogo"
            value={gameForm.name}
            onChange={(e) =>
              setGameForm((g) => ({ ...g, name: e.target.value }))
            }
          />
          <input
            placeholder="ID externo do jogo (PlayFivers)"
            value={gameForm.externalId}
            onChange={(e) => {
              const externalId = e.target.value;
              setGameForm((g) => {
                // Gerar URL automaticamente quando o ID externo e o provedor estiverem preenchidos
                // Mas apenas se não estiver editando ou se a URL estiver vazia
                const provider = providers.find((p) => p.id === g.providerId);
                const shouldAutoGenerate = !editingGameId || !g.imageUrl;
                const imageUrl = (provider && externalId && shouldAutoGenerate)
                  ? generatePlayFiversImageUrl(provider.name, externalId)
                  : g.imageUrl || "";
                return { ...g, externalId, imageUrl };
              });
            }}
          />
          <input
            placeholder="URL da imagem (gerada automaticamente)"
            value={gameForm.imageUrl || ""}
            onChange={(e) =>
              setGameForm((g) => ({ ...g, imageUrl: e.target.value }))
            }
          />
          {gameForm.imageUrl && (
            <div style={{ marginBottom: "10px" }}>
              <img 
                src={gameForm.imageUrl} 
                alt="Preview" 
                style={{ 
                  maxWidth: "200px", 
                  maxHeight: "150px", 
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <label className="checkbox-line">
            <input
              type="checkbox"
              checked={gameForm.active}
              onChange={(e) =>
                setGameForm((g) => ({ ...g, active: e.target.checked }))
              }
            />
            Ativo
          </label>
          <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-gold" type="submit">
              {editingGameId ? "Atualizar Jogo" : "Adicionar Jogo"}
          </button>
            {editingGameId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Provedor</th>
              <th>Nome</th>
              <th>Externo</th>
              <th>Imagem</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {games.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                  Nenhum jogo cadastrado. Adicione um jogo acima ou importe da PlayFivers.
                </td>
              </tr>
            ) : (
              games.map((g) => (
              <tr key={g.id}>
                <td>{g.id}</td>
                <td>
                  {providers.find((p) => p.id === g.providerId)?.name ??
                    g.providerId}
                </td>
                <td>{g.name}</td>
                <td>{g.externalId}</td>
                  <td>
                    {g.imageUrl ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <img 
                          src={g.imageUrl} 
                          alt={g.name}
                          style={{ 
                            width: "50px", 
                            height: "50px", 
                            objectFit: "cover",
                            borderRadius: "4px",
                            border: "1px solid rgba(255,255,255,0.1)"
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                        <a 
                          href={g.imageUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ fontSize: "11px", color: "#4caf50" }}
                        >
                          Ver
                        </a>
                      </div>
                    ) : (
                      <span style={{ color: "#666", fontSize: "12px" }}>Sem imagem</span>
                    )}
                  </td>
                <td>{g.active ? "Ativo" : "Inativo"}</td>
                <td>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleEditGame(g)}
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                    >
                      Editar
                    </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleSyncGame(g.id)}
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                  >
                    Enviar para PlayFivers
                  </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
