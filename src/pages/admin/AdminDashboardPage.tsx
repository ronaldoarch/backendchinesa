export function AdminDashboardPage() {
  // Dados mock para modo demo
  const totalDeposits = 1500.5;
  const totalUsers = 120;
  const conversionRate = 37; // taxa de passagem em %
  const ftdToday = 8; // first time deposits do dia

  return (
    <section className="admin-section">
      <h1>Dashboard</h1>
      <div className="admin-dashboard-grid">
        <div className="admin-card">
          <span className="admin-card-label">Total de depósitos</span>
          <strong className="admin-card-value">
            R$ {totalDeposits.toFixed(2)}
          </strong>
        </div>
        <div className="admin-card">
          <span className="admin-card-label">Total de cadastros</span>
          <strong className="admin-card-value">{totalUsers}</strong>
        </div>
        <div className="admin-card">
          <span className="admin-card-label">Taxa de passagem</span>
          <strong className="admin-card-value">{conversionRate}%</strong>
        </div>
        <div className="admin-card">
          <span className="admin-card-label">FTD hoje</span>
          <strong className="admin-card-value">{ftdToday}</strong>
        </div>
      </div>
      <p className="promos-empty">
        Esses números são apenas demonstrativos. Depois podemos ligar ao banco
        de dados real para puxar estatísticas diárias.
      </p>
    </section>
  );
}


