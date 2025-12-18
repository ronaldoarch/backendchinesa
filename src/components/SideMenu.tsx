import { NavLink, useNavigate } from "react-router-dom";
import {
  FireIcon,
  SlotIcon,
  ClockIcon,
  StarIcon,
  DiceIcon,
  UserIcon,
  SignalIcon,
  GlobeIcon,
  DownloadIcon,
  MessageIcon,
  HelpIcon
} from "./Icons";
import { DynamicLogo } from "./DynamicLogo";

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
          <DynamicLogo
            fallback={<span className="logo-text">H2bet</span>}
            className="logo-image"
            style={{ maxHeight: "48px", maxWidth: "200px", objectFit: "contain" }}
          />
        </header>

        <nav className="side-menu-section">
          <button className="side-menu-item side-menu-item-active">
            <FireIcon size={18} className="side-menu-icon" />
            <span>Popular</span>
          </button>
          <button className="side-menu-item">
            <SlotIcon size={18} className="side-menu-icon" />
            <span>Slots</span>
          </button>
          <button className="side-menu-item">
            <ClockIcon size={18} className="side-menu-icon" />
            <span>Recente</span>
          </button>
          <button className="side-menu-item">
            <StarIcon size={18} className="side-menu-icon" />
            <span>Favoritos</span>
          </button>
          <button className="side-menu-item">
            <DiceIcon size={18} className="side-menu-icon" />
            <span>Apostas</span>
          </button>
          <button className="side-menu-item" onClick={handleGoAgent}>
            <UserIcon size={18} className="side-menu-icon" />
            <span>Agente</span>
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
            <SignalIcon size={16} className="side-menu-icon" />
            <span>Linha 1</span>
          </button>
          <button className="side-menu-item small">
            <GlobeIcon size={16} className="side-menu-icon" />
            <span>Português</span>
          </button>
          <a
            href="#baixar"
            className="side-menu-item small side-menu-link"
            onClick={(e) => e.preventDefault()}
          >
            <DownloadIcon size={16} className="side-menu-icon" />
            <span>Baixar app</span>
          </a>
          <button className="side-menu-item small">
            <MessageIcon size={16} className="side-menu-icon" />
            <span>Suporte</span>
          </button>
          <button className="side-menu-item small">
            <HelpIcon size={16} className="side-menu-icon" />
            <span>FAQ</span>
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


