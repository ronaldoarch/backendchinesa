import axios, { AxiosInstance } from "axios";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

// Configurações da API PlayFivers
// Base URL: https://api.playfivers.com
// API v2: /api/v2/*
// Garantir que não tenha /api no final para evitar duplicação
const getPlayFiversBaseUrl = (): string => {
  const url = process.env.PLAYFIVERS_BASE_URL ?? "https://api.playfivers.com";
  // Remover /api do final se existir para evitar duplicação
  const baseUrl = url.replace(/\/api\/?$/, "");
  
  // Log para debug - verificar se URL está correta
  console.log(`[PlayFivers] URL base configurada:`, {
    fromEnv: process.env.PLAYFIVERS_BASE_URL || "não configurado (usando padrão)",
    finalUrl: baseUrl,
    isCorrect: baseUrl.includes("playfivers.com") && !baseUrl.includes("suitpay")
  });
  
  // Validar que não está usando URL do SuitPay por engano
  if (baseUrl.includes("suitpay")) {
    console.error(`❌ [PlayFivers] ERRO CRÍTICO: URL configurada está usando SuitPay!`);
    console.error(`❌ [PlayFivers] URL atual: ${baseUrl}`);
    console.error(`❌ [PlayFivers] Configure PLAYFIVERS_BASE_URL=https://api.playfivers.com no Coolify`);
  }
  
  return baseUrl;
};

const PLAYFIVERS_BASE_URL = getPlayFiversBaseUrl();

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
      if (key === "agentId" || key === "agent_id") credentials.agentId = row.value;
      if (key === "secret" || key === "secretKey" || key === "secret_key") credentials.agentSecret = row.value;
      if (key === "token" || key === "agentToken" || key === "agent_token") credentials.agentToken = row.value;
      if (key === "authMethod" || key === "auth_method") credentials.authMethod = row.value;
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
    authMethod: process.env.PLAYFIVERS_AUTH_METHOD || dbCreds.authMethod || "agent" // Padrão: agent (body)
  };
}

/**
 * Criar cliente HTTP com autenticação apropriada
 * 
 * IMPORTANTE: Segundo a documentação oficial da PlayFivers,
 * a autenticação é feita via agentToken e secretKey no BODY das requisições,
 * NÃO via headers Authorization.
 */
async function createClient(): Promise<AxiosInstance> {
  const creds = await getCredentials();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };

  // Validar credenciais
  if (!creds.agentToken && (!creds.agentId || !creds.agentSecret)) {
    throw new Error("Credenciais PlayFivers não configuradas. Configure agentToken/secretKey ou agentId/agentSecret.");
  }

  // Segundo a documentação, a autenticação padrão é via body (agentToken + secretKey)
  // Mas mantemos suporte a outros métodos para flexibilidade
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
    case "body":
    default:
      // Autenticação no body (padrão da PlayFivers)
      // agentToken e secretKey serão incluídos no body de cada requisição
      if (!creds.agentToken || !creds.agentSecret) {
        throw new Error("Para autenticação 'agent' (padrão PlayFivers), agentToken e secretKey são obrigatórios.");
      }
      break;
    case "basic":
      // Basic Auth com agentId:agentSecret
      if (creds.agentId && creds.agentSecret) {
        const basicAuth = Buffer.from(`${creds.agentId}:${creds.agentSecret}`).toString("base64");
        headers["Authorization"] = `Basic ${basicAuth}`;
      }
      break;
  }

  const client = axios.create({
    baseURL: PLAYFIVERS_BASE_URL,
    headers,
    timeout: 30000 // 30 segundos
  });

  // Interceptor para log de requisições (debug)
  client.interceptors.request.use((config) => {
    const fullUrl = `${config.baseURL || ""}${config.url || ""}`;
    // eslint-disable-next-line no-console
    console.log(`[PlayFivers] ${config.method?.toUpperCase()} ${fullUrl}`, {
      baseURL: config.baseURL,
      url: config.url,
      hasAuth: !!config.headers.Authorization || !!config.headers["X-API-Key"],
      authMethod: creds.authMethod
    });
    return config;
  });

  // Interceptor para log de respostas (debug)
  client.interceptors.response.use(
    (response) => {
      const fullUrl = `${response.config.baseURL || ""}${response.config.url || ""}`;
      // eslint-disable-next-line no-console
      console.log(`[PlayFivers] ✅ ${response.config.method?.toUpperCase()} ${fullUrl} - ${response.status}`);
      return response;
    },
    (error) => {
      const fullUrl = error.config ? `${error.config.baseURL || ""}${error.config.url || ""}` : "unknown";
      // eslint-disable-next-line no-console
      console.error(`[PlayFivers] ❌ ${error.config?.method?.toUpperCase()} ${fullUrl} - ${error.response?.status || "NO_RESPONSE"}`, {
        message: error.message,
        responseData: error.response?.data,
        status: error.response?.status,
        baseURL: error.config?.baseURL,
        url: error.config?.url
      });
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Adicionar credenciais de autenticação ao body da requisição
 * (Conforme documentação oficial da PlayFivers)
 */
async function addAuthToBody(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const creds = await getCredentials();
  
  // IMPORTANTE: A API PlayFivers pode exigir dados no body mesmo quando usa Bearer/API Key no header
  // Sempre tentar adicionar credenciais ao body se disponíveis
  
  // Se usar autenticação no body (padrão PlayFivers) OU se tiver credenciais disponíveis
  const shouldAddToBody = 
    creds.authMethod.toLowerCase() === "agent" || 
      creds.authMethod.toLowerCase() === "body" || 
      !creds.authMethod || 
    creds.authMethod.toLowerCase() === "default" ||
    // Mesmo para Bearer/API Key, tentar adicionar ao body se tiver secretKey
    (creds.agentToken && creds.agentSecret);
    
  if (shouldAddToBody) {
    // Segundo a documentação: agentToken e secretKey (ou agent_code e agent_secret)
    if (creds.agentToken && creds.agentSecret) {
      const authBody = {
        ...body,
        agentToken: creds.agentToken,
        secretKey: creds.agentSecret
      };
      // eslint-disable-next-line no-console
      console.log("[PlayFivers] Adicionando autenticação ao body (agentToken + secretKey):", {
        hasAgentToken: !!creds.agentToken,
        hasSecretKey: !!creds.agentSecret,
        authMethod: creds.authMethod,
        bodyKeys: Object.keys(authBody)
      });
      return authBody;
    } else if (creds.agentId && creds.agentSecret) {
      const authBody = {
        ...body,
        agent_code: creds.agentId,
        agent_secret: creds.agentSecret
      };
      // eslint-disable-next-line no-console
      console.log("[PlayFivers] Adicionando autenticação ao body (agent_code + agent_secret):", {
        hasAgentId: !!creds.agentId,
        hasSecretKey: !!creds.agentSecret,
        authMethod: creds.authMethod,
        bodyKeys: Object.keys(authBody)
      });
      return authBody;
    } else {
      // eslint-disable-next-line no-console
      console.warn("[PlayFivers] ⚠️ Credenciais incompletas para autenticação no body:", {
        hasAgentToken: !!creds.agentToken,
        hasAgentId: !!creds.agentId,
        hasSecretKey: !!creds.agentSecret,
        authMethod: creds.authMethod
      });
    }
  }
  
  return body;
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
   * NOTA: Segundo a documentação, não há endpoint específico para "registrar" jogo.
   * Os jogos são listados via GET /api/v2/games e iniciados via POST /api/v2/game_launch
   * Esta função pode não ser necessária, mas mantemos para compatibilidade
   */
  async registerGame(
    payload: RegisterGamePayload
  ): Promise<PlayFiversResponse> {
    try {
      const client = await createClient();

      // Preparar dados com autenticação
      const requestData = await addAuthToBody({
        provider_code: payload.providerExternalId,
        game_code: payload.gameExternalId,
        name: payload.name
      });

      // Tentar endpoint de game_launch (mais próximo do que seria "registrar")
      try {
        const { data } = await client.post("/api/v2/game_launch", requestData);
        
        // eslint-disable-next-line no-console
        console.log(`✅ Jogo processado: ${payload.name}`);
        
        return {
          success: true,
          data,
          message: "Jogo processado com sucesso"
        };
      } catch (error: any) {
        // Se game_launch falhar, retornar erro específico
        if (error.response?.status === 401 || error.response?.status === 403) {
          return {
            success: false,
            error: "Credenciais inválidas ou sem permissão",
            message: `Erro de autenticação (status: ${error.response.status})`
          };
        }
        
        if (error.response?.status === 422) {
          return {
            success: false,
            error: "Game_code incorreto ou corpo inválido",
            message: "Verifique se o game_code e provider_code estão corretos"
          };
        }
        
        throw error;
      }

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
   * NOTA: Segundo a documentação, não há endpoint específico para "registrar" provedor.
   * Os provedores são listados via GET /api/v2/providers
   * Esta função pode não ser necessária, mas mantemos para compatibilidade
   */
  async registerProvider(
    providerExternalId: string,
    providerName: string
  ): Promise<PlayFiversResponse> {
    try {
      const client = await createClient();

      // Preparar dados com autenticação
      const requestData = await addAuthToBody({
        provider_code: providerExternalId,
        name: providerName
      });

      // Como não há endpoint de registro, apenas retornar sucesso
      // O provedor já existe na lista retornada por GET /api/v2/providers
      // eslint-disable-next-line no-console
      console.log(`ℹ️ Provedor "${providerName}" será importado do banco local. Use GET /api/v2/providers para listar.`);
      
      return {
        success: true,
        data: { provider_code: providerExternalId, name: providerName },
        message: "Provedor pode ser importado. Use a listagem de provedores para verificar disponibilidade."
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
   * Usa GET /api/v2/agent conforme documentação oficial
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

      // Segundo a documentação: GET /api/v2/agent para testar conexão
      // A API só aceita GET, HEAD, PUT (não aceita POST)
      // Requer agentToken e secretKey no body (mesmo para GET)
      try {
        const authBody = await addAuthToBody({});
        const endpoint = "/api/v2/agent";
        
        // A API PlayFivers só aceita GET para este endpoint
        // eslint-disable-next-line no-console
        console.log(`[PlayFivers] Tentando conectar em: ${PLAYFIVERS_BASE_URL}${endpoint}`, {
          method: "GET",
          body: authBody,
          hasBody: Object.keys(authBody).length > 0
        });
        
        // Usar GET com body (alguns servidores aceitam body em GET)
        const response = await client.request({
          method: "GET",
          url: endpoint,
          data: authBody, // Enviar body mesmo em GET
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        const { data, status } = response;
        
        return {
          success: true,
          data,
          message: `Conexão OK! Informações do agente obtidas (status: ${status})`
        };
      } catch (error: any) {
        // Se for 401, credenciais podem estar erradas
        if (error.response?.status === 401) {
          return {
            success: false,
            error: "Credenciais inválidas",
            message: `Erro de autenticação (401). Verifique se agentToken e secretKey estão corretos.`
          };
        }
        
        // Se for 403, pode ser IP não autorizado ou credenciais sem permissão
        if (error.response?.status === 403) {
          const errorMsg = error.response?.data?.msg || error.response?.data?.message || "";
          if (errorMsg.includes("IP") || errorMsg.includes("ip") || errorMsg.includes("permitido")) {
            return {
              success: false,
              error: "IP não autorizado",
              message: `A API PlayFivers rejeitou a requisição: ${errorMsg}. Você precisa adicionar o IP do servidor na whitelist da PlayFivers. Acesse /api/ip-info para descobrir qual IP adicionar. Entre em contato com o suporte da PlayFivers para autorizar o IP do seu servidor.`
            };
          }
          return {
            success: false,
            error: "Acesso negado",
            message: `Erro de autorização (403): ${errorMsg || "Verifique se as credenciais têm permissão para acessar este recurso."}`
          };
        }
        
        // Se for 404, a rota não foi encontrada
        if (error.response?.status === 404) {
          const requestUrl = error.config?.url || "/api/v2/agent";
          const baseUrl = error.config?.baseURL || PLAYFIVERS_BASE_URL;
          return {
            success: false,
            error: `Rota não encontrada: ${baseUrl}${requestUrl}`,
            message: `A rota ${requestUrl} não foi encontrada na API PlayFivers. Verifique se a URL base está correta.`
          };
        }
        
        // Se for 422, dados inválidos ou formato incorreto
        if (error.response?.status === 422) {
          const errorData = error.response?.data || {};
          const errorMsg = errorData.message || errorData.error || "Dados inválidos";
          return {
            success: false,
            error: `Erro de validação (422): ${errorMsg}`,
            message: `A API PlayFivers rejeitou a requisição. Verifique se as credenciais estão corretas e no formato esperado. Detalhes: ${JSON.stringify(errorData)}`
          };
        }
        
        throw error;
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao testar conexão com PlayFivers:", error);

      // Extrair mensagem de erro mais detalhada
      let errorMessage = "Erro desconhecido";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        // Limpar mensagens de erro do axios que podem conter URLs duplicadas
        errorMessage = error.message.replace(/api\/api\//g, "api/");
      }
      
      // Se a mensagem contém "could not be found" ou "not found", melhorar
      if (errorMessage.includes("could not be found") || errorMessage.includes("not found")) {
        const requestUrl = error.config?.url || "/api/v2/agent";
        const baseUrl = error.config?.baseURL || PLAYFIVERS_BASE_URL;
        errorMessage = `A rota ${requestUrl} não foi encontrada. URL completa: ${baseUrl}${requestUrl}`;
      }

      return {
        success: false,
        error: errorMessage,
        message: "Erro ao testar conexão com a API PlayFivers"
      };
    }
  },

  /**
   * Buscar lista de provedores disponíveis na PlayFivers
   * Endpoint oficial: GET /api/v2/providers
   * Requer agentToken e secretKey no body
   */
  async getAvailableProviders(): Promise<PlayFiversResponse<PlayFiversProvider[]>> {
    try {
      const client = await createClient();

      // Segundo a documentação: GET /api/v2/providers
      // Autenticação via body (agentToken + secretKey)
      const authBody = await addAuthToBody({});
      
      try {
        // Tentar POST primeiro (conforme documentação pode requerer body)
        const { data } = await client.post("/api/v2/providers", authBody);
        
        // Normalizar resposta
        let providers: PlayFiversProvider[] = [];
        if (data.data && Array.isArray(data.data)) {
          providers = data.data;
        } else if (Array.isArray(data)) {
          providers = data;
        }

        if (providers.length > 0) {
          // eslint-disable-next-line no-console
          console.log(`✅ Provedores encontrados: ${providers.length}`);
          return {
            success: true,
            data: providers,
            message: `${providers.length} provedores encontrados`
          };
        }
      } catch (postError: any) {
        // Se POST falhar, tentar GET
        if (postError.response?.status === 405 || postError.response?.status === 404) {
          const { data } = await client.get("/api/v2/providers", {
            data: authBody // Algumas APIs aceitam body em GET
          });
          
          let providers: PlayFiversProvider[] = [];
          if (data.data && Array.isArray(data.data)) {
            providers = data.data;
          } else if (Array.isArray(data)) {
            providers = data;
          }

          if (providers.length > 0) {
            // eslint-disable-next-line no-console
            console.log(`✅ Provedores encontrados via GET: ${providers.length}`);
            return {
              success: true,
              data: providers,
              message: `${providers.length} provedores encontrados`
            };
          }
        } else {
          throw postError;
        }
      }

      // Se chegou aqui, nenhum método funcionou
      return {
        success: false,
        error: "Não foi possível buscar provedores. Verifique as credenciais.",
        message: "Erro ao buscar provedores"
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao buscar provedores:", error);

      // Tratamento específico para 422
      if (error.response?.status === 422) {
        const errorData = error.response?.data || {};
        const errorMsg = errorData.message || errorData.error || "Dados inválidos";
        return {
          success: false,
          error: `Erro de validação (422): ${errorMsg}`,
          message: `A API PlayFivers rejeitou a requisição. Verifique se as credenciais estão corretas e no formato esperado. Detalhes: ${JSON.stringify(errorData)}`
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message,
        message: "Erro ao buscar provedores"
      };
    }
  },

  /**
   * Configurar RTP do agente na PlayFivers
   * Segundo a documentação: PUT /api/v2/agent
   * Body: { agentToken, secretKey, rtp }
   */
  async setAgentRtp(rtp: number): Promise<PlayFiversResponse> {
    try {
      const client = await createClient();
      const creds = await getCredentials();

      // Validar RTP (geralmente entre 0 e 100)
      if (rtp < 0 || rtp > 100) {
        return {
          success: false,
          error: "RTP inválido",
          message: "O RTP deve estar entre 0 e 100"
        };
      }

      // Segundo a documentação: PUT /api/v2/agent para atualizar informações do agente
      // Inclui rtp no body junto com agentToken e secretKey
      const requestData = await addAuthToBody({
        rtp: Number(rtp),
        agent_rtp: Number(rtp) // Tentar ambos os nomes
      });

      try {
        // Tentar PUT /api/v2/agent (endpoint oficial)
        const { data } = await client.put("/api/v2/agent", requestData);

        // eslint-disable-next-line no-console
        console.log(`✅ RTP do agente configurado: ${rtp}%`);

        return {
          success: true,
          data,
          message: `RTP do agente configurado com sucesso: ${rtp}%`
        };
      } catch (putError: any) {
        // Se PUT falhar, tentar POST
        if (putError.response?.status === 405 || putError.response?.status === 404) {
          const { data } = await client.post("/api/v2/agent", requestData);
          
          // eslint-disable-next-line no-console
          console.log(`✅ RTP do agente configurado via POST: ${rtp}%`);
          
          return {
            success: true,
            data,
            message: `RTP do agente configurado com sucesso: ${rtp}%`
          };
        }
        
        // Se for 401/403, credenciais podem estar erradas
        if (putError.response?.status === 401 || putError.response?.status === 403) {
          return {
            success: false,
            error: "Credenciais inválidas ou sem permissão",
            message: `Erro de autenticação ao configurar RTP (status: ${putError.response.status})`
          };
        }
        
        throw putError;
      }

    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao configurar RTP do agente:", error);

      // Tratamento específico para 422
      if (error.response?.status === 422) {
        const errorData = error.response?.data || {};
        const errorMsg = errorData.message || errorData.error || "Dados inválidos";
        return {
          success: false,
          error: `Erro de validação (422): ${errorMsg}`,
          message: `A API PlayFivers rejeitou a requisição. Verifique se as credenciais e o valor de RTP estão corretos. Detalhes: ${JSON.stringify(errorData)}`
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message,
        message: "Erro ao configurar RTP do agente"
      };
    }
  },

  /**
   * Configurar callback URL na PlayFivers
   * Segundo a documentação: PUT /api/v2/agent
   * Body: { agentToken, secretKey, callback_url }
   */
  async setCallbackUrl(callbackUrl: string): Promise<PlayFiversResponse> {
    try {
      const client = await createClient();
      const creds = await getCredentials();

      // Segundo a documentação: PUT /api/v2/agent para atualizar informações do agente
      // Inclui callback_url no body junto com agentToken e secretKey
      const requestData = await addAuthToBody({
        callback_url: callbackUrl,
        webhook_url: callbackUrl // Tentar ambos os nomes
      });

      try {
        // Tentar PUT /api/v2/agent (endpoint oficial)
        const { data } = await client.put("/api/v2/agent", requestData);

        // eslint-disable-next-line no-console
        console.log(`✅ Callback URL configurada: ${callbackUrl}`);

        return {
          success: true,
          data,
          message: "Callback URL configurada com sucesso"
        };
      } catch (putError: any) {
        // Se PUT falhar, tentar POST
        if (putError.response?.status === 405 || putError.response?.status === 404) {
          const { data } = await client.post("/api/v2/agent", requestData);
          
          // eslint-disable-next-line no-console
          console.log(`✅ Callback URL configurada via POST: ${callbackUrl}`);
          
          return {
            success: true,
            data,
            message: "Callback URL configurada com sucesso"
          };
        }
        
        // Se for 401/403, credenciais podem estar erradas
        if (putError.response?.status === 401 || putError.response?.status === 403) {
          return {
            success: false,
            error: "Credenciais inválidas ou sem permissão",
            message: `Erro de autenticação ao configurar callback (status: ${putError.response.status})`
          };
        }
        
        throw putError;
      }

    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao configurar callback URL:", error);

      // Tratamento específico para 422
      if (error.response?.status === 422) {
        const errorData = error.response?.data || {};
        const errorMsg = errorData.message || errorData.error || "Dados inválidos";
        return {
          success: false,
          error: `Erro de validação (422): ${errorMsg}`,
          message: `A API PlayFivers rejeitou a requisição. Verifique se as credenciais e a URL de callback estão corretas. Detalhes: ${JSON.stringify(errorData)}`
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message,
        message: "Erro ao configurar callback URL"
      };
    }
  },

  /**
   * Buscar lista de jogos disponíveis na PlayFivers
   * Endpoint oficial: GET /api/v2/games
   * Parâmetros opcionais:
   *   - provider_code (query string) - Filtrar por provedor
   *   - limit (query string) - Limitar quantidade (experimental, não documentado)
   *   - page (query string) - Número da página (experimental, não documentado)
   * Requer agentToken e secretKey no body
   */
  async getAvailableGames(
    providerId?: string,
    limit?: number,
    page?: number
  ): Promise<PlayFiversResponse<PlayFiversGame[]>> {
    try {
      const client = await createClient();
      const creds = await getCredentials();

      // Segundo a documentação: GET /api/v2/games?provider_code=XXX
      // Autenticação via body (agentToken + secretKey)
      const authBody = await addAuthToBody({});
      
      // Construir query params
      const params: Record<string, string> = {};
      if (providerId) {
        params.provider_code = providerId; // Segundo a documentação, é provider_code
      }
      // Tentar adicionar parâmetros de paginação (experimental - não documentado)
      if (limit && limit > 0) {
        params.limit = String(limit);
      }
      if (page && page > 0) {
        params.page = String(page);
      }

      try {
        // A API PlayFivers só aceita GET para /api/v2/games (não aceita POST)
        // Usar GET diretamente com body
        const { data } = await client.request({
          method: "GET",
          url: "/api/v2/games",
          params,
          data: authBody, // Enviar body mesmo em GET
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        // Normalizar resposta
        let games: PlayFiversGame[] = [];
        if (data.data && Array.isArray(data.data)) {
          games = data.data;
        } else if (Array.isArray(data)) {
          games = data;
        }

        if (games.length > 0 || data) {
          // eslint-disable-next-line no-console
          console.log(`✅ Jogos encontrados via GET: ${games.length}`);
          return {
            success: true,
            data: games,
            message: `${games.length} jogos encontrados`
          };
        }
      } catch (error: any) {
        // Se for 401/403, credenciais podem estar erradas
        if (error.response?.status === 401 || error.response?.status === 403) {
          const errorMsg = error.response?.data?.msg || error.response?.data?.message || "";
          if (errorMsg.includes("IP") || errorMsg.includes("ip") || errorMsg.includes("permitido")) {
            return {
              success: false,
              error: "IP não autorizado",
              message: `A API PlayFivers rejeitou a requisição: ${errorMsg}. Você precisa adicionar o IP do servidor na whitelist da PlayFivers.`
            };
          }
          return {
            success: false,
            error: "Credenciais inválidas ou sem permissão",
            message: `Erro de autenticação (${error.response.status}). Verifique agentToken e secretKey.`
          };
        }
        
        // Tratamento específico para 422
        if (error.response?.status === 422) {
          const errorData = error.response?.data || {};
          const errorMsg = errorData.message || errorData.error || "Dados inválidos";
          return {
            success: false,
            error: `Erro de validação (422): ${errorMsg}`,
            message: `A API PlayFivers rejeitou a requisição. Verifique se as credenciais estão corretas. Detalhes: ${JSON.stringify(errorData)}`
          };
        }
        
        throw error;
      }

      // Se chegou aqui, nenhum método funcionou
      return {
        success: false,
        error: "Não foi possível buscar jogos. Verifique as credenciais.",
        message: "Erro ao buscar jogos"
      };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("❌ Erro ao buscar jogos:", error);

      // Tratamento específico para 422
      if (error.response?.status === 422) {
        const errorData = error.response?.data || {};
        const errorMsg = errorData.message || errorData.error || "Dados inválidos";
        return {
          success: false,
          error: `Erro de validação (422): ${errorMsg}`,
          message: `A API PlayFivers rejeitou a requisição. Verifique se as credenciais estão corretas e no formato esperado. Detalhes: ${JSON.stringify(errorData)}`
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || error.message,
        message: "Erro ao buscar jogos"
      };
    }
  },

  /**
   * Lançar jogo (obter URL do jogo para o usuário jogar)
   * POST /api/v2/game_launch
   * Conforme documentação oficial: https://api.playfivers.com/docs
   * 
   * Campos obrigatórios:
   * - agentToken, secretKey (via addAuthToBody)
   * - user_code: Código do usuário no sistema
   * - game_code: Código do jogo
   * - provider: Nome do provedor (não código)
   * - game_original: boolean
   * - user_balance: float (saldo do jogador)
   * - lang: string (pt, es, en, etc.) - opcional, padrão "pt"
   * - user_rtp: integer - opcional
   */
  async launchGame(
    providerName: string, // Nome do provedor (não código)
    gameCode: string,
    userCode: string,
    userBalance: number = 0,
    gameOriginal: boolean = true,
    lang: string = "pt",
    userRtp?: number
  ): Promise<PlayFiversResponse<{ url: string }>> {
    try {
      const client = await createClient();

      // Preparar dados conforme documentação oficial
      const requestData = await addAuthToBody({
        user_code: String(userCode),
        game_code: String(gameCode),
        provider: String(providerName), // Nome do provedor, não código
        game_original: Boolean(gameOriginal),
        user_balance: Number(userBalance),
        lang: String(lang),
        ...(userRtp !== undefined && { user_rtp: Number(userRtp) })
      });

      console.log("🚀 Lançando jogo:", {
        user_code: userCode,
        game_code: gameCode,
        provider: providerName,
        user_balance: userBalance
      });

      const { data } = await client.post("/api/v2/game_launch", requestData);
      
      console.log(`✅ Jogo lançado: ${gameCode} do provedor ${providerName}`);
      console.log("📋 Resposta da PlayFivers:", data);
      
      // Conforme documentação, a resposta contém "launch_url"
      const gameUrl = data?.launch_url || data?.url || data?.game_url || data?.data?.launch_url;
      
      if (!gameUrl) {
        console.warn("⚠️ Resposta da PlayFivers não contém launch_url:", data);
        return {
          success: false,
          error: "URL do jogo não encontrada na resposta",
          message: "A API não retornou a launch_url do jogo",
          data: data
        };
      }

      return {
        success: true,
        data: { url: gameUrl },
        message: "Jogo lançado com sucesso"
      };
    } catch (error: any) {
      console.error("❌ Erro ao lançar jogo na PlayFivers:", error.message);
      console.error("❌ Detalhes do erro:", error.response?.data);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        return {
          success: false,
          error: "Credenciais inválidas ou sem permissão",
          message: `Erro de autenticação (status: ${error.response.status})`
        };
      }
      
      if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.msg || error.response?.data?.message || "Game_code incorreto ou corpo inválido";
        return {
          success: false,
          error: errorMsg,
          message: "Verifique se o game_code, provider e demais campos estão corretos"
        };
      }

      return {
        success: false,
        error: error.response?.data?.msg || error.response?.data?.message || error.message,
        message: "Erro ao lançar jogo"
      };
    }
  }
};
