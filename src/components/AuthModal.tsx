import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: { username: string }) => void;
};

export function AuthModal({ open, onClose, onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function passwordStrength(value: string) {
    let score = 0;
    if (value.length >= 6) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) return;
    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }
    setError("");
    onSuccess({ username });
    onClose();
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
            <span className="auth-icon">🧑‍🚀</span>
            <div>
              <p className="auth-subtitle">Cadastro rápido</p>
          <h2>Registre sua conta</h2>
            </div>
          </div>
        </header>

        <form className="auth-modal-form modern" onSubmit={handleSubmit}>
          <label>
            <span>* Nome de usuário</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Escolha seu usuário"
              required
            />
          </label>

          <label>
            <span>* Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha forte"
              required
            />
          </label>

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
            <span>* Telefone</span>
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

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="btn auth-modern-submit"
            disabled={!accepted}
          >
            Registro
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
            onClick={onClose}
          >
            Login
          </button>
        </footer>
      </div>
    </div>
  );
}

