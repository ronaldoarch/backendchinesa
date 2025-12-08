export function ProfilePage() {
  const username = "dias";
  const userId = "35621648";

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar">D</div>
        <div className="profile-header-info">
          <div className="profile-name-row">
            <span className="profile-name">{username}</span>
          </div>
          <div className="profile-id-row">
            <span>ID: {userId}</span>
            <span className="profile-balance">0,00</span>
          </div>
        </div>
      </header>

      <section className="profile-vip-card">
        <div className="profile-vip-header">
          <span className="promos-badge">VIP 0</span>
          <span>
            Restantes <strong>VIP 1</strong> — você precisa apostar 5.000,00
          </span>
        </div>
        <div className="profile-progress">
          <span>Depósito para promoção</span>
          <div className="profile-progress-bar">
            <div className="profile-progress-fill" style={{ width: "0%" }} />
          </div>
        </div>
        <div className="profile-progress">
          <span>Aposta para promoção</span>
          <div className="profile-progress-bar">
            <div className="profile-progress-fill" style={{ width: "0%" }} />
          </div>
        </div>
      </section>

      <section className="profile-menu">
        <ProfileMenuItem label="Recuperar o saldo" />
        <ProfileMenuItem label="Conta" />
        <ProfileMenuItem label="Apostas" />
        <ProfileMenuItem label="Relatório" />
        <ProfileMenuItem label="Gestão retiradas" />
      </section>

      <section className="profile-menu">
        <ProfileMenuItem label="Agente" />
        <ProfileMenuItem label="Dados" />
        <ProfileMenuItem label="Segurança" />
        <ProfileMenuItem label="Idioma" value="Português" />
        <ProfileMenuItem label="FAQ" />
        <ProfileMenuItem label="Bônus de sugestão" />
        <ProfileMenuItem label="Faça login no dispositivo" />
        <ProfileMenuItem label="Sair" />
      </section>
    </div>
  );
}

type ItemProps = {
  label: string;
  value?: string;
};

function ProfileMenuItem({ label, value }: ItemProps) {
  return (
    <button type="button" className="profile-menu-item">
      <span>{label}</span>
      {value && <span className="profile-menu-value">{value}</span>}
      <span className="profile-menu-chevron">›</span>
    </button>
  );
}

