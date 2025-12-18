import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export async function getReportsController(req: Request, res: Response): Promise<void> {
  try {
    const authReq = req as any;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado" });
      return;
    }

    // Parâmetros de filtro
    const { 
      startDate, 
      endDate, 
      type, // 'deposit', 'withdraw', 'all'
      status, // 'PAID_OUT', 'PENDING', 'FAILED', 'all'
      platform // Para futuras expansões
    } = req.query;

    // Construir query base
    let query = `
      SELECT 
        id,
        user_id as userId,
        request_number as requestNumber,
        transaction_id as transactionId,
        payment_method as paymentMethod,
        amount,
        status,
        created_at as createdAt,
        updated_at as updatedAt
      FROM transactions
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    // Filtro de data
    if (startDate) {
      query += ` AND DATE(created_at) >= ?`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND DATE(created_at) <= ?`;
      params.push(endDate);
    }

    // Filtro de tipo
    if (type && type !== "all") {
      if (type === "deposit") {
        query += ` AND payment_method IN ('PIX', 'CARD', 'BOLETO')`;
      } else if (type === "withdraw") {
        query += ` AND payment_method = 'WITHDRAW'`;
      }
    }

    // Filtro de status
    if (status && status !== "all") {
      query += ` AND status = ?`;
      params.push(status);
    }

    // Ordenar por data mais recente
    query += ` ORDER BY created_at DESC LIMIT 1000`;

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Calcular totais
    const deposits = rows.filter(t => 
      ["PIX", "CARD", "BOLETO"].includes(t.paymentMethod) && 
      t.status === "PAID_OUT"
    );
    const withdrawals = rows.filter(t => 
      t.paymentMethod === "WITHDRAW" && 
      t.status === "PAID_OUT"
    );

    const totalDeposits = deposits.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalWithdrawals = withdrawals.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalAccumulated = totalDeposits - totalWithdrawals;

    // Buscar estatísticas do usuário (sem juros e fundo)
    const [userRows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        COALESCE(total_deposit_amount, 0) as total_deposit_amount,
        COALESCE(total_withdrawal_amount, 0) as total_withdrawal_amount,
        COALESCE(total_bet_amount, 0) as total_bet_amount
      FROM users WHERE id = ?`,
      [userId]
    );

    const userStats = userRows[0] || {};

    res.json({
      success: true,
      transactions: rows.map(t => ({
        ...t,
        amount: Number(t.amount || 0)
      })),
      summary: {
        totalDeposits: Number(totalDeposits.toFixed(2)),
        totalWithdrawals: Number(totalWithdrawals.toFixed(2)),
        totalAccumulated: Number(totalAccumulated.toFixed(2)),
        totalBets: Number(userStats.total_bet_amount || 0),
        // Excluindo juros e fundo conforme solicitado
        totalDepositAmount: Number(userStats.total_deposit_amount || 0),
        totalWithdrawalAmount: Number(userStats.total_withdrawal_amount || 0)
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        type: type || "all",
        status: status || "all",
        platform: platform || "all"
      }
    });
  } catch (error: any) {
    console.error("Erro ao buscar relatórios:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar relatórios" });
  }
}
