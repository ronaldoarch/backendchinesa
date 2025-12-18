import { pool } from "../config/database";

export type Transaction = {
  id: number;
  userId: number;
  requestNumber: string;
  transactionId?: string | null;
  paymentMethod: "PIX" | "CARD" | "BOLETO" | "WITHDRAW";
  amount: number;
  status: string;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  barcode?: string | null;
  digitableLine?: string | null;
  dueDate?: Date | string | null;
  callbackUrl?: string | null;
  metadata?: Record<string, unknown> | string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function createTransaction(data: {
  userId: number;
  requestNumber: string;
  paymentMethod: "PIX" | "CARD" | "BOLETO" | "WITHDRAW";
  amount: number;
  status?: string;
  transactionId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  barcode?: string;
  digitableLine?: string;
  dueDate?: Date | string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<Transaction> {
  const [result] = await pool.query(
    `INSERT INTO transactions (
      user_id, request_number, transaction_id, payment_method, amount, status,
      qr_code, qr_code_base64, barcode, digitable_line, due_date, callback_url, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.userId,
      data.requestNumber,
      data.transactionId || null,
      data.paymentMethod,
      data.amount,
      data.status || "PENDING",
      data.qrCode || null,
      data.qrCodeBase64 || null,
      data.barcode || null,
      data.digitableLine || null,
      data.dueDate
        ? typeof data.dueDate === "string"
          ? data.dueDate
          : new Date(data.dueDate).toISOString().split("T")[0]
        : null,
      data.callbackUrl || null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ]
  );

  const [rows] = await pool.query(
    `SELECT * FROM transactions WHERE id = ?`,
    [(result as any).insertId]
  );

  return (rows as Transaction[])[0];
}

export async function findTransactionByRequestNumber(requestNumber: string): Promise<Transaction | null> {
  const [rows] = await pool.query(
    `SELECT 
      id, 
      user_id as userId,
      request_number as requestNumber,
      transaction_id as transactionId,
      payment_method as paymentMethod,
      amount,
      status,
      qr_code as qrCode,
      qr_code_base64 as qrCodeBase64,
      barcode,
      digitable_line as digitableLine,
      due_date as dueDate,
      callback_url as callbackUrl,
      metadata,
      created_at as createdAt,
      updated_at as updatedAt
    FROM transactions WHERE request_number = ?`,
    [requestNumber]
  );

  const transaction = (rows as any[])[0];
  if (!transaction) return null;

  // Garantir que userId está presente
  if (!transaction.userId) {
    console.error("❌ [TRANSACTION] Transação encontrada mas sem userId:", requestNumber);
    // Tentar buscar pelo campo user_id se userId não estiver presente
    const [altRows] = await pool.query(
      `SELECT user_id FROM transactions WHERE request_number = ?`,
      [requestNumber]
    );
    if ((altRows as any[])[0]?.user_id) {
      transaction.userId = (altRows as any[])[0].user_id;
      console.log("✅ [TRANSACTION] userId recuperado do campo user_id:", transaction.userId);
    }
  }

  // Parse metadata se for string
  if (transaction.metadata && typeof transaction.metadata === "string") {
    try {
      transaction.metadata = JSON.parse(transaction.metadata);
    } catch {
      transaction.metadata = {};
    }
  }

  return transaction as Transaction;
}

export async function updateTransactionStatus(
  requestNumber: string,
  status: string,
  transactionId?: string,
  metadata?: Record<string, unknown>
): Promise<Transaction | null> {
  const updates: string[] = [];
  const values: unknown[] = [];

  updates.push("status = ?");
  values.push(status);

  if (transactionId) {
    updates.push("transaction_id = ?");
    values.push(transactionId);
  }

  if (metadata) {
    // Mesclar com metadata existente se houver
    const existing = await findTransactionByRequestNumber(requestNumber);
    const existingMetadata = existing?.metadata ? (typeof existing.metadata === "string" ? JSON.parse(existing.metadata) : existing.metadata) : {};
    const mergedMetadata = { ...existingMetadata, ...metadata };
    updates.push("metadata = ?");
    values.push(JSON.stringify(mergedMetadata));
  }

  values.push(requestNumber);

  await pool.query(
    `UPDATE transactions SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE request_number = ?`,
    values
  );

  return findTransactionByRequestNumber(requestNumber);
}

export async function listUserTransactions(userId: number): Promise<Transaction[]> {
  const [rows] = await pool.query(
    `SELECT 
      id,
      user_id as userId,
      request_number as requestNumber,
      transaction_id as transactionId,
      payment_method as paymentMethod,
      amount,
      status,
      qr_code as qrCode,
      qr_code_base64 as qrCodeBase64,
      barcode,
      digitable_line as digitableLine,
      due_date as dueDate,
      callback_url as callbackUrl,
      metadata,
      created_at as createdAt,
      updated_at as updatedAt
    FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  // Parse metadata para cada transação
  return (rows as any[]).map((row) => {
    if (row.metadata && typeof row.metadata === "string") {
      try {
        row.metadata = JSON.parse(row.metadata);
      } catch {
        row.metadata = {};
      }
    }
    return row as Transaction;
  });
}

export async function updateUserBalance(userId: number, amount: number): Promise<void> {
  await pool.query(
    `UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [amount, userId]
  );
}
