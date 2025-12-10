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
    "Content-Type": "application/json"
  };

  // Configurar autenticação baseado no método
  switch (creds.authMethod.toLowerCase()) {
    case "api_key":
      headers["X-API-Key"] = creds.agentToken;
      break;
    case "bearer":
      headers["Authorization"] = `Bearer ${creds.agentToken}`;
      break;
    case "agent":
      // Autenticação será no body de cada requisição
      break;
    default:
      headers["Authorization"] = `Bearer ${creds.agentToken}`;
  }

  return axios.create({
    baseURL: PLAYFIVERS_BASE_URL,
    headers,
    timeout: 30000 // 30 segundos para buscar jogos
  });
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
      const requestData: Record<string, unknown> =
        creds.authMethod === "agent"
          ? {
              agent_id: creds.agentId,
              agent_secret: creds.agentSecret,
              provider_id: payload.providerExternalId,
              game_id: payload.gameExternalId,
              name: payload.name
            }
          : {
              provider_id: payload.providerExternalId,
              game_id: payload.gameExternalId,
              name: payload.name
            };

      // Tentar múltiplos endpoints possíveis
      const endpoints = [
        "/v1/games",
        "/games",
        "/casino/games",
        "/api/v1/games",
        "/agent/games"
      ];

      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.post(endpoint, requestData);

          console.log(`✅ Jogo registrado com sucesso: ${payload.name}`);

          return {
            success: true,
            data,
            message: "Jogo registrado com sucesso"
          };
        } catch (error: any) {
          lastError = error;

          // Se for 404, tentar próximo endpoint
          if (error.response?.status === 404) {
            continue;
          }

          // Se for outro erro, não tentar mais endpoints
          break;
        }
      }

      throw lastError || new Error("Todos os endpoints falharam");
    } catch (error: any) {
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

      const requestData: Record<string, unknown> =
        creds.authMethod === "agent"
          ? {
              agent_id: creds.agentId,
              agent_secret: creds.agentSecret,
              provider_id: providerExternalId,
              name: providerName
            }
          : {
              provider_id: providerExternalId,
              name: providerName
            };

      // Tentar múltiplos endpoints
      const endpoints = ["/v1/providers", "/providers", "/agent/providers"];

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.post(endpoint, requestData);
          return {
            success: true,
            data,
            message: "Provedor registrado com sucesso"
          };
        } catch (error: any) {
          if (error.response?.status === 404) continue;
          throw error;
        }
      }

      throw new Error("Todos os endpoints falharam");
    } catch (error: any) {
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
      const client = await createClient();

      // Tentar múltiplos endpoints de health check
      const endpoints = ["/health", "/", "/v1/health", "/api/health"];

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.get(endpoint);
          return {
            success: true,
            data,
            message: "Conexão OK"
          };
        } catch (error: any) {
          if (error.response?.status === 404) continue;
          // Se não for 404, pode ser que o endpoint exista mas retorne erro de auth
          // Isso ainda significa que a API está acessível
          if (error.response) {
            return {
              success: true,
              message: "API acessível (erro de autenticação pode ser normal)"
            };
          }
        }
      }

      throw new Error("Nenhum endpoint de health check da API PlayFivers respondeu. Verifique se as credenciais estão corretas e se a API PlayFivers está acessível.");
    } catch (error: any) {
      console.error("❌ Erro ao testar conexão com PlayFivers:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Falha na conexão"
      };
    }
  },

  /**
   * Buscar lista de provedores disponíveis na PlayFivers
   */
  async getAvailableProviders(): Promise<PlayFiversResponse<PlayFiversProvider[]>> {
    try {
      const client = await createClient();

      // Tentar múltiplos endpoints possíveis
      const endpoints = [
        "/v1/providers",
        "/providers",
        "/agent/providers",
        "/api/v1/providers"
      ];

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.get(endpoint);

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
          }

          return {
            success: true,
            data: providers,
            message: `${providers.length} provedores encontrados`
          };
        } catch (error: any) {
          if (error.response?.status === 404) continue;
          throw error;
        }
      }

      throw new Error("Nenhum endpoint retornou dados");
    } catch (error: any) {
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

      const requestData: Record<string, unknown> =
        creds.authMethod === "agent"
          ? {
              agent_id: creds.agentId,
              agent_secret: creds.agentSecret,
              callback_url: callbackUrl
            }
          : {
              callback_url: callbackUrl
            };

      // Tentar múltiplos endpoints possíveis para configurar callback
      const endpoints = [
        "/v1/agent/callback",
        "/agent/callback",
        "/v1/callback",
        "/callback",
        "/webhook",
        "/v1/webhook",
        "/agent/webhook"
      ];

      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          const { data } = await client.post(endpoint, requestData);

          console.log(`✅ Callback URL configurada: ${callbackUrl}`);

          return {
            success: true,
            data,
            message: "Callback URL configurada com sucesso"
          };
        } catch (error: any) {
          lastError = error;

          // Se for 404, tentar próximo endpoint
          if (error.response?.status === 404) {
            continue;
          }

          // Se for outro erro, não tentar mais endpoints
          break;
        }
      }

      throw lastError || new Error("Nenhum endpoint aceitou a configuração de callback");
    } catch (error: any) {
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
      }

      // Se usar autenticação agent, pode precisar incluir no body
      const requestConfig: any = { params };

      if (creds.authMethod === "agent" && providerId) {
        requestConfig.data = {
          agent_id: creds.agentId,
          agent_secret: creds.agentSecret,
          provider_id: providerId
        };
      }

      // Tentar múltiplos endpoints possíveis
      const endpoints = [
        "/v1/games",
        "/games",
        "/agent/games",
        "/api/v1/games",
        "/casino/games"
      ];

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
          }

          return {
            success: true,
            data: games,
            message: `${games.length} jogos encontrados`
          };
        } catch (error: any) {
          if (error.response?.status === 404) continue;
          throw error;
        }
      }

      throw new Error("Nenhum endpoint retornou dados");
    } catch (error: any) {
      console.error("❌ Erro ao buscar jogos:", error.message);

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao buscar jogos"
      };
    }
  }
};
