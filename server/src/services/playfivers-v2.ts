import axios, { AxiosInstance } from "axios";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

// Configurações da API PlayFivers
const PLAYFIVERS_BASE_URL =
  process.env.PLAYFIVERS_BASE_URL ?? "https://api.playfivers.com/api";

interface PlayFiversCredentials {
  agentId: string;
  agentSecret: string;
  agentToken: string;
  authMethod: string;
}

interface SettingRow extends RowDataPacket {
  key: string;
  value: string;
}

/**
 * Buscar credenciais do PlayFivers do banco de dados
 */
async function getCredentialsFromDb(): Promise<Partial<PlayFiversCredentials>> {
  try {
    const [rows] = await pool.query<SettingRow[]>(
      "SELECT `key`, `value` FROM settings WHERE `key` LIKE 'playfivers.%'"
    );

    const credentials: Partial<PlayFiversCredentials> = {};

    for (const row of rows) {
      const key = row.key.replace("playfivers.", "");
      if (key === "agentId") credentials.agentId = row.value;
      if (key === "secret") credentials.agentSecret = row.value;
      if (key === "token") credentials.agentToken = row.value;
      if (key === "authMethod") credentials.authMethod = row.value;
    }

    return credentials;
  } catch (error) {
    console.error("Erro ao buscar credenciais do banco:", error);
    return {};
  }
}

/**
 * Obter credenciais (prioridade: env vars > banco de dados)
 */
async function getCredentials(): Promise<PlayFiversCredentials> {
  const dbCreds = await getCredentialsFromDb();

  return {
    agentId: process.env.PLAYFIVERS_AGENT_ID || dbCreds.agentId || "",
    agentSecret:
      process.env.PLAYFIVERS_AGENT_SECRET || dbCreds.agentSecret || "",
    agentToken: process.env.PLAYFIVERS_AGENT_TOKEN || dbCreds.agentToken || "",
    authMethod: process.env.PLAYFIVERS_AUTH_METHOD || dbCreds.authMethod || "bearer"
  };
}

/**
 * Criar cliente HTTP com autenticação apropriada
 */
async function createClient(): Promise<AxiosInstance> {
  const creds = await getCredentials();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  // Validar credenciais
  if (!creds.agentToken && !creds.agentId) {
    throw new Error("Credenciais PlayFivers não configuradas. Configure agentToken ou agentId/agentSecret.");
  }

  // Configurar autenticação baseado no método
  switch (creds.authMethod.toLowerCase()) {
    case "api_key":
      if (creds.agentToken) {
        headers["X-API-Key"] = creds.agentToken;
      }
      break;
    case "bearer":
      if (creds.agentToken) {
        headers["Authorization"] = `Bearer ${creds.agentToken}`;
      }
      break;
    case "agent":
      // Autenticação será no body de cada requisição
      if (!creds.agentId || !creds.agentSecret) {
        throw new Error("Para autenticação 'agent', agentId e agentSecret são obrigatórios.");
      }
      break;
    case "basic":
      // Basic Auth com agentId:agentSecret
      if (creds.agentId && creds.agentSecret) {
        const basicAuth = Buffer.from(`${creds.agentId}:${creds.agentSecret}`).toString("base64");
        headers["Authorization"] = `Basic ${basicAuth}`;
      }
      break;
    default:
      // Tentar Bearer por padrão
      if (creds.agentToken) {
        headers["Authorization"] = `Bearer ${creds.agentToken}`;
      }
  }

  const client = axios.create({
    baseURL: PLAYFIVERS_BASE_URL,
    headers,
    timeout: 30000 // 30 segundos
  });

  // Interceptor para log de requisições (debug)
  client.interceptors.request.use((config) => {
    // eslint-disable-next-line no-console
    console.log(`[PlayFivers] ${config.method?.toUpperCase()} ${config.url}`, {
      hasAuth: !!config.headers.Authorization || !!config.headers["X-API-Key"],
      authMethod: creds.authMethod
    });
    return config;
  });

  // Interceptor para log de respostas (debug)
  client.interceptors.response.use(
    (response) => {
      // eslint-disable-next-line no-console
      console.log(`[PlayFivers] ✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
      return response;
    },
    (error) => {
      // eslint-disable-next-line no-console
      console.error(`[PlayFivers] ❌ ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || "NO_RESPONSE"}`, {
        message: error.message,
        responseData: error.response?.data,
        status: error.response?.status
      });
      return Promise.reject(error);
    }
  );

  return client;
}

// Tipos
type RegisterGamePayload = {
  providerExternalId: string;
  gameExternalId: string;
  name: string;
};

type PlayFiversResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
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

type PlayFiversProvider = {
  id?: string;
  provider_id?: string;
  name?: string;
  title?: string;
  enabled?: boolean;
  [key: string]: unknown;
};

// Serviço PlayFivers
export const playFiversService = {
  /**
   * Obter credenciais atuais
   */
  async getCredentials(): Promise<PlayFiversCredentials> {
    return await getCredentials();
  },

  /**
   * Registrar jogo na PlayFivers
   */
  async registerGame(
    payload: RegisterGamePayload
  ): Promise<PlayFiversResponse> {
    try {
      const client = await createClient();
      const creds = await getCredentials();

      // Preparar dados conforme método de autenticação
      const requestData: Record<string, unknown> = {
        provider_id: payload.providerExternalId,
        providerId: payload.providerExternalId, // Tentar ambos os formatos
        game_id: payload.gameExternalId,
        gameId: payload.gameExternalId, // Tentar ambos os formatos
        name: payload.name,
        title: payload.name // Algumas APIs usam 'title' em vez de 'name'
      };

      if (creds.authMethod === "agent") {
        requestData.agent_id = creds.agentId;
        requestData.agent_secret = creds.agentSecret;
      }

      // Tentar múltiplos endpoints possíveis
      const endpoints = [
        "/v1/games",
        "/games",
        "/casino/games",
        "/api/v1/games",
        "/agent/games",
        "/v1/agent/games",
        "/v1/casino/games"
      ];

      let lastError: Error | null = null;
      let lastResponse: any = null;

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.post(endpoint, requestData);

          // eslint-disable-next-line no-console
          console.log(`✅ Jogo registrado com sucesso via ${endpoint}: ${payload.name}`);

          return {
            success: true,
            data,
            message: "Jogo registrado com sucesso"
          };
        } catch (error: any) {
          lastError = error;
          lastResponse = error.response;

          // Se for 404, tentar próximo endpoint
          if (error.response?.status === 404) {
            continue;
          }

          // Se for 401/403, credenciais podem estar erradas
          if (error.response?.status === 401 || error.response?.status === 403) {
            return {
              success: false,
              error: "Credenciais inválidas ou sem permissão",
              message: `Erro de autenticação ao registrar jogo (status: ${error.response.status})`
            };
          }

          // Se for 400, pode ser dados inválidos
          if (error.response?.status === 400) {
            return {
              success: false,
              error: error.response.data?.message || "Dados inválidos",
              message: `Erro ao registrar jogo: ${error.response.data?.message || "Dados inválidos"}`
            };
          }

          // Para outros erros, não tentar mais endpoints
          break;
        }
      }

      const errorMessage = lastResponse
        ? `Todos os endpoints falharam. Último erro: ${lastResponse.status} - ${lastError?.message}`
        : `Todos os endpoints falharam. ${lastError?.message || "Erro desconhecido"}`;

      return {
        success: false,
        error: errorMessage,
        message: "Erro ao registrar jogo"
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao registrar jogo na PlayFivers:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao registrar jogo"
      };
    }
  },

  /**
   * Registrar provedor na PlayFivers
   */
  async registerProvider(
    providerExternalId: string,
    providerName: string
  ): Promise<PlayFiversResponse> {
    try {
      const client = await createClient();
      const creds = await getCredentials();

      const requestData: Record<string, unknown> = {
        provider_id: providerExternalId,
        providerId: providerExternalId, // Tentar ambos os formatos
        name: providerName,
        title: providerName // Algumas APIs usam 'title'
      };

      if (creds.authMethod === "agent") {
        requestData.agent_id = creds.agentId;
        requestData.agent_secret = creds.agentSecret;
      }

      // Tentar múltiplos endpoints
      const endpoints = [
        "/v1/providers",
        "/providers",
        "/agent/providers",
        "/v1/agent/providers",
        "/v1/casino/providers",
        "/casino/providers"
      ];

      let lastError: Error | null = null;
      let lastResponse: any = null;

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.post(endpoint, requestData);
          
          // eslint-disable-next-line no-console
          console.log(`✅ Provedor registrado com sucesso via ${endpoint}: ${providerName}`);
          
          return {
            success: true,
            data,
            message: "Provedor registrado com sucesso"
          };
        } catch (error: any) {
          lastError = error;
          lastResponse = error.response;

          if (error.response?.status === 404) continue;

          // Se for 401/403, credenciais podem estar erradas
          if (error.response?.status === 401 || error.response?.status === 403) {
            return {
              success: false,
              error: "Credenciais inválidas ou sem permissão",
              message: `Erro de autenticação ao registrar provedor (status: ${error.response.status})`
            };
          }

          // Se for 400, pode ser dados inválidos
          if (error.response?.status === 400) {
            return {
              success: false,
              error: error.response.data?.message || "Dados inválidos",
              message: `Erro ao registrar provedor: ${error.response.data?.message || "Dados inválidos"}`
            };
          }

          // Para outros erros, não tentar mais endpoints
          break;
        }
      }

      const errorMessage = lastResponse
        ? `Todos os endpoints falharam. Último erro: ${lastResponse.status} - ${lastError?.message}`
        : `Todos os endpoints falharam. ${lastError?.message || "Erro desconhecido"}`;

      return {
        success: false,
        error: errorMessage,
        message: "Erro ao registrar provedor"
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao registrar provedor:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao registrar provedor"
      };
    }
  },

  /**
   * Testar conexão com a API
   */
  async testConnection(): Promise<PlayFiversResponse> {
    try {
      const creds = await getCredentials();
      
      // Validar credenciais básicas
      if (!creds.agentToken && (!creds.agentId || !creds.agentSecret)) {
        return {
          success: false,
          error: "Credenciais não configuradas",
          message: "Configure as credenciais PlayFivers antes de testar a conexão"
        };
      }

      const client = await createClient();

      // Tentar múltiplos endpoints de health check e info
      const endpoints = [
        "/health",
        "/",
        "/v1/health",
        "/api/health",
        "/v1/status",
        "/status",
        "/v1/info",
        "/info",
        "/v1/agent/info",
        "/agent/info"
      ];

      let lastError: Error | null = null;
      let lastResponse: any = null;

      for (const endpoint of endpoints) {
        try {
          const { data, status } = await client.get(endpoint);
          
          // Se recebeu resposta, mesmo que seja erro de auth, a API está acessível
          return {
            success: true,
            data,
            message: `Conexão OK (endpoint: ${endpoint}, status: ${status})`
          };
        } catch (error: any) {
          lastError = error;
          lastResponse = error.response;

          // Se for 404, tentar próximo endpoint
          if (error.response?.status === 404) {
            continue;
          }

          // Se for 401/403, a API está acessível mas as credenciais podem estar erradas
          if (error.response?.status === 401 || error.response?.status === 403) {
            return {
              success: false,
              error: "Credenciais inválidas ou sem permissão",
              message: `API acessível mas autenticação falhou (status: ${error.response.status}). Verifique as credenciais.`,
              data: error.response.data
            };
          }

          // Se recebeu resposta (mesmo que erro), a API está acessível
          if (error.response) {
            return {
              success: true,
              message: `API acessível (endpoint: ${endpoint}, status: ${error.response.status})`,
              data: error.response.data
            };
          }
        }
      }

      // Se nenhum endpoint respondeu
      const errorMessage = lastResponse
        ? `Nenhum endpoint respondeu corretamente. Último erro: ${lastResponse.status} - ${lastError?.message}`
        : `Nenhum endpoint respondeu. Verifique se a URL base está correta: ${PLAYFIVERS_BASE_URL}`;

      return {
        success: false,
        error: errorMessage,
        message: "Falha na conexão com a API PlayFivers"
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao testar conexão com PlayFivers:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao testar conexão"
      };
    }
  },

  /**
   * Buscar lista de provedores disponíveis na PlayFivers
   */
  async getAvailableProviders(): Promise<PlayFiversResponse<PlayFiversProvider[]>> {
    try {
      const client = await createClient();
      const creds = await getCredentials();

      // Preparar request config baseado no método de autenticação
      const requestConfig: any = {};

      // Se usar autenticação agent, pode precisar incluir no body ou params
      if (creds.authMethod === "agent") {
        requestConfig.params = {
          agent_id: creds.agentId,
          agent_secret: creds.agentSecret
        };
      }

      // Tentar múltiplos endpoints possíveis
      const endpoints = [
        "/v1/providers",
        "/providers",
        "/agent/providers",
        "/api/v1/providers",
        "/v1/casino/providers",
        "/casino/providers"
      ];

      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.get(endpoint, requestConfig);

          // Normalizar resposta (pode vir em diferentes formatos)
          let providers: PlayFiversProvider[] = [];

          if (Array.isArray(data)) {
            providers = data;
          } else if (data.providers && Array.isArray(data.providers)) {
            providers = data.providers;
          } else if (data.data && Array.isArray(data.data)) {
            providers = data.data;
          } else if (data.result && Array.isArray(data.result)) {
            providers = data.result;
          } else if (data.items && Array.isArray(data.items)) {
            providers = data.items;
          } else if (data.list && Array.isArray(data.list)) {
            providers = data.list;
          }

          if (providers.length > 0) {
            // eslint-disable-next-line no-console
            console.log(`✅ Provedores encontrados via ${endpoint}: ${providers.length}`);
            return {
              success: true,
              data: providers,
              message: `${providers.length} provedores encontrados`
            };
          }

          // Se não encontrou providers mas recebeu resposta, pode ser formato diferente
          // eslint-disable-next-line no-console
          console.warn(`⚠️ Endpoint ${endpoint} respondeu mas formato não reconhecido:`, Object.keys(data));
        } catch (error: any) {
          lastError = error;
          
          // Se for 404, tentar próximo endpoint
          if (error.response?.status === 404) {
            continue;
          }

          // Se for 401/403, credenciais podem estar erradas
          if (error.response?.status === 401 || error.response?.status === 403) {
            return {
              success: false,
              error: "Credenciais inválidas ou sem permissão",
              message: `Erro de autenticação ao buscar provedores (status: ${error.response.status})`
            };
          }

          // Para outros erros, não tentar mais endpoints
          break;
        }
      }

      const errorMessage = lastError
        ? `Nenhum endpoint retornou dados. Último erro: ${lastError.message}`
        : "Nenhum endpoint retornou dados";

      return {
        success: false,
        error: errorMessage,
        message: "Erro ao buscar provedores"
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao buscar provedores:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao buscar provedores"
      };
    }
  },

  /**
   * Configurar callback URL na PlayFivers
   */
  async setCallbackUrl(callbackUrl: string): Promise<PlayFiversResponse> {
    try {
      const client = await createClient();
      const creds = await getCredentials();

      // Preparar dados baseado no método de autenticação
      const requestData: Record<string, unknown> = {
        callback_url: callbackUrl,
        webhook_url: callbackUrl // Tentar ambos os nomes
      };

      if (creds.authMethod === "agent") {
        requestData.agent_id = creds.agentId;
        requestData.agent_secret = creds.agentSecret;
      }

      // Tentar múltiplos endpoints possíveis para configurar callback
      const endpoints = [
        "/v1/agent/callback",
        "/agent/callback",
        "/v1/callback",
        "/callback",
        "/webhook",
        "/v1/webhook",
        "/agent/webhook",
        "/v1/agent/webhook",
        "/v1/settings/callback",
        "/settings/callback"
      ];

      let lastError: Error | null = null;
      let lastResponse: any = null;

      for (const endpoint of endpoints) {
        try {
          // Tentar POST primeiro
          let response;
          try {
            response = await client.post(endpoint, requestData);
          } catch (postError: any) {
            // Se POST falhar, tentar PUT
            if (postError.response?.status === 405) {
              response = await client.put(endpoint, requestData);
            } else {
              throw postError;
            }
          }

          // eslint-disable-next-line no-console
          console.log(`✅ Callback URL configurada via ${endpoint}: ${callbackUrl}`);

          return {
            success: true,
            data: response.data,
            message: `Callback URL configurada com sucesso (endpoint: ${endpoint})`
          };
        } catch (error: any) {
          lastError = error;
          lastResponse = error.response;

          // Se for 404, tentar próximo endpoint
          if (error.response?.status === 404) {
            continue;
          }

          // Se for 401/403, credenciais podem estar erradas
          if (error.response?.status === 401 || error.response?.status === 403) {
            return {
              success: false,
              error: "Credenciais inválidas ou sem permissão",
              message: `Erro de autenticação ao configurar callback (status: ${error.response.status})`
            };
          }

          // Para outros erros, não tentar mais endpoints
          break;
        }
      }

      const errorMessage = lastResponse
        ? `Nenhum endpoint aceitou a configuração. Último erro: ${lastResponse.status} - ${lastError?.message}`
        : `Nenhum endpoint aceitou a configuração. ${lastError?.message || "Erro desconhecido"}`;

      return {
        success: false,
        error: errorMessage,
        message: "Não foi possível configurar a callback URL. Verifique a documentação da PlayFivers ou configure manualmente no painel."
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao configurar callback URL:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao configurar callback URL"
      };
    }
  },

  /**
   * Buscar lista de jogos disponíveis na PlayFivers
   */
  async getAvailableGames(
    providerId?: string
  ): Promise<PlayFiversResponse<PlayFiversGame[]>> {
    try {
      const client = await createClient();
      const creds = await getCredentials();

      // Construir parâmetros
      const params: Record<string, string> = {};
      if (providerId) {
        params.provider_id = providerId;
        params.providerId = providerId; // Tentar ambos os formatos
      }

      // Se usar autenticação agent, pode precisar incluir no params
      const requestConfig: any = { params };

      if (creds.authMethod === "agent") {
        requestConfig.params = {
          ...requestConfig.params,
          agent_id: creds.agentId,
          agent_secret: creds.agentSecret
        };
      }

      // Tentar múltiplos endpoints possíveis
      const endpoints = [
        "/v1/games",
        "/games",
        "/agent/games",
        "/api/v1/games",
        "/casino/games",
        "/v1/casino/games"
      ];

      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.get(endpoint, requestConfig);

          // Normalizar resposta (pode vir em diferentes formatos)
          let games: PlayFiversGame[] = [];

          if (Array.isArray(data)) {
            games = data;
          } else if (data.games && Array.isArray(data.games)) {
            games = data.games;
          } else if (data.data && Array.isArray(data.data)) {
            games = data.data;
          } else if (data.result && Array.isArray(data.result)) {
            games = data.result;
          } else if (data.items && Array.isArray(data.items)) {
            games = data.items;
          } else if (data.list && Array.isArray(data.list)) {
            games = data.list;
          }

          if (games.length > 0 || data) {
            // eslint-disable-next-line no-console
            console.log(`✅ Jogos encontrados via ${endpoint}: ${games.length}`);
            return {
              success: true,
              data: games,
              message: `${games.length} jogos encontrados`
            };
          }

          // Se não encontrou games mas recebeu resposta, pode ser formato diferente
          // eslint-disable-next-line no-console
          console.warn(`⚠️ Endpoint ${endpoint} respondeu mas formato não reconhecido:`, Object.keys(data));
        } catch (error: any) {
          lastError = error;
          
          // Se for 404, tentar próximo endpoint
          if (error.response?.status === 404) {
            continue;
          }

          // Se for 401/403, credenciais podem estar erradas
          if (error.response?.status === 401 || error.response?.status === 403) {
            return {
              success: false,
              error: "Credenciais inválidas ou sem permissão",
              message: `Erro de autenticação ao buscar jogos (status: ${error.response.status})`
            };
          }

          // Para outros erros, não tentar mais endpoints
          break;
        }
      }

      const errorMessage = lastError
        ? `Nenhum endpoint retornou dados. Último erro: ${lastError.message}`
        : "Nenhum endpoint retornou dados";

      return {
        success: false,
        error: errorMessage,
        message: "Erro ao buscar jogos"
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao buscar jogos:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao buscar jogos"
      };
    }
  }
};
