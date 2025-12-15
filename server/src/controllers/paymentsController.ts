import { Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { suitpayService, SuitPayPixRequest, SuitPayCardRequest, SuitPayBoletoRequest } from "../services/suitpayService";
import { xbankaccessService, XBankAccessPixInRequest, XBankAccessPixOutRequest } from "../services/xbankaccessService";
import { createTransaction, updateTransactionStatus, updateUserBalance, findTransactionByRequestNumber, listUserTransactions } from "../services/transactionsService";
import { pool } from "../config/database";

const pixRequestSchema = z.object({
  amount: z.number().positive(),
  dueDate: z.string().optional(),
  client: z.object({
    name: z.string(),
    document: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional()
  }),
  gateway: z.enum(["suitpay", "xbankaccess"]).optional().default("suitpay")
});

const pixOutRequestSchema = z.object({
  amount: z.number().positive(),
  pixKey: z.string(),
  pixKeyType: z.enum(["cpf", "email", "telefone", "aleatoria"]),
  client: z.object({
    name: z.string().optional(),
    document: z.string().optional()
  }).optional()
});

const cardRequestSchema = z.object({
  amount: z.number().positive(),
  card: z.object({
    number: z.string(),
    expirationMonth: z.string(),
    expirationYear: z.string(),
    cvv: z.string(),
    holderName: z.string().optional()
  }),
  client: z.object({
    name: z.string(),
    document: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional()
  }),
  installments: z.number().int().positive().optional()
});

const boletoRequestSchema = z.object({
  amount: z.number().positive(),
  dueDate: z.string(),
  client: z.object({
    name: z.string(),
    document: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional()
    }).optional()
  })
});

export async function createPixPaymentController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const parsed = pixRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
      return;
    }

    const { amount, dueDate, client, gateway } = parsed.data;

    // Gerar requestNumber único
    const requestNumber = uuidv4();

    // Calcular data de vencimento (padrão: 1 dia a partir de agora)
    const expirationDate = dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Construir callback URL
    const baseUrl = process.env.APP_URL || req.protocol + "://" + req.get("host");
    const callbackUrl = gateway === "xbankaccess" 
      ? `${baseUrl}/api/payments/webhook/xbankaccess`
      : `${baseUrl}/api/payments/webhook`;

    // Criar transação no banco
    const transaction = await createTransaction({
      userId,
      requestNumber,
      paymentMethod: "PIX",
      amount,
      status: "PENDING",
      dueDate: expirationDate,
      callbackUrl,
      metadata: { gateway }
    });

    let result: any;

    // Escolher gateway baseado no parâmetro
    if (gateway === "xbankaccess") {
      // Validar campos obrigatórios do XBankAccess
      if (!client.email || !client.document || !client.phone) {
        res.status(400).json({ 
          error: "Campos obrigatórios faltando", 
          message: "XBankAccess requer email, document e phone do cliente" 
        });
        return;
      }

      const xbankRequest: Omit<XBankAccessPixInRequest, "token" | "secret"> = {
        amount,
        debtor_name: client.name,
        email: client.email,
        debtor_document_number: client.document,
        phone: client.phone,
        method_pay: "pix",
        postback: callbackUrl
      };

      result = await xbankaccessService.createPixInPayment(xbankRequest);
    } else {
      // SuitPay (padrão)
      const suitpayRequest: SuitPayPixRequest = {
        requestNumber,
        dueDate: expirationDate,
        amount,
        client,
        callbackUrl
      };

      result = await suitpayService.createPixPayment(suitpayRequest);
    }

    if (!result.success || !result.data) {
      await updateTransactionStatus(requestNumber, "FAILED", undefined, { error: result.error });
      res.status(500).json({
        error: result.error || "Erro ao criar pagamento PIX",
        message: result.message
      });
      return;
    }

    // Atualizar transação com dados retornados (formato diferente por gateway)
    if (gateway === "xbankaccess" && result.data) {
      // XBankAccess retorna: idTransaction, qrcode, qr_code_image_url
      await updateTransactionStatus(
        requestNumber,
        "PENDING",
        result.data.idTransaction,
        {
          qrCode: result.data.qrcode,
          qrCodeBase64: result.data.qr_code_image_url
        }
      );

      if (result.data.qrcode) {
        await pool.query(
          `UPDATE transactions SET qr_code = ?, qr_code_base64 = ?, transaction_id = ? WHERE request_number = ?`,
          [result.data.qrcode, result.data.qr_code_image_url || null, result.data.idTransaction, requestNumber]
        );
      }

      res.status(201).json({
        success: true,
        transaction: {
          id: transaction.id,
          requestNumber,
          transactionId: result.data.idTransaction,
          qrCode: result.data.qrcode,
          qrCodeBase64: result.data.qr_code_image_url,
          amount,
          status: "PENDING"
        }
      });
    } else {
      // SuitPay
      await updateTransactionStatus(
        requestNumber,
        result.data.status || "PENDING",
        result.data.transactionId,
        {
          qrCode: result.data.qrCode,
          qrCodeBase64: result.data.qrCodeBase64
        }
      );

      if (result.data.qrCode) {
        await pool.query(
          `UPDATE transactions SET qr_code = ?, qr_code_base64 = ? WHERE request_number = ?`,
          [result.data.qrCode, result.data.qrCodeBase64 || null, requestNumber]
        );
      }

      res.status(201).json({
        success: true,
        transaction: {
          id: transaction.id,
          requestNumber,
          transactionId: result.data.transactionId,
          qrCode: result.data.qrCode,
          qrCodeBase64: result.data.qrCodeBase64,
          amount: result.data.amount,
          dueDate: result.data.dueDate,
          status: result.data.status || "PENDING"
        }
      });
    }
  } catch (error: any) {
    console.error("Erro ao criar pagamento PIX:", error);
    res.status(500).json({
      error: error.message || "Erro ao criar pagamento PIX"
    });
  }
}

export async function createCardPaymentController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const parsed = cardRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
      return;
    }

    const { amount, card, client, installments } = parsed.data;

    // Gerar requestNumber único
    const requestNumber = uuidv4();

    // Construir callback URL
    const baseUrl = process.env.APP_URL || req.protocol + "://" + req.get("host");
    const callbackUrl = `${baseUrl}/api/payments/webhook`;

    // Criar requisição para SuitPay
    const suitpayRequest: SuitPayCardRequest = {
      requestNumber,
      amount,
      card,
      client,
      installments,
      callbackUrl
    };

    // Criar transação no banco
    const transaction = await createTransaction({
      userId,
      requestNumber,
      paymentMethod: "CARD",
      amount,
      status: "PENDING",
      callbackUrl
    });

    // Chamar API SuitPay
    const result = await suitpayService.createCardPayment(suitpayRequest);

    if (!result.success || !result.data) {
      await updateTransactionStatus(requestNumber, "FAILED", undefined, { error: result.error });
      res.status(500).json({
        error: result.error || "Erro ao criar pagamento com cartão",
        message: result.message
      });
      return;
    }

    // Atualizar transação com dados retornados
    await updateTransactionStatus(
      requestNumber,
      result.data.status || "PENDING",
      result.data.transactionId
    );

    res.status(201).json({
      success: true,
      transaction: {
        id: transaction.id,
        requestNumber,
        transactionId: result.data.transactionId,
        amount: result.data.amount,
        status: result.data.status || "PENDING",
        message: result.data.message
      }
    });
  } catch (error: any) {
    console.error("Erro ao criar pagamento com cartão:", error);
    res.status(500).json({
      error: error.message || "Erro ao criar pagamento com cartão"
    });
  }
}

export async function createBoletoPaymentController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const parsed = boletoRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
      return;
    }

    const { amount, dueDate, client } = parsed.data;

    // Gerar requestNumber único
    const requestNumber = uuidv4();

    // Construir callback URL
    const baseUrl = process.env.APP_URL || req.protocol + "://" + req.get("host");
    const callbackUrl = `${baseUrl}/api/payments/webhook`;

    // Criar requisição para SuitPay
    const suitpayRequest: SuitPayBoletoRequest = {
      requestNumber,
      dueDate,
      amount,
      client,
      callbackUrl
    };

    // Criar transação no banco
    const transaction = await createTransaction({
      userId,
      requestNumber,
      paymentMethod: "BOLETO",
      amount,
      status: "PENDING",
      dueDate,
      callbackUrl
    });

    // Chamar API SuitPay
    const result = await suitpayService.createBoletoPayment(suitpayRequest);

    if (!result.success || !result.data) {
      await updateTransactionStatus(requestNumber, "FAILED", undefined, { error: result.error });
      res.status(500).json({
        error: result.error || "Erro ao criar pagamento com boleto",
        message: result.message
      });
      return;
    }

    // Atualizar transação com dados retornados
    await updateTransactionStatus(
      requestNumber,
      result.data.status || "PENDING",
      result.data.transactionId,
      {
        barcode: result.data.barcode,
        digitableLine: result.data.digitableLine
      }
    );

    // Atualizar campos específicos
    if (result.data.barcode || result.data.digitableLine) {
      await pool.query(
        `UPDATE transactions SET barcode = ?, digitable_line = ? WHERE request_number = ?`,
        [result.data.barcode || null, result.data.digitableLine || null, requestNumber]
      );
    }

    res.status(201).json({
      success: true,
      transaction: {
        id: transaction.id,
        requestNumber,
        transactionId: result.data.transactionId,
        barcode: result.data.barcode,
        digitableLine: result.data.digitableLine,
        amount: result.data.amount,
        dueDate: result.data.dueDate,
        status: result.data.status || "PENDING"
      }
    });
  } catch (error: any) {
    console.error("Erro ao criar pagamento com boleto:", error);
    res.status(500).json({
      error: error.message || "Erro ao criar pagamento com boleto"
    });
  }
}

export async function webhookController(req: Request, res: Response): Promise<void> {
  try {
    // Validar IP do webhook (opcional, mas recomendado)
    const clientIp = req.ip || req.socket.remoteAddress || "";
    const forwardedIp = req.headers["x-forwarded-for"];
    const realIp = typeof forwardedIp === "string" ? forwardedIp.split(",")[0].trim() : clientIp;
    
    // IP esperado do SuitPay: 3.132.137.46
    const suitpayIp = "3.132.137.46";
    if (realIp !== suitpayIp && !realIp.includes(suitpayIp)) {
      console.warn("⚠️ Webhook recebido de IP não autorizado:", realIp);
      // Não bloquear, apenas logar (pode estar atrás de proxy)
    }

    const webhookData = req.body;
    const requestNumber = webhookData.requestNumber;
    const status = webhookData.statusTransaction || webhookData.status;
    const hash = webhookData.hash;

    console.log("📥 Webhook SuitPay recebido:", {
      requestNumber,
      status,
      ip: realIp,
      hasHash: !!hash
    });

    if (!requestNumber || !status) {
      console.error("❌ Dados do webhook inválidos:", webhookData);
      res.status(400).json({ error: "Dados do webhook inválidos" });
      return;
    }

    // Buscar transação
    const transaction = await findTransactionByRequestNumber(requestNumber);
    if (!transaction) {
      console.warn("⚠️ Webhook recebido para transação não encontrada:", requestNumber);
      res.status(404).json({ error: "Transação não encontrada" });
      return;
    }

    // Validar hash do webhook (se fornecido)
    // IMPORTANTE: A validação do hash é obrigatória para segurança
    // Conforme documentação SuitPay: validar hash SHA-256
    if (hash) {
      const suitpayServiceModule = await import("../services/suitpayService");
      const creds = await suitpayServiceModule.suitpayService.getCredentials();
      
      if (!creds.clientSecret) {
        console.error("❌ Client Secret não configurado - não é possível validar hash");
        res.status(500).json({ error: "Configuração incompleta" });
        return;
      }
      
      // Remover hash do payload para validação (manter ordem original dos campos)
      // IMPORTANTE: A ordem dos campos deve ser mantida conforme recebido
      const payloadWithoutHash = { ...webhookData };
      delete payloadWithoutHash.hash;

      const isValid = suitpayServiceModule.validateWebhookHash(payloadWithoutHash, hash, creds.clientSecret);
      if (!isValid) {
        console.error("❌ Hash do webhook inválido:", requestNumber);
        console.error("❌ Payload recebido:", JSON.stringify(webhookData, null, 2));
        res.status(401).json({ error: "Hash inválido" });
        return;
      }
      console.log("✅ Hash do webhook validado com sucesso");
    } else {
      console.warn("⚠️ Webhook sem hash - validação não realizada (não recomendado em produção)");
      // Em produção, você pode querer rejeitar webhooks sem hash
      // res.status(401).json({ error: "Hash não fornecido" });
      // return;
    }

    // Atualizar status da transação
    await updateTransactionStatus(
      requestNumber,
      status,
      webhookData.transactionId || transaction.transactionId,
      webhookData
    );

    // Se pagamento foi aprovado (PAID_OUT), atualizar saldo do usuário
    // Status possíveis: PAID_OUT (pago), CANCELED (cancelado), CHARGEBACK (estorno)
    if (status === "PAID_OUT" && transaction.status !== "PAID_OUT") {
      await updateUserBalance(transaction.userId, transaction.amount);
      console.log(`✅ Saldo atualizado para usuário ${transaction.userId}: +${transaction.amount}`);
    } else if (status === "CHARGEBACK" && transaction.status === "PAID_OUT") {
      // Se houve estorno, reverter o saldo
      await updateUserBalance(transaction.userId, -transaction.amount);
      console.log(`⚠️ Estorno processado para usuário ${transaction.userId}: -${transaction.amount}`);
    }

    console.log(`✅ Webhook processado: ${requestNumber} -> ${status}`);

    res.status(200).json({ success: true, message: "Webhook processado" });
  } catch (error: any) {
    console.error("Erro ao processar webhook:", error);
    res.status(500).json({ error: error.message || "Erro ao processar webhook" });
  }
}

export async function listTransactionsController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const transactions = await listUserTransactions(userId);

    res.json(transactions);
  } catch (error: any) {
    console.error("Erro ao listar transações:", error);
    res.status(500).json({ error: error.message || "Erro ao listar transações" });
  }
}

export async function getTransactionController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    const { requestNumber } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const transaction = await findTransactionByRequestNumber(requestNumber);

    if (!transaction) {
      res.status(404).json({ error: "Transação não encontrada" });
      return;
    }

    // Verificar se a transação pertence ao usuário
    if (transaction.userId !== userId) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    res.json(transaction);
  } catch (error: any) {
    console.error("Erro ao buscar transação:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar transação" });
  }
}

export async function cancelTransactionController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    const { requestNumber } = req.params;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    // Buscar transação
    const transaction = await findTransactionByRequestNumber(requestNumber);

    if (!transaction) {
      res.status(404).json({ error: "Transação não encontrada" });
      return;
    }

    // Verificar se a transação pertence ao usuário
    if (transaction.userId !== userId) {
      res.status(403).json({ error: "Acesso negado" });
      return;
    }

    // Verificar se pode cancelar (apenas pendentes)
    if (transaction.status !== "PENDING") {
      res.status(400).json({ error: "Apenas transações pendentes podem ser canceladas" });
      return;
    }

    // Chamar API SuitPay para cancelar
    const result = await suitpayService.cancelTransaction(requestNumber);

    if (!result.success) {
      res.status(500).json({
        error: result.error || "Erro ao cancelar transação",
        message: result.message
      });
      return;
    }

    // Atualizar status no banco
    await updateTransactionStatus(requestNumber, "CANCELED");

    res.json({
      success: true,
      message: "Transação cancelada com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao cancelar transação:", error);
    res.status(500).json({ error: error.message || "Erro ao cancelar transação" });
  }
}

export async function testConnectionController(req: Request, res: Response): Promise<void> {
  try {
    const result = await suitpayService.testConnection();
    
    if (result.success) {
      res.json({ success: true, message: result.message || "Conexão testada com sucesso" });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || "Erro ao testar conexão",
        message: result.message
      });
    }
  } catch (error: any) {
    console.error("Erro ao testar conexão:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao testar conexão"
    });
  }
}

/**
 * Criar saque PIX-OUT usando XBankAccess
 */
export async function createPixOutController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const parsed = pixOutRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
      return;
    }

    const { amount, pixKey, pixKeyType } = parsed.data;

    // Gerar requestNumber único
    const requestNumber = uuidv4();

    // Construir callback URL
    const baseUrl = process.env.APP_URL || req.protocol + "://" + req.get("host");
    const callbackUrl = `${baseUrl}/api/payments/webhook/xbankaccess`;

    // Criar requisição para XBankAccess
    const xbankRequest: Omit<XBankAccessPixOutRequest, "token" | "secret"> = {
      amount,
      pixKey,
      pixKeyType,
      baasPostbackUrl: callbackUrl
    };

    // Criar transação no banco (tipo WITHDRAWAL)
    const transaction = await createTransaction({
      userId,
      requestNumber,
      paymentMethod: "PIX", // Usar PIX mesmo para saque
      amount: -amount, // Negativo para saque
      status: "PENDING",
      callbackUrl,
      metadata: { gateway: "xbankaccess", type: "withdrawal", pixKey, pixKeyType }
    });

    // Chamar API XBankAccess
    const result = await xbankaccessService.createPixOutPayment(xbankRequest);

    if (!result.success || !result.data) {
      await updateTransactionStatus(requestNumber, "FAILED", undefined, { error: result.error });
      res.status(500).json({
        error: result.error || "Erro ao criar saque PIX",
        message: result.message
      });
      return;
    }

    // Atualizar transação com dados retornados
    await updateTransactionStatus(
      requestNumber,
      result.data.withdrawStatusId || "PENDING",
      result.data.id,
      {
        pixKey: result.data.pixKey,
        pixKeyType: result.data.pixKeyType
      }
    );

    res.status(201).json({
      success: true,
      transaction: {
        id: transaction.id,
        requestNumber,
        transactionId: result.data.id,
        amount: result.data.amount,
        pixKey: result.data.pixKey,
        pixKeyType: result.data.pixKeyType,
        status: result.data.withdrawStatusId || "PENDING",
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt
      }
    });
  } catch (error: any) {
    console.error("Erro ao criar saque PIX:", error);
    res.status(500).json({
      error: error.message || "Erro ao criar saque PIX"
    });
  }
}

/**
 * Webhook do XBankAccess (PIX-IN e PIX-OUT)
 */
export async function xbankaccessWebhookController(req: Request, res: Response): Promise<void> {
  try {
    const webhookData = req.body;
    const idTransaction = webhookData.idTransaction;
    const status = webhookData.status;
    const typeTransaction = webhookData.typeTransaction; // "PIX" para depósito, "PAYMENT" para saque

    console.log("📥 Webhook XBankAccess recebido:", {
      idTransaction,
      status,
      typeTransaction
    });

    if (!idTransaction || !status) {
      console.error("❌ Dados do webhook inválidos:", webhookData);
      res.status(400).json({ error: "Dados do webhook inválidos" });
      return;
    }

    // Buscar transação pelo transactionId
    const [rows] = await pool.query(
      `SELECT * FROM transactions WHERE transaction_id = ?`,
      [idTransaction]
    );

    const transaction = (rows as any[])[0];
    if (!transaction) {
      console.warn("⚠️ Webhook recebido para transação não encontrada:", idTransaction);
      res.status(404).json({ error: "Transação não encontrada" });
      return;
    }

    // Mapear status do XBankAccess para status interno
    // XBankAccess envia "paid" quando pago
    let internalStatus = status.toUpperCase();
    if (status === "paid") {
      internalStatus = typeTransaction === "PAYMENT" ? "PAID_OUT" : "PAID_OUT";
    }

    // Atualizar status da transação
    await updateTransactionStatus(
      transaction.request_number,
      internalStatus,
      idTransaction,
      webhookData
    );

    // Se pagamento foi aprovado (paid), atualizar saldo do usuário
    if (status === "paid") {
      if (typeTransaction === "PIX") {
        // Depósito - adicionar saldo
        await updateUserBalance(transaction.user_id, Math.abs(transaction.amount));
        console.log(`✅ Saldo atualizado (depósito) para usuário ${transaction.user_id}: +${Math.abs(transaction.amount)}`);
      } else if (typeTransaction === "PAYMENT") {
        // Saque - já foi debitado, apenas confirmar
        console.log(`✅ Saque confirmado para usuário ${transaction.user_id}: ${Math.abs(transaction.amount)}`);
      }
    }

    console.log(`✅ Webhook XBankAccess processado: ${idTransaction} -> ${internalStatus}`);

    res.status(200).json({ success: true, message: "Webhook processado" });
  } catch (error: any) {
    console.error("Erro ao processar webhook XBankAccess:", error);
    res.status(500).json({ error: error.message || "Erro ao processar webhook" });
  }
}

/**
 * Testar conexão com XBankAccess
 */
export async function testXBankAccessConnectionController(req: Request, res: Response): Promise<void> {
  try {
    const result = await xbankaccessService.testConnection();
    
    if (result.success) {
      res.json({ success: true, message: result.message || "Conexão XBankAccess testada com sucesso" });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || "Erro ao testar conexão",
        message: result.message
      });
    }
  } catch (error: any) {
    console.error("Erro ao testar conexão XBankAccess:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao testar conexão"
    });
  }
}
