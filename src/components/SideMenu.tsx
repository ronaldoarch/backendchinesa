import { NavLink, useNavigate } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SideMenu({ open, onClose }: Props) {
  const navigate = useNavigate();

  function handleGoAgent() {
    navigate("/admin");
    onClose();
  }

  if (!open) return null;

  return (
    <div className="side-menu-overlay" onClick={onClose}>
      <aside
        className="side-menu"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <header className="side-menu-header">
          <span className="logo-text">BIGBET777</span>
        </header>

        <nav className="side-menu-section">
          <button className="side-menu-item side-menu-item-active">
            <span>🔥 Popular</span>
          </button>
          <button className="side-menu-item">
            <span>🎰 Slots</span>
          </button>
          <button className="side-menu-item">
            <span>⏱ Recente</span>
          </button>
          <button className="side-menu-item">
            <span>⭐ Favoritos</span>
          </button>
          <button className="side-menu-item">
            <span>🎲 Apostas</span>
          </button>
          <button className="side-menu-item" onClick={handleGoAgent}>
            <span>👤 Agente</span>
          </button>
        </nav>

        <section className="side-menu-section">
          <h3 className="side-menu-title">Promoção</h3>
          <div className="side-menu-promo-grid">
            <button className="promo-pill">Eventos</button>
            <button className="promo-pill promo-pill-highlight">Tarefa</button>
            <button className="promo-pill">VIP</button>
            <button className="promo-pill">Pendente</button>
            <button className="promo-pill promo-pill-wide">Histórico</button>
          </div>
        </section>

        <section className="side-menu-section side-menu-footer">
          <button className="side-menu-item small">
            <span>📶 Linha 1</span>
          </button>
          <button className="side-menu-item small">
            <span>🌐 Português</span>
          </button>
          <a
            href="#baixar"
            className="side-menu-item small side-menu-link"
            onClick={(e) => e.preventDefault()}
          >
            📥 Baixar app
          </a>
          <button className="side-menu-item small">
            <span>💬 Suporte</span>
          </button>
          <button className="side-menu-item small">
            <span>❓ FAQ</span>
          </button>
        </section>

        <footer className="side-menu-bottom">
          <NavLink
            to="/"
            className="side-menu-home-link"
            onClick={onClose}
          >
            Ir para Início
          </NavLink>
        </footer>
      </aside>
    </div>
  );
}


