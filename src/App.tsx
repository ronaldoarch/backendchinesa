import { useState, useEffect } from "react";
import { Routes, Route, NavLink, useLocation, useNavigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { AdminPage } from "./pages/AdminPage";
import { ManagerPage } from "./pages/ManagerPage";
import { PromotionsPage } from "./pages/PromotionsPage";
import { DepositPage } from "./pages/DepositPage";
import { SupportPage } from "./pages/SupportPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReportsPage } from "./pages/ReportsPage";
import { GamePage } from "./pages/GamePage";
import { SideMenu } from "./components/SideMenu";
import { AuthModal } from "./components/AuthModal";
import { ProtectedRoute, ManagerRoute } from "./components/ProtectedRoute";
import { getUser, removeAuthToken, setUser as saveUserToStorage, api } from "./services/api";
import { HomeIcon, GiftIcon, CreditCardIcon, HeadphonesIcon, UserIcon } from "./components/Icons";
import { DynamicFavicon } from "./components/DynamicFavicon";
import { DynamicLogo } from "./components/DynamicLogo";
import { LoadingBanner } from "./components/LoadingBanner";
import { FacebookPixel } from "./components/FacebookPixel";
import { UtmfyTracker } from "./components/UtmfyTracker";

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; id: number; is_admin: boolean; balance?: number } | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
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
            balance: response.data.balance || 0, // Garantir que balance esteja presente
            is_admin: Boolean(
              response.data.is_admin === true || 
              response.data.is_admin === 1 || 
              response.data.is_admin === "true" ||
              response.data.is_admin === "1"
            )
          };
          console.log("💰 [APP] Usuário atualizado com saldo:", updatedUser.balance);
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
        // Atualizar dados do usuário incluindo saldo
        api.get("/auth/me")
          .then((response) => {
            const updatedUser = {
              ...response.data,
              balance: response.data.balance || 0,
              is_admin: Boolean(
                response.data.is_admin === true || 
                response.data.is_admin === 1 || 
                response.data.is_admin === "true" ||
                response.data.is_admin === "1"
              )
            };
            setUser(updatedUser);
            saveUserToStorage(updatedUser);
          })
          .catch(() => {
            setUser(savedUser);
          });
      } else {
        setUser(null);
      }
    }
  }, [authOpen]);

  // Processar rota /register com parâmetro ref (para links de afiliados e gerentes)
  useEffect(() => {
    if (location.pathname === "/register") {
      const urlParams = new URLSearchParams(location.search);
      const ref = urlParams.get("ref");
      
      // Se não estiver logado, abrir modal de registro com o código de referência
      if (!user) {
        setAuthMode("register");
        setAuthOpen(true);
        // O AuthModal já captura o ref da URL automaticamente
      } else {
        // Se já estiver logado, redirecionar para home
        navigate("/");
      }
    }
  }, [location.pathname, location.search, user, navigate]);

  // Atualizar saldo quando a rota mudar (após depósitos, etc)
  useEffect(() => {
    if (user && user.id) {
      // Atualizar saldo periodicamente ou quando necessário
      const updateBalance = async () => {
        try {
          const response = await api.get("/auth/me");
          if (response.data.balance !== undefined) {
            setUser(prev => prev ? { ...prev, balance: response.data.balance || 0 } : null);
            saveUserToStorage({ ...user, balance: response.data.balance || 0 });
          }
        } catch (error) {
          console.error("Erro ao atualizar saldo:", error);
        }
      };

      // Atualizar saldo quando a rota mudar para /deposito ou /perfil
      if (location.pathname === "/deposito" || location.pathname === "/perfil") {
        updateBalance();
      }
    }
  }, [location.pathname, user?.id]);

  return (
    <div className={`app-root${isAdmin ? " app-root-admin" : ""}`}>
      <FacebookPixel />
      <UtmfyTracker />
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
            fallback={<span className="logo-text">H2bet</span>}
            className="logo-image"
            style={{ maxHeight: "48px", maxWidth: "180px", objectFit: "contain" }}
          />
        </div>
        <div className="top-bar-right">
          {user && user.username ? (
            <>
              <span className="user-balance">
                R$ {new Intl.NumberFormat("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                }).format(user.balance || 0)}
              </span>
              <span className="user-pill">Olá, {user.username}</span>
              {(user.is_admin === true || user.is_admin === "true" || user.is_admin === 1 || user.is_admin === "1") && (
                <NavLink 
                  to="/admin" 
                  className="btn btn-ghost"
                >
                  Admin
                </NavLink>
              )}
              {(user as any).user_type === "manager" && (
                <NavLink 
                  to="/gerente" 
                  className="btn btn-ghost"
                >
                  Gerente
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
            {/* Rota /register para links de afiliados e gerentes - redireciona para home com modal aberto */}
            <Route path="/register" element={<HomePage />} />
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
            <Route path="/relatorios" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jogo/:id"
              element={
                <ProtectedRoute>
                  <GamePage />
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
            <Route
              path="/gerente/*"
              element={
                <ManagerRoute>
                  <ManagerPage />
                </ManagerRoute>
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
            <span className="bottom-nav-label">Carteira</span>
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


