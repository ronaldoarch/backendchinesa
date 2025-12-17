import { pool } from "../config/database";
import { RowDataPacket } from "mysql2";

export type DashboardStats = {
  totalUsers: number;
  newUsersToday: number;
  totalDeposits: number;
  depositsToday: number;
  totalWithdrawals: number;
  withdrawalsToday: number;
  totalBets: number;
  totalBonus: number;
  conversionRate: number;
  ftdToday: number;
  activeUsers: number;
  averageTicket: number;
  depositStatus: {
    paid: number;
    pending: number;
    failed: number;
  };
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // Total de usuários
  const [totalUsersRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM users"
  );
  const totalUsers = Number(totalUsersRows[0]?.count || 0);

  // Novos usuários hoje
  const [newUsersRows] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?",
    [todayStr]
  );
  const newUsersToday = Number(newUsersRows[0]?.count || 0);

  // Total de depósitos
  const [depositsRows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total,
      COALESCE(SUM(CASE WHEN amount > 0 AND DATE(created_at) = ? THEN amount ELSE 0 END), 0) as today
    FROM transactions 
    WHERE payment_method IN ('PIX', 'CARD', 'BOLETO') AND amount > 0`,
    [todayStr]
  );
  const totalDeposits = Number(depositsRows[0]?.total || 0);
  const depositsToday = Number(depositsRows[0]?.today || 0);

  // Total de saques
  const [withdrawalsRows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total,
      COALESCE(SUM(CASE WHEN amount < 0 AND DATE(created_at) = ? THEN ABS(amount) ELSE 0 END), 0) as today
    FROM transactions 
    WHERE payment_method IN ('PIX', 'CARD', 'BOLETO') AND amount < 0`,
    [todayStr]
  );
  const totalWithdrawals = Number(withdrawalsRows[0]?.total || 0);
  const withdrawalsToday = Number(withdrawalsRows[0]?.today || 0);

  // Total apostado
  const [betsRows] = await pool.query<RowDataPacket[]>(
    "SELECT COALESCE(SUM(bet_amount), 0) as total FROM user_bets"
  );
  const totalBets = Number(betsRows[0]?.total || 0);

  // Total de bônus
  const [bonusRows] = await pool.query<RowDataPacket[]>(
    "SELECT COALESCE(SUM(bonus_amount), 0) as total FROM user_bonuses WHERE status = 'active'"
  );
  const totalBonus = Number(bonusRows[0]?.total || 0);

  // Taxa de conversão (usuários que depositaram / total de usuários)
  const [conversionRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT user_id) as count 
     FROM transactions 
     WHERE payment_method IN ('PIX', 'CARD', 'BOLETO') 
     AND amount > 0 
     AND status = 'PAID_OUT'`
  );
  const usersWhoDeposited = Number(conversionRows[0]?.count || 0);
  const conversionRate = totalUsers > 0 ? (usersWhoDeposited / totalUsers) * 100 : 0;

  // FTD hoje (First Time Deposits)
  const [ftdRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT t.user_id) as count
     FROM transactions t
     WHERE t.payment_method IN ('PIX', 'CARD', 'BOLETO')
     AND t.amount > 0
     AND DATE(t.created_at) = ?
     AND t.user_id NOT IN (
       SELECT DISTINCT user_id 
       FROM transactions 
       WHERE payment_method IN ('PIX', 'CARD', 'BOLETO')
       AND amount > 0
       AND DATE(created_at) < ?
     )`,
    [todayStr, todayStr]
  );
  const ftdToday = Number(ftdRows[0]?.count || 0);

  // Usuários ativos (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [activeUsersRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(DISTINCT user_id) as count
     FROM transactions
     WHERE created_at >= ?`,
    [thirtyDaysAgo.toISOString()]
  );
  const activeUsers = Number(activeUsersRows[0]?.count || 0);

  // Ticket médio
  const [avgTicketRows] = await pool.query<RowDataPacket[]>(
    `SELECT COALESCE(AVG(amount), 0) as avg
     FROM transactions
     WHERE payment_method IN ('PIX', 'CARD', 'BOLETO')
     AND amount > 0
     AND status = 'PAID_OUT'`
  );
  const averageTicket = Number(avgTicketRows[0]?.avg || 0);

  // Status dos depósitos
  const [statusRows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      status,
      COUNT(*) as count
    FROM transactions
    WHERE payment_method IN ('PIX', 'CARD', 'BOLETO')
    AND amount > 0
    GROUP BY status`
  );
  
  const depositStatus = {
    paid: 0,
    pending: 0,
    failed: 0
  };

  for (const row of statusRows as any[]) {
    const status = (row.status || "").toUpperCase();
    if (status === "PAID_OUT" || status === "PAID") {
      depositStatus.paid += Number(row.count || 0);
    } else if (status === "PENDING") {
      depositStatus.pending += Number(row.count || 0);
    } else if (status === "FAILED" || status === "CANCELLED") {
      depositStatus.failed += Number(row.count || 0);
    }
  }

  return {
    totalUsers,
    newUsersToday,
    totalDeposits,
    depositsToday,
    totalWithdrawals,
    withdrawalsToday,
    totalBets,
    totalBonus,
    conversionRate: Number(conversionRate.toFixed(2)),
    ftdToday,
    activeUsers,
    averageTicket: Number(averageTicket.toFixed(2)),
    depositStatus
  };
}
