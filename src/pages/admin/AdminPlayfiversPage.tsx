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
    "playfivers.token": ""
  });

  // Estados para busca e importação
  const [playfiversProviders, setPlayfiversProviders] = useState<PlayFiversProvider[]>([]);
  const [playfiversGames, setPlayfiversGames] = useState<PlayFiversGame[]>([]);
  const [selectedProviderForGames, setSelectedProviderForGames] = useState<string>("");

  // Estados de loading e mensagens
  const [loading, setLoading] = useState({
    testConnection: false,
    fetchProviders: false,
    fetchGames: false,
    importing: false
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
    active: true
  });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const [pRes, gRes, sRes] = await Promise.all([
        api.get<Provider[]>("/providers"),
        api.get<Game[]>("/games"),
        api.get<Settings>("/settings")
      ]);
      setProviders(pRes.data);
      setGames(gRes.data);
      setSettingsForm((prev) => ({
        ...prev,
        "playfivers.agentId": sRes.data["playfivers.agentId"] ?? "",
        "playfivers.secret": sRes.data["playfivers.secret"] ?? "",
        "playfivers.token": sRes.data["playfivers.token"] ?? ""
      }));
    } catch (error) {
      showMessage("error", "Erro ao carregar dados");
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
        showMessage("error", `❌ Erro: ${response.data.error || response.data.message}`);
      }
    } catch (error: any) {
      showMessage("error", `Erro ao testar conexão: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, testConnection: false }));
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

  async function handleFetchGames(providerId?: string) {
    setLoading((prev) => ({ ...prev, fetchGames: true }));
    try {
      const url = providerId
        ? `/playfivers/games?provider_id=${providerId}`
        : "/playfivers/games";
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

  async function handleImportGame(game: PlayFiversGame, localProviderId: number) {
    try {
      const gameId = game.game_id || game.id || "";
      const name = game.name || game.title || "";

      if (!name || !gameId) {
        showMessage("error", "Dados do jogo incompletos");
        return;
      }

      const response = await api.post("/playfivers/import-game", {
        providerId: localProviderId,
        name,
        externalId: gameId
      });

      if (response.data.success) {
        showMessage("success", `Jogo "${name}" importado com sucesso!`);
        await loadData();
      } else {
        showMessage("error", response.data.message || "Erro ao importar jogo");
      }
    } catch (error: any) {
      showMessage("error", error.response?.data?.message || "Erro ao importar jogo");
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
      const gamesToImport = playfiversGames.map((game) => ({
        providerId: localProvider.id!,
        name: game.name || game.title || "",
        externalId: game.game_id || game.id || ""
      })).filter((g) => g.name && g.externalId);

      if (gamesToImport.length === 0) {
        showMessage("error", "Nenhum jogo válido para importar");
        return;
      }

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
        showMessage("error", "Erro ao importar jogos");
      }
    } catch (error: any) {
      showMessage("error", error.response?.data?.message || "Erro ao importar jogos");
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
    await api.post("/games", gameForm);
    setGameForm({
      name: "",
      externalId: "",
      providerId: 0,
      active: true
    });
      showMessage("success", "Jogo criado com sucesso!");
      await loadData();
    } catch (error) {
      showMessage("error", "Erro ao criar jogo");
    }
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
        <h2>Provedores (Local)</h2>
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
            {providers.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.externalId}</td>
                <td>{p.active ? "Ativo" : "Inativo"}</td>
              </tr>
            ))}
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
          <button
            className="btn btn-gold"
            onClick={() => handleFetchGames(selectedProviderForGames || undefined)}
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
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "10px"
              }}
            >
              {playfiversGames.map((pfGame, idx) => {
                const gameId = pfGame.game_id || pfGame.id || "";
                const name = pfGame.name || pfGame.title || "";
                const providerId = pfGame.provider_id || pfGame.provider || "";
                const localProvider = providers.find((p) => p.externalId === providerId);
                const alreadyImported = localProvider
                  ? games.some(
                      (g) =>
                        g.externalId === gameId &&
                        g.providerId === localProvider.id
                    )
                  : false;

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
                      <small style={{ color: "#9b9bb2" }}>
                        ID: {gameId} | Provider: {providerId}
                      </small>
                    </div>
                    {localProvider && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => handleImportGame(pfGame, localProvider.id!)}
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
        <h2>Jogos (Local)</h2>
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
            onChange={(e) =>
              setGameForm((g) => ({ ...g, externalId: e.target.value }))
            }
          />
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
          <button className="btn btn-gold" type="submit">
            Adicionar jogo
          </button>
        </form>

        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Provedor</th>
              <th>Nome</th>
              <th>Externo</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.id}>
                <td>{g.id}</td>
                <td>
                  {providers.find((p) => p.id === g.providerId)?.name ??
                    g.providerId}
                </td>
                <td>{g.name}</td>
                <td>{g.externalId}</td>
                <td>{g.active ? "Ativo" : "Inativo"}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleSyncGame(g.id)}
                  >
                    Enviar para PlayFivers
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
