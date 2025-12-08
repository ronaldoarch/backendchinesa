import { useState } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AdminPage } from "./pages/AdminPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { DepositPage } from "./pages/DepositPage";
import { SupportPage } from "./pages/SupportPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SideMenu } from "./components/SideMenu";
import { AuthModal } from "./components/AuthModal";

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className={`app-root${isAdmin ? " app-root-admin" : ""}`}>
      <header className="top-bar">
        <div className="top-bar-left">
          <button
            className="icon-button"
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
          <span className="logo-text">BIGBET777</span>
        </div>
        <div className="top-bar-right">
          {user ? (
            <span className="user-pill">Olá, {user.username}</span>
          ) : (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => setAuthOpen(true)}
              >
                Login
              </button>
              <button
                className="btn btn-gold"
                onClick={() => setAuthOpen(true)}
              >
                Registro
              </button>
            </>
          )}
        </div>
      </header>

      {!isAdmin && (
        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      )}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/promocoes"
            element={
              <PromotionsPage
                user={user}
                onRequireAuth={() => setAuthOpen(true)}
              />
            }
          />
          <Route path="/deposito" element={<DepositPage />} />
          <Route path="/suporte" element={<SupportPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/admin/*" element={<AdminPage />} />
        </Routes>
      </main>

      {!isAdmin && (
        <nav className="bottom-nav">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">🏠</span>
            <span className="bottom-nav-label">Início</span>
          </NavLink>
          <NavLink
            to="/promocoes"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">🎁</span>
            <span className="bottom-nav-label">Promoção</span>
          </NavLink>
          <NavLink
            to="/deposito"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">💳</span>
            <span className="bottom-nav-label">Depósito</span>
          </NavLink>
          <NavLink
            to="/suporte"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">🎧</span>
            <span className="bottom-nav-label">Suporte</span>
          </NavLink>
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">👤</span>
            <span className="bottom-nav-label">Perfil</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}


