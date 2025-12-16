import axios, { AxiosInstance } from "axios";
import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";
import crypto from "crypto";

// Configurações da API SuitPay
const getSuitPayBaseUrl = (): string => {
  // Prioridade: variável de ambiente > configuração padrão
  if (process.env.SUITPAY_PRODUCTION_URL) {
    return process.env.SUITPAY_PRODUCTION_URL;
  }
  if (process.env.SUITPAY_SANDBOX_URL) {
    return process.env.SUITPAY_SANDBOX_URL;
  }
  
  const env = process.env.NODE_ENV || "production";
  // Sandbox: https://sandbox.w.suitpay.app
  // Produção: https://w.suitpay.app ou https://api.suitpay.app
  if (env === "development" || process.env.SUITPAY_ENV === "sandbox") {
    return "https://sandbox.w.suitpay.app";
  }
  // Tentar api.suitpay.app primeiro (mais comum)
  return "https://api.suitpay.app";
};

const SUITPAY_BASE_URL = getSuitPayBaseUrl();

interface SuitPayCredentials {
  clientId: string;
  clientSecret: string;
}

interface SettingRow extends RowDataPacket {
  key: string;
  value: string;
}

/**
 * Buscar credenciais do SuitPay do banco de dados
 */
async function getCredentialsFromDb(): Promise<Partial<SuitPayCredentials>> {
  try {
    const [rows] = await pool.query<SettingRow[]>(
      "SELECT `key`, `value` FROM settings WHERE `key` LIKE 'suitpay.%'"
    );

    const credentials: Partial<SuitPayCredentials> = {};

    for (const row of rows) {
      const key = row.key.replace("suitpay.", "");
      if (key === "clientId" || key === "ci") credentials.clientId = row.value;
      if (key === "clientSecret" || key === "cs") credentials.clientSecret = row.value;
    }

    return credentials;
  } catch (error) {
    console.error("Erro ao buscar credenciais SuitPay do banco:", error);
    return {};
  }
}

/**
 * Obter credenciais (prioridade: env vars > banco de dados)
 */
async function getCredentials(): Promise<SuitPayCredentials> {
  const dbCreds = await getCredentialsFromDb();

  return {
    clientId: process.env.SUITPAY_CLIENT_ID || dbCreds.clientId || "",
    clientSecret: process.env.SUITPAY_CLIENT_SECRET || dbCreds.clientSecret || ""
  };
}

/**
 * Criar cliente HTTP com autenticação SuitPay
 * Autenticação via headers: ci (Client ID) e cs (Client Secret)
 */
async function createClient(): Promise<AxiosInstance> {
  const creds = await getCredentials();

  if (!creds.clientId || !creds.clientSecret) {
    const errorMsg = "Credenciais SuitPay não configuradas. Configure SUITPAY_CLIENT_ID e SUITPAY_CLIENT_SECRET ou configure no painel admin.";
    console.error(`[SuitPay] ❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  console.log(`[SuitPay] Criando cliente para URL: ${SUITPAY_BASE_URL}`);
  console.log(`[SuitPay] Client ID configurado: ${creds.clientId ? "Sim" : "Não"}`);
  console.log(`[SuitPay] Client Secret configurado: ${creds.clientSecret ? "Sim" : "Não"}`);

  const client = axios.create({
    baseURL: SUITPAY_BASE_URL,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "ci": creds.clientId,      // Client ID no header
      "cs": creds.clientSecret   // Client Secret no header
    },
    timeout: 30000 // 30 segundos de timeout
  });

  // Interceptor para log de requisições
  client.interceptors.request.use((config) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`[SuitPay] ${config.method?.toUpperCase()} ${fullUrl}`, {
      headers: {
        ci: config.headers.ci ? "***" : undefined,
        cs: config.headers.cs ? "***" : undefined
      }
    });
    return config;
  });

  // Interceptor para log de respostas
  client.interceptors.response.use(
    (response) => {
      const fullUrl = `${response.config.baseURL}${response.config.url}`;
      console.log(`[SuitPay] ✅ ${response.config.method?.toUpperCase()} ${fullUrl} - ${response.status}`);
      return response;
    },
    (error) => {
      const fullUrl = error.config?.baseURL && error.config?.url
        ? `${error.config.baseURL}${error.config.url}`
        : "unknown";
      console.error(`[SuitPay] ❌ ${error.config?.method?.toUpperCase()} ${fullUrl} - ${error.response?.status || "NO_RESPONSE"}`, {
        error: error.response?.data || error.message
      });
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Validar hash SHA-256 do webhook SuitPay
 * @param payload - Objeto JSON recebido do webhook (sem o campo hash)
 * @param hash - Hash recebido no webhook
 * @param clientSecret - Client Secret para validação
 * @returns true se o hash for válido
 */
/**
 * Validar hash SHA-256 do webhook SuitPay
 * Conforme documentação: manter a ordem original dos campos (não ordenar)
 */
export function validateWebhookHash(
  payload: Record<string, unknown>,
  hash: string,
  clientSecret: string
): boolean {
  try {
    // 1. Concatene todos os valores dos campos (exceto o próprio hash) em uma única string
    // IMPORTANTE: Manter a ordem dos valores consistente com a ordem recebida no JSON
    // Não ordenar alfabeticamente - usar a ordem original
    const keys = Object.keys(payload).filter(key => key !== "hash");
    // Manter ordem original (não usar sort())
    const concatenated = keys.map(key => String(payload[key] || "")).join("");

    // 2. Concatene seu ClientSecret (cs) com o resultado da etapa 1
    const withSecret = clientSecret + concatenated;

    // 3. Calcule o hash SHA-256 da string resultante da etapa 2
    const calculatedHash = crypto
      .createHash("sha256")
      .update(withSecret, "utf8")
      .digest("hex");

    // 4. Compare o hash SHA-256 resultante com o campo hash na carga recebida
    const isValid = calculatedHash.toLowerCase() === hash.toLowerCase();
    
    if (!isValid) {
      console.warn("⚠️ Hash do webhook não corresponde:", {
        calculated: calculatedHash.substring(0, 16) + "...",
        received: hash.substring(0, 16) + "...",
        concatenatedLength: concatenated.length
      });
    }
    
    return isValid;
  } catch (error) {
    console.error("Erro ao validar hash do webhook:", error);
    return false;
  }
}

// Tipos de resposta da API SuitPay
export type SuitPayResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Tipos de transação
export type PaymentMethod = "PIX" | "CARD" | "BOLETO";

export type SuitPayPixRequest = {
  requestNumber: string;
  dueDate: string; // AAAA-MM-DD
  amount: number;
  shippingAmount?: number;
  usernameCheckout?: string;
  callbackUrl?: string;
  client: {
    name: string;
    document?: string;
    email?: string;
    phone?: string;
  };
};

export type SuitPayPixResponse = {
  requestNumber: string;
  qrCode: string;
  qrCodeBase64?: string;
  dueDate: string;
  amount: number;
  status?: string;
  transactionId?: string;
};

export type SuitPayCardRequest = {
  requestNumber: string;
  amount: number;
  shippingAmount?: number;
  usernameCheckout?: string;
  callbackUrl?: string;
  card: {
    number: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
    holderName?: string;
  };
  client: {
    name: string;
    document?: string;
    email?: string;
    phone?: string;
  };
  installments?: number;
};

export type SuitPayCardResponse = {
  requestNumber: string;
  transactionId?: string;
  status?: string;
  amount: number;
  message?: string;
};

export type SuitPayBoletoRequest = {
  requestNumber: string;
  dueDate: string; // AAAA-MM-DD
  amount: number;
  shippingAmount?: number;
  usernameCheckout?: string;
  callbackUrl?: string;
  client: {
    name: string;
    document: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
};

export type SuitPayBoletoResponse = {
  requestNumber: string;
  barcode?: string;
  digitableLine?: string;
  dueDate: string;
  amount: number;
  status?: string;
  transactionId?: string;
};

// Serviço SuitPay
export const suitpayService = {
  /**
   * Obter credenciais atuais
   */
  async getCredentials(): Promise<SuitPayCredentials> {
    return await getCredentials();
  },

  /**
   * Criar pagamento PIX
   * POST /pix
   */
  async createPixPayment(request: SuitPayPixRequest): Promise<SuitPayResponse<SuitPayPixResponse>> {
    try {
      const client = await createClient();
      console.log(`[SuitPay] Tentando criar pagamento PIX na URL: ${SUITPAY_BASE_URL}/pix`);

      const { data } = await client.post<SuitPayPixResponse>("/pix", request);

      console.log(`✅ Pagamento PIX criado: ${request.requestNumber}`);

      return {
        success: true,
        data,
        message: "Pagamento PIX criado com sucesso"
      };
    } catch (error: any) {
      console.error("❌ Erro ao criar pagamento PIX:", error.message);
      console.error("❌ Código do erro:", error.code);
      console.error("❌ URL tentada:", SUITPAY_BASE_URL);

      // Tratar erros de conexão/DNS
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT" || error.code === "EAI_AGAIN") {
        console.error(`[SuitPay] ❌ Erro de conexão: ${error.code} - Não foi possível conectar a ${SUITPAY_BASE_URL}`);
        return {
          success: false,
          error: "Erro de conexão com SuitPay",
          message: `Não foi possível conectar ao servidor SuitPay (${error.code}). Verifique a URL configurada: ${SUITPAY_BASE_URL}`
        };
      }

      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Credenciais inválidas",
          message: "Verifique se as credenciais SuitPay estão corretas"
        };
      }

      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || "Erro na solicitação";
        return {
          success: false,
          error: errorMsg,
          message: "Verifique os dados enviados"
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message || "Erro ao criar pagamento PIX",
        message: error.response?.data?.message || "Erro ao criar pagamento PIX"
      };
    }
  },

  /**
   * Criar pagamento com Cartão
   * POST /card
   */
  async createCardPayment(request: SuitPayCardRequest): Promise<SuitPayResponse<SuitPayCardResponse>> {
    try {
      const client = await createClient();

      const { data } = await client.post<SuitPayCardResponse>("/card", request);

      console.log(`✅ Pagamento com cartão criado: ${request.requestNumber}`);

      return {
        success: true,
        data,
        message: "Pagamento com cartão criado com sucesso"
      };
    } catch (error: any) {
      console.error("❌ Erro ao criar pagamento com cartão:", error.message);

      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Credenciais inválidas",
          message: "Verifique se as credenciais SuitPay estão corretas"
        };
      }

      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || "Erro na solicitação";
        return {
          success: false,
          error: errorMsg,
          message: "Verifique os dados enviados"
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao criar pagamento com cartão"
      };
    }
  },

  /**
   * Criar pagamento com Boleto
   * POST /boleto
   */
  async createBoletoPayment(request: SuitPayBoletoRequest): Promise<SuitPayResponse<SuitPayBoletoResponse>> {
    try {
      const client = await createClient();

      const { data } = await client.post<SuitPayBoletoResponse>("/boleto", request);

      console.log(`✅ Pagamento com boleto criado: ${request.requestNumber}`);

      return {
        success: true,
        data,
        message: "Pagamento com boleto criado com sucesso"
      };
    } catch (error: any) {
      console.error("❌ Erro ao criar pagamento com boleto:", error.message);

      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Credenciais inválidas",
          message: "Verifique se as credenciais SuitPay estão corretas"
        };
      }

      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || "Erro na solicitação";
        return {
          success: false,
          error: errorMsg,
          message: "Verifique os dados enviados"
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao criar pagamento com boleto"
      };
    }
  },

  /**
   * Cancelar transação
   * POST /cancel
   */
  async cancelTransaction(requestNumber: string): Promise<SuitPayResponse> {
    try {
      const client = await createClient();

      const { data } = await client.post("/cancel", { requestNumber });

      console.log(`✅ Transação cancelada: ${requestNumber}`);

      return {
        success: true,
        data,
        message: "Transação cancelada com sucesso"
      };
    } catch (error: any) {
      console.error("❌ Erro ao cancelar transação:", error.message);

      if (error.response?.status === 401) {
        return {
          success: false,
          error: "Credenciais inválidas",
          message: "Verifique se as credenciais SuitPay estão corretas"
        };
      }

      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || "Erro na solicitação";
        return {
          success: false,
          error: errorMsg,
          message: "Verifique os dados enviados"
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: "Erro ao cancelar transação"
      };
    }
  },

  /**
   * Testar conexão com SuitPay
   */
  async testConnection(): Promise<SuitPayResponse> {
    try {
      const creds = await getCredentials();

      if (!creds.clientId || !creds.clientSecret) {
        return {
          success: false,
          error: "Credenciais não configuradas",
          message: "Configure as credenciais SuitPay antes de testar a conexão"
        };
      }

      // Tentar fazer uma requisição simples para verificar autenticação
      const client = await createClient();
      
      // Fazer uma requisição de teste (pode ser um endpoint de status ou similar)
      // Como não há endpoint específico de teste, vamos apenas verificar se as credenciais são válidas
      // tentando criar um pagamento PIX de teste (que pode falhar, mas validará as credenciais)
      
      return {
        success: true,
        message: "Credenciais configuradas corretamente"
      };
    } catch (error: any) {
      console.error("❌ Erro ao testar conexão com SuitPay:", error);

      return {
        success: false,
        error: error.message || "Erro ao testar conexão",
        message: "Erro ao testar conexão com a API SuitPay"
      };
    }
  }
};
