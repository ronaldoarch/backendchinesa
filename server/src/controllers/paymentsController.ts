import { Request, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { RowDataPacket } from "mysql2";
import { suitpayService, SuitPayPixRequest, SuitPayCardRequest, SuitPayBoletoRequest } from "../services/suitpayService";
import { createTransaction, updateTransactionStatus, updateUserBalance, findTransactionByRequestNumber, listUserTransactions } from "../services/transactionsService";
import { applyBonusToDeposit } from "../services/bonusService";
import { dispatchEvent } from "../services/trackingService";
import { pool } from "../config/database";

const pixRequestSchema = z.object({
  amount: z.number().positive(),
  dueDate: z.string().optional(),
  client: z.object({
    name: z.string(),
    document: z.string(), // CPF/CNPJ - obrigatório
    email: z.string().email(), // obrigatório
    phone: z.string().optional() // será mapeado para phoneNumber
  }),
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
  console.log("📥 [PIX] Requisição recebida para criar pagamento PIX");
  console.log("📥 [PIX] Headers:", {
    authorization: req.headers.authorization ? "presente" : "ausente",
    "content-type": req.headers["content-type"]
  });
  console.log("📥 [PIX] Body:", JSON.stringify(req.body, null, 2));
  
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    
    console.log("📥 [PIX] UserId extraído:", userId);

    if (!userId) {
      console.error("❌ [PIX] Usuário não autenticado");
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    const parsed = pixRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos", details: parsed.error.flatten() });
      return;
    }

    const { amount, dueDate, client } = parsed.data;

    // Buscar dados do usuário do banco se document ou email não foram fornecidos
    let userDocument = client.document;
    let userEmail = client.email;
    let userName = client.name;
    let userPhone = client.phone;

    if (!userDocument || !userEmail) {
      try {
        const [userRows] = await pool.query<RowDataPacket[]>(
          "SELECT username, email, document, phone FROM users WHERE id = ?",
          [userId]
        );
        if (userRows.length > 0) {
          const userData = userRows[0];
          userName = userName || userData.username || "Cliente";
          userEmail = userEmail || userData.email || "";
          userDocument = userDocument || userData.document || "";
          userPhone = userPhone || userData.phone || undefined;
        }
      } catch (error) {
        console.error("❌ Erro ao buscar dados do usuário:", error);
      }
    }

    // Validar campos obrigatórios
    if (!userDocument || !userEmail) {
      res.status(400).json({ 
        error: "Dados incompletos", 
        message: "É necessário informar CPF/CNPJ e e-mail. Complete seu perfil primeiro." 
      });
      return;
    }

    // Gerar requestNumber único
    const requestNumber = uuidv4();

    // Calcular data de vencimento (padrão: 1 dia a partir de agora)
    const expirationDate = dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Construir callback URL
    const baseUrl = process.env.APP_URL || req.protocol + "://" + req.get("host");
    const callbackUrl = `${baseUrl}/api/payments/webhook`;

    // Criar requisição para SuitPay
    // Mapear phone para phoneNumber (conforme documentação SuitPay)
    const suitpayRequest: SuitPayPixRequest = {
      requestNumber,
      dueDate: expirationDate,
      amount,
      client: {
        name: userName,
        document: userDocument,
        email: userEmail,
        phoneNumber: userPhone // mapear phone para phoneNumber
      },
      callbackUrl
    };

    // Criar transação no banco
    let transaction;
    try {
      transaction = await createTransaction({
        userId,
        requestNumber,
        paymentMethod: "PIX",
        amount,
        status: "PENDING",
        dueDate: expirationDate,
        callbackUrl
      });
    } catch (error: any) {
      console.error("❌ Erro ao criar transação no banco:", error);
      res.status(500).json({
        error: "Erro ao criar transação",
        message: "Não foi possível criar a transação no banco de dados"
      });
      return;
    }

    // Disparar evento de tracking (não bloquear se falhar)
    try {
      await dispatchEvent("deposit_created", {
        userId,
        transactionId: transaction.id,
        amount,
        paymentMethod: "PIX"
      });
    } catch (error: any) {
      console.warn("⚠️ Erro ao disparar evento de tracking (não crítico):", error);
    }

    // Chamar API SuitPay
    let result;
    try {
      result = await suitpayService.createPixPayment(suitpayRequest);
    } catch (error: any) {
      console.error("❌ Erro ao chamar SuitPay:", error);
      console.error("❌ Stack:", error.stack);
      await updateTransactionStatus(requestNumber, "FAILED", undefined, { 
        error: error.message || "Erro de conexão com SuitPay",
        errorCode: error.code
      });
      res.status(500).json({
        error: "Erro ao conectar com SuitPay",
        message: error.message || "Não foi possível conectar ao gateway de pagamento. Verifique a configuração."
      });
      return;
    }

    if (!result.success || !result.data) {
      console.error("❌ SuitPay retornou erro:", result.error, result.message);
      await updateTransactionStatus(requestNumber, "FAILED", undefined, { error: result.error });
      res.status(500).json({
        error: result.error || "Erro ao criar pagamento PIX",
        message: result.message || "Erro ao processar pagamento"
      });
      return;
    }

    // Atualizar transação com dados retornados
    try {
      await updateTransactionStatus(
        requestNumber,
        result.data.status || "PENDING",
        result.data.transactionId,
        {
          qrCode: result.data.qrCode,
          qrCodeBase64: result.data.qrCodeBase64
        }
      );
    } catch (error: any) {
      console.error("❌ Erro ao atualizar transação:", error);
      // Continuar mesmo se falhar a atualização, pois a transação já foi criada
    }

    // Atualizar campos específicos
    if (result.data.qrCode) {
      await pool.query(
        `UPDATE transactions SET qr_code = ?, qr_code_base64 = ? WHERE request_number = ?`,
        [result.data.qrCode, result.data.qrCodeBase64 || null, requestNumber]
      );
    }

    // Buscar transação atualizada
    let updatedTransaction;
    try {
      updatedTransaction = await findTransactionByRequestNumber(requestNumber);
    } catch (error: any) {
      console.warn("⚠️ Erro ao buscar transação atualizada (não crítico):", error);
      updatedTransaction = null; // Usar dados do result se falhar
    }

    // Preparar resposta final
    const finalTransaction = updatedTransaction || {
      id: transaction.id,
      requestNumber,
      transactionId: result.data.transactionId,
      qrCode: result.data.qrCode,
      qrCodeBase64: result.data.qrCodeBase64,
      amount: result.data.amount || amount,
      dueDate: result.data.dueDate || expirationDate,
      status: result.data.status || "PENDING"
    };

    console.log(`[PIX] 📤 Enviando resposta para frontend:`, {
      requestNumber,
      hasQrCode: !!finalTransaction.qrCode,
      hasQrCodeBase64: !!finalTransaction.qrCodeBase64,
      qrCodeLength: finalTransaction.qrCode?.length || 0,
      qrCodeBase64Length: finalTransaction.qrCodeBase64?.length || 0
    });

    res.status(201).json({
      success: true,
      transaction: finalTransaction
    });
  } catch (error: any) {
    console.error("❌ Erro ao criar pagamento PIX:", error);
    console.error("❌ Stack:", error.stack);
    console.error("❌ Tipo do erro:", error.constructor.name);
    console.error("❌ Mensagem:", error.message);
    console.error("❌ Código:", error.code);
    
    // Se já respondeu, não responder novamente
    if (res.headersSent) {
      console.warn("⚠️ Headers já enviados, não é possível responder novamente");
      return;
    }
    
    // Mensagem de erro mais específica
    let errorMessage = "Ocorreu um erro inesperado. Tente novamente.";
    if (error.message) {
      errorMessage = error.message;
    } else if (error.code) {
      errorMessage = `Erro: ${error.code}`;
    }
    
    res.status(500).json({
      error: "Erro interno ao processar pagamento",
      message: errorMessage
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
      // Atualizar saldo do usuário
      await updateUserBalance(transaction.userId, transaction.amount);
      console.log(`✅ Saldo atualizado para usuário ${transaction.userId}: +${transaction.amount}`);

      // Aplicar bônus automático (se houver)
      if (transaction.amount > 0) {
        try {
          const userBonus = await applyBonusToDeposit(
            transaction.userId,
            transaction.id,
            transaction.amount
          );
          if (userBonus) {
            console.log(`🎁 Bônus aplicado: ${userBonus.bonusAmount} para usuário ${transaction.userId}`);
            // Disparar evento de tracking
            await dispatchEvent("bonus_applied", {
              userId: transaction.userId,
              bonusId: userBonus.bonusId,
              bonusAmount: userBonus.bonusAmount,
              transactionId: transaction.id
            });
          }
        } catch (error: any) {
          console.error("Erro ao aplicar bônus:", error);
          // Não bloquear o processamento do webhook se houver erro no bônus
        }
      }

      // Disparar evento de tracking
      await dispatchEvent("deposit_paid", {
        userId: transaction.userId,
        transactionId: transaction.id,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod
      });
    } else if (status === "CHARGEBACK" && transaction.status === "PAID_OUT") {
      // Se houve estorno, reverter o saldo
      await updateUserBalance(transaction.userId, -transaction.amount);
      console.log(`⚠️ Estorno processado para usuário ${transaction.userId}: -${transaction.amount}`);
      
      // Disparar evento de tracking
      await dispatchEvent("deposit_failed", {
        userId: transaction.userId,
        transactionId: transaction.id,
        amount: transaction.amount,
        reason: "chargeback"
      });
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

