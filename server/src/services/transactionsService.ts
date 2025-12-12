import { pool } from "../config/database";

export type Transaction = {
  id: number;
  userId: number;
  requestNumber: string;
  transactionId?: string | null;
  paymentMethod: "PIX" | "CARD" | "BOLETO";
  amount: number;
  status: string;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  barcode?: string | null;
  digitableLine?: string | null;
  dueDate?: Date | null;
  callbackUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function createTransaction(data: {
  userId: number;
  requestNumber: string;
  paymentMethod: "PIX" | "CARD" | "BOLETO";
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
    `SELECT * FROM transactions WHERE request_number = ?`,
    [requestNumber]
  );

  return (rows as Transaction[])[0] || null;
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
    updates.push("metadata = ?");
    values.push(JSON.stringify(metadata));
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
    `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  return rows as Transaction[];
}

export async function updateUserBalance(userId: number, amount: number): Promise<void> {
  await pool.query(
    `UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [amount, userId]
  );
}
