import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AdminPage } from "./pages/AdminPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { DepositPage } from "./pages/DepositPage";
import { SupportPage } from "./pages/SupportPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SideMenu } from "./components/SideMenu";
import { AuthModal } from "./components/AuthModal";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { getUser, removeAuthToken, setUser as saveUserToStorage, api } from "./services/api";
import { HomeIcon, GiftIcon, CreditCardIcon, HeadphonesIcon, UserIcon } from "./components/Icons";
import { DynamicFavicon } from "./components/DynamicFavicon";
import { DynamicLogo } from "./components/DynamicLogo";
import { LoadingBanner } from "./components/LoadingBanner";

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; id: number; is_admin: boolean } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  // Atualizar usuário quando a rota mudar (para verificar admin)
  useEffect(() => {
    if (location.pathname.startsWith("/admin")) {
      const savedUser = getUser();
      const token = localStorage.getItem("token");
      if (token && savedUser) {
        // Verificar novamente se é admin ao acessar rota admin
        api.get("/auth/me")
          .then((response) => {
            // Garantir que is_admin seja boolean
            const updatedUser = {
              ...response.data,
              is_admin: Boolean(
                response.data.is_admin === true || 
                response.data.is_admin === 1 || 
                response.data.is_admin === "true" ||
                response.data.is_admin === "1"
              )
            };
            // Atualizar estado e localStorage
            setUser(updatedUser);
            saveUserToStorage(updatedUser);
          })
          .catch(() => {
            removeAuthToken();
            setUser(null);
          });
      }
    }
  }, [location.pathname]);

  // Verificar autenticação ao carregar
  useEffect(() => {
    async function checkAuth() {
      const savedUser = getUser();
      const token = localStorage.getItem("token");

      // eslint-disable-next-line no-console
      console.log("Verificando autenticação:", { token: !!token, savedUser });

      if (token && savedUser) {
        try {
          // Verificar se o token ainda é válido e obter dados atualizados do banco
          const response = await api.get("/auth/me");
          // eslint-disable-next-line no-console
          console.log("Token válido, usuário:", response.data);
          // Garantir que is_admin seja boolean
          const updatedUser = {
            ...response.data,
            is_admin: Boolean(
              response.data.is_admin === true || 
              response.data.is_admin === 1 || 
              response.data.is_admin === "true" ||
              response.data.is_admin === "1"
            )
          };
          // Atualizar estado e localStorage
          setUser(updatedUser);
          saveUserToStorage(updatedUser);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Token inválido:", error);
          // Token inválido, limpar
          removeAuthToken();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    checkAuth();
  }, []);

  // Verificar autenticação quando authOpen mudar (após login/logout)
  useEffect(() => {
    if (!authOpen) {
      // Quando o modal fecha, verificar novamente o estado
      const savedUser = getUser();
      const token = localStorage.getItem("token");
      if (token && savedUser) {
        setUser(savedUser);
      } else {
        setUser(null);
      }
    }
  }, [authOpen]);

  return (
    <div className={`app-root${isAdmin ? " app-root-admin" : ""}`}>
      <DynamicFavicon />
      <header className="top-bar">
        <div className="top-bar-left">
          <button
            className="icon-button"
            aria-label="Menu"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
          <DynamicLogo
            fallback={<span className="logo-text">BIGBET777</span>}
            className="logo-image"
            style={{ maxHeight: "32px", maxWidth: "120px", objectFit: "contain" }}
          />
        </div>
        <div className="top-bar-right">
          {user && user.username ? (
            <>
              <span className="user-pill">Olá, {user.username}</span>
              {(user.is_admin === true || user.is_admin === "true" || user.is_admin === 1 || user.is_admin === "1") && (
                <NavLink 
                  to="/admin" 
                  className="btn btn-ghost"
                >
                  Admin
                </NavLink>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => {
                  removeAuthToken();
                  setUser(null);
                  if (isAdmin) {
                    window.location.href = "/";
                  }
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  // eslint-disable-next-line no-console
                  console.log("🔓 Botão Login clicado");
                  setAuthMode("login");
                  setAuthOpen(true);
                  // eslint-disable-next-line no-console
                  console.log("Modal deve estar aberto agora");
                }}
              >
                Login
              </button>
              <button
                className="btn btn-gold"
                onClick={() => {
                  setAuthMode("register");
                  setAuthOpen(true);
                }}
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
        onClose={() => {
          setAuthOpen(false);
          // Verificar novamente após fechar o modal
          setTimeout(() => {
            const savedUser = getUser();
            const token = localStorage.getItem("token");
            if (token && savedUser) {
              setUser(savedUser);
            }
          }, 100);
        }}
        onSuccess={(newUser) => {
          // eslint-disable-next-line no-console
          console.log("onSuccess chamado com usuário:", newUser);
          // Atualizar estado imediatamente
          setUser(newUser);
          // Verificar se foi salvo corretamente
          const savedUser = getUser();
          // eslint-disable-next-line no-console
          console.log("Estado atualizado, usuário no localStorage:", savedUser);
        }}
        initialMode={authMode}
      />

      <main className="app-main">
        {loading ? (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            minHeight: "400px",
            flexDirection: "column",
            gap: "16px"
          }}>
            <LoadingBanner 
              style={{ 
                maxWidth: "200px", 
                maxHeight: "200px",
                objectFit: "contain"
              }} 
            />
            <p style={{ color: "var(--text-muted)" }}>Carregando...</p>
          </div>
        ) : (
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
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        )}
      </main>

      {!isAdmin && (
        <nav className="bottom-nav">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">
              <HomeIcon size={22} />
            </span>
            <span className="bottom-nav-label">Início</span>
          </NavLink>
          <NavLink
            to="/promocoes"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">
              <GiftIcon size={22} />
            </span>
            <span className="bottom-nav-label">Promoção</span>
          </NavLink>
          <NavLink
            to="/deposito"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">
              <CreditCardIcon size={22} />
            </span>
            <span className="bottom-nav-label">Depósito</span>
          </NavLink>
          <NavLink
            to="/suporte"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">
              <HeadphonesIcon size={22} />
            </span>
            <span className="bottom-nav-label">Suporte</span>
          </NavLink>
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `bottom-nav-item${isActive ? " active" : ""}`
            }
          >
            <span className="bottom-nav-icon">
              <UserIcon size={22} />
            </span>
            <span className="bottom-nav-label">Perfil</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}


