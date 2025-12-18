import { useState, useEffect } from "react";
import { api, setAuthToken, setUser, getUser } from "../services/api";
import { trackFacebookEvent } from "./FacebookPixel";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: { username: string; id: number; is_admin: boolean }) => void;
  initialMode?: "login" | "register";
};

export function AuthModal({ open, onClose, onSuccess, initialMode = "register" }: Props) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  
  // Atualizar modo quando initialMode mudar ou modal abrir
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line no-console
      console.log("🔄 Modal aberto, resetando estado. Modo:", initialMode);
      setMode(initialMode);
      setError("");
      setPassword("");
      setConfirmPassword("");
      setUsername("");
      setLoading(false);
    }
  }, [open, initialMode]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [referralCode, setReferralCode] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Buscar código de referência da URL
  useEffect(() => {
    if (open && mode === "register") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      if (ref) {
        setReferralCode(ref);
      }
    }
  }, [open, mode]);

  // eslint-disable-next-line no-console
  console.log("AuthModal renderizado:", { open, mode, initialMode });
  
  if (!open) return null;

  function passwordStrength(value: string) {
    let score = 0;
    if (value.length >= 6) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) {
      setError("Você precisa aceitar os termos para continuar");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (username.length < 3) {
      setError("O nome de usuário deve ter pelo menos 3 caracteres");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        username,
        password,
        phone: phone || undefined,
        currency,
        referralCode: referralCode || undefined
      });

      // eslint-disable-next-line no-console
      console.log("Registro bem-sucedido:", response.data);

      setAuthToken(response.data.token);
      setUser(response.data.user);
      
      // Garantir que foi salvo
      const savedUser = getUser();
      // eslint-disable-next-line no-console
      console.log("Usuário salvo no localStorage:", savedUser);
      
      // Disparar evento do Facebook Pixel
      trackFacebookEvent("CompleteRegistration", {
        value: 0,
        currency: "BRL"
      });
      
      onSuccess(response.data.user);
      
      // Limpar formulário
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setPhone("");
      setAccepted(false);
      
      // Fechar modal após um pequeno delay
      setTimeout(() => {
        onClose();
      }, 100);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Erro no registro:", err);
      setError(err.response?.data?.error || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      setError("Preencha todos os campos");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // eslint-disable-next-line no-console
      console.log("🔐 Iniciando login...", { username });
      
      const response = await api.post("/auth/login", {
        username,
        password
      }).catch((error) => {
        // eslint-disable-next-line no-console
        console.error("❌ Erro na requisição de login:", error);
        throw error;
      });

      // eslint-disable-next-line no-console
      console.log("✅ Login bem-sucedido:", response.data);
      // eslint-disable-next-line no-console
      console.log("📦 Response completa:", response);

      // Verificar se a resposta tem os dados esperados
      if (!response.data || !response.data.token || !response.data.user) {
        // eslint-disable-next-line no-console
        console.error("Resposta inválida do servidor:", response.data);
        setError("Resposta inválida do servidor. Tente novamente.");
        setLoading(false);
        return;
      }

      // Salvar token e usuário
      setAuthToken(response.data.token);
      setUser(response.data.user);
      
      // Verificar se foi salvo corretamente
      const savedToken = localStorage.getItem("token");
      const savedUser = getUser();
      // eslint-disable-next-line no-console
      console.log("Token salvo:", !!savedToken, savedToken ? "SIM" : "NÃO");
      // eslint-disable-next-line no-console
      console.log("Usuário salvo no localStorage:", savedUser);
      
      if (!savedToken || !savedUser) {
        // eslint-disable-next-line no-console
        console.error("Erro ao salvar token/usuário no localStorage");
        setError("Erro ao salvar dados de autenticação. Tente novamente.");
        setLoading(false);
        return;
      }
      
      // Normalizar is_admin para garantir que seja boolean
      const normalizedUser = {
        ...response.data.user,
        is_admin: Boolean(
          response.data.user.is_admin === true || 
          response.data.user.is_admin === 1 || 
          response.data.user.is_admin === "true" ||
          response.data.user.is_admin === "1"
        )
      };
      
      // Atualizar localStorage com usuário normalizado
      setUser(normalizedUser);
      
      // Verificar novamente após normalizar
      const finalUser = getUser();
      // eslint-disable-next-line no-console
      console.log("Usuário normalizado salvo:", finalUser);
      
      // Chamar onSuccess ANTES de fechar
      onSuccess(normalizedUser);
      
      // Limpar formulário
      setUsername("");
      setPassword("");
      
      // Fechar modal após um pequeno delay para garantir que tudo foi salvo
      setTimeout(() => {
        onClose();
      }, 200);
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error("Erro no login:", err);
      // eslint-disable-next-line no-console
      console.error("Detalhes do erro:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        code: err.code
      });
      
      if (err.response) {
        // Erro com resposta do servidor
        const errorMsg = err.response?.data?.error || `Erro ${err.response?.status}: ${err.response?.statusText || "Erro ao fazer login"}`;
        setError(errorMsg);
      } else if (err.request) {
        // Erro de rede (sem resposta)
        // eslint-disable-next-line no-console
        console.error("Erro de rede - sem resposta do servidor:", err.request);
        setError("Erro de conexão. Verifique se o servidor está online e se há problemas de CORS.");
      } else {
        // Outro erro
        setError(err.message || "Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    if (mode === "login") {
      handleLogin(e);
    } else {
      handleRegister(e);
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div
        className="auth-modal"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <header className="auth-modal-header modern">
          <div className="auth-title-row">
            <span className="auth-icon">{mode === "login" ? "🔐" : "🧑‍🚀"}</span>
            <div>
              <p className="auth-subtitle">{mode === "login" ? "Acesso rápido" : "Cadastro rápido"}</p>
              <h2>{mode === "login" ? "Faça login" : "Registre sua conta"}</h2>
            </div>
          </div>
        </header>

        <form className="auth-modal-form modern" onSubmit={handleSubmit}>
          <label>
            <span>* Nome de usuário</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === "login" ? "Digite seu usuário" : "Escolha seu usuário"}
              required
              autoComplete={mode === "login" ? "username" : "off"}
            />
          </label>

          <label>
            <span>* Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "login" ? "Digite sua senha" : "Crie uma senha forte"}
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </label>

          {mode === "register" && (
            <>
              <div className="password-strength">
                <span>Força</span>
                <div className="strength-bars">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`strength-bar ${
                        passwordStrength(password) > i ? "filled" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>

              <label>
                <span>* Confirme a senha</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  required
                />
              </label>

              <label>
                <span>Telefone</span>
                <div className="input-group">
                  <span className="input-prefix">+55</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Digite o número do celular"
                    required
                  />
                </div>
              </label>

              <label>
                <span>Código de Referência (opcional)</span>
                <input
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Digite o código"
                />
              </label>

              <label>
                <span>* Moeda</span>
                <div className="select-flag">
                  <span className="flag">🇧🇷</span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="BRL">BRL (BRL)</option>
                  </select>
                </div>
              </label>

              <label className="auth-modal-checkline modern-check">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  Tenho 18 anos, li e concordo com{" "}
                  <button
                    type="button"
                    className="link-inline"
                    onClick={(ev) => ev.preventDefault()}
                  >
                    Acordo do Usuário
                  </button>
                </span>
              </label>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="btn auth-modern-submit"
            disabled={loading || (mode === "register" && !accepted)}
          >
            {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Registrar"}
          </button>
        </form>

        <footer className="auth-modal-footer modern">
          <button
            type="button"
            className="auth-footer-link"
            onClick={onClose}
          >
            Contactar o suporte
          </button>
          <button
            type="button"
            className="auth-footer-link"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setPassword("");
              setConfirmPassword("");
            }}
          >
            {mode === "login" ? "Criar conta" : "Já tenho conta"}
          </button>
        </footer>
      </div>
    </div>
  );
}

