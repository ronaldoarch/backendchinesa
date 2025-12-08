export function DepositPage() {
  return (
    <div className="deposit-page">
      <header className="deposit-header">
        <h1>Depósito online</h1>
      </header>

      <section className="deposit-section">
        <div className="deposit-provider-card">
          <div className="deposit-provider-logo">🏦</div>
          <div className="deposit-provider-info">
            <span>Fortebets-PIX</span>
            <small>Método demo</small>
          </div>
        </div>

        <div className="deposit-method-tabs">
          <button className="deposit-method-tab deposit-method-tab-active">
            BRL-PIX
          </button>
          <button className="deposit-method-tab">BRL-PIX</button>
          <button className="deposit-method-tab">BRL-PIX</button>
        </div>

        <div className="deposit-amount-grid">
          {[50, 100, 500, 1000, 3000, 5000, 10000, 50000].map((v) => (
            <button key={v} className="deposit-amount-btn" type="button">
              {v.toLocaleString("pt-BR")}
            </button>
          ))}
        </div>

        <input
          className="deposit-input"
          placeholder="R$ Mínimo 10 – Máximo 50.000"
        />

        <button className="btn btn-gold deposit-submit" type="button">
          Deposite agora
        </button>
      </section>
    </div>
  );
}

