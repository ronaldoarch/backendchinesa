import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, getUser, setUser, removeAuthToken } from "../services/api";

type UserData = {
  id: number;
  username: string;
  phone?: string;
  email?: string;
  document?: string;
  currency: string;
  balance: number;
  bonus_balance?: number;
  is_admin: boolean;
};

type ReferralStats = {
  totalReferrals: number;
  totalBonusEarned: number;
  bonusBalance: number;
  referrals: Array<{
    userId: number;
    username: string;
    totalBet: number;
    bonusCredited: boolean;
  }>;
};

export function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<"dados" | "senha" | "agente" | null>(null);
  const [referralLink, setReferralLink] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loadingReferral, setLoadingReferral] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    loadReferralData();
  }, []);

  async function loadReferralData() {
    try {
      setLoadingReferral(true);
      const [linkResponse, statsResponse] = await Promise.all([
        api.get<{ referralCode: string; referralLink: string }>("/referrals/link"),
        api.get<ReferralStats>("/referrals/stats")
      ]);
      
      setReferralLink(linkResponse.data.referralLink);
      setReferralCode(linkResponse.data.referralCode);
      setReferralStats(statsResponse.data);
    } catch (err: any) {
      console.error("Erro ao carregar dados de indicação:", err);
    } finally {
      setLoadingReferral(false);
    }
  }

  function copyReferralLink() {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      alert("Link copiado para a área de transferência!");
    }
  }

  async function loadUserData() {
    try {
      setLoading(true);
      const response = await api.get("/auth/me");
      const user = response.data;
      setUserData({
        id: user.id,
        username: user.username,
        phone: user.phone || "",
        email: user.email || "",
        document: user.document || "",
        currency: user.currency || "BRL",
        balance: user.balance || 0,
        bonus_balance: user.bonus_balance || 0,
        is_admin: user.is_admin || false
      });
      // Atualizar localStorage também
      setUser(user);
    } catch (err: any) {
      console.error("Erro ao carregar dados do usuário:", err);
      setError("Erro ao carregar dados do usuário");
      if (err.response?.status === 401) {
        removeAuthToken();
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleMenuClick(action: string) {
    switch (action) {
      case "recuperar-saldo":
        navigate("/deposito");
        break;
      case "conta":
        setEditModal("dados");
        break;
      case "apostas":
        // TODO: Implementar página de apostas
        alert("Página de apostas em desenvolvimento");
        break;
      case "relatorio":
        // TODO: Implementar página de relatório
        alert("Página de relatório em desenvolvimento");
        break;
      case "gestao-retiradas":
        // TODO: Implementar página de gestão de retiradas
        alert("Página de gestão de retiradas em desenvolvimento");
        break;
      case "agente":
        setEditModal("agente");
        break;
      case "dados":
        setEditModal("dados");
        break;
      case "seguranca":
        setEditModal("senha");
        break;
      case "idioma":
        // TODO: Implementar seleção de idioma
        alert("Seleção de idioma em desenvolvimento");
        break;
      case "faq":
        // TODO: Implementar FAQ
        alert("FAQ em desenvolvimento");
        break;
      case "bonus-sugestao":
        // TODO: Implementar bônus de sugestão
        alert("Bônus de sugestão em desenvolvimento");
        break;
      case "login-dispositivo":
        // TODO: Implementar login no dispositivo
        alert("Login no dispositivo em desenvolvimento");
        break;
      case "sair":
        handleLogout();
        break;
      default:
        break;
    }
  }

  function handleLogout() {
    if (confirm("Tem certeza que deseja sair?")) {
      removeAuthToken();
      navigate("/");
    }
  }

  if (loading) {
    return (
      <div className="profile-page" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Carregando...</p>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="profile-page" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "var(--error)" }}>{error || "Erro ao carregar dados"}</p>
        <button
          onClick={loadUserData}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            background: "var(--gold)",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const usernameInitial = userData.username.charAt(0).toUpperCase();
  const formattedBalance = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: userData.currency || "BRL"
  }).format(userData.balance);

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar">{usernameInitial}</div>
        <div className="profile-header-info">
          <div className="profile-name-row">
            <span className="profile-name">{userData.username}</span>
          </div>
          <div className="profile-id-row">
            <span>ID: {userData.id}</span>
            <span className="profile-balance">{formattedBalance}</span>
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
        <ProfileMenuItem
          label="Recuperar o saldo"
          onClick={() => handleMenuClick("recuperar-saldo")}
        />
        <ProfileMenuItem
          label="Conta"
          onClick={() => handleMenuClick("conta")}
        />
        <ProfileMenuItem
          label="Apostas"
          onClick={() => handleMenuClick("apostas")}
        />
        <ProfileMenuItem
          label="Relatório"
          onClick={() => handleMenuClick("relatorio")}
        />
        <ProfileMenuItem
          label="Gestão retiradas"
          onClick={() => handleMenuClick("gestao-retiradas")}
        />
      </section>

      <section className="profile-menu">
        <ProfileMenuItem
          label="Agente"
          onClick={() => handleMenuClick("agente")}
        />
        <ProfileMenuItem
          label="Dados"
          onClick={() => handleMenuClick("dados")}
        />
        <ProfileMenuItem
          label="Segurança"
          onClick={() => handleMenuClick("seguranca")}
        />
        <ProfileMenuItem
          label="Idioma"
          value="Português"
          onClick={() => handleMenuClick("idioma")}
        />
        <ProfileMenuItem
          label="FAQ"
          onClick={() => handleMenuClick("faq")}
        />
        <ProfileMenuItem
          label="Bônus de sugestão"
          onClick={() => handleMenuClick("bonus-sugestao")}
        />
        <ProfileMenuItem
          label="Faça login no dispositivo"
          onClick={() => handleMenuClick("login-dispositivo")}
        />
        <ProfileMenuItem
          label="Sair"
          onClick={() => handleMenuClick("sair")}
        />
      </section>

      {editModal === "dados" && (
        <EditDataModal
          userData={userData}
          onClose={() => setEditModal(null)}
          onSuccess={loadUserData}
        />
      )}

      {editModal === "senha" && (
        <EditPasswordModal
          onClose={() => setEditModal(null)}
        />
      )}

      {editModal === "agente" && (
        <AgentModal
          referralLink={referralLink}
          referralStats={referralStats}
          loadingReferral={loadingReferral}
          onClose={() => setEditModal(null)}
          onCopyLink={copyReferralLink}
        />
      )}
    </div>
  );
}

type ProfileMenuItemProps = {
  label: string;
  value?: string;
  onClick: () => void;
};

function ProfileMenuItem({ label, value, onClick }: ProfileMenuItemProps) {
  return (
    <button type="button" className="profile-menu-item" onClick={onClick}>
      <span>{label}</span>
      {value && <span className="profile-menu-value">{value}</span>}
      <span className="profile-menu-chevron">›</span>
    </button>
  );
}

type EditDataModalProps = {
  userData: UserData;
  onClose: () => void;
  onSuccess: () => void;
};

function EditDataModal({ userData, onClose, onSuccess }: EditDataModalProps) {
  const [phone, setPhone] = useState(userData.phone || "");
  const [email, setEmail] = useState(userData.email || "");
  const [document, setDocument] = useState(userData.document || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const updateData: any = {};
      if (phone !== userData.phone) updateData.phone = phone || null;
      if (email !== userData.email) updateData.email = email || null;
      if (document !== userData.document) updateData.document = document || null;

      if (Object.keys(updateData).length === 0) {
        setError("Nenhuma alteração foi feita");
        setLoading(false);
        return;
      }

      // Validar email se fornecido
      if (updateData.email && updateData.email !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          setError("Email inválido");
          setLoading(false);
          return;
        }
      }

      await api.put("/auth/profile", updateData);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Erro ao atualizar dados:", err);
      setError(err.response?.data?.error || "Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Dados Pessoais</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="document">CPF/CNPJ</label>
            <input
              id="document"
              type="text"
              value={document}
              onChange={(e) => setDocument(e.target.value.replace(/\D/g, ""))}
              placeholder="000.000.000-00"
              maxLength={14}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="form-error" style={{ color: "var(--error)", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="form-success" style={{ color: "var(--success)", marginBottom: "16px" }}>
              Dados atualizados com sucesso!
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type EditPasswordModalProps = {
  onClose: () => void;
};

type AgentModalProps = {
  referralLink: string;
  referralStats: ReferralStats | null;
  loadingReferral: boolean;
  onClose: () => void;
  onCopyLink: () => void;
};

function AgentModal({ referralLink, referralStats, loadingReferral, onClose, onCopyLink }: AgentModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px"
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "500px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          border: "2px solid var(--gold)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>
          <h2 style={{
            margin: 0,
            color: "var(--gold)",
            fontSize: "20px",
            fontWeight: "bold"
          }}>
            🎁 Indique e Ganhe
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            ×
          </button>
        </div>

        {loadingReferral ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Carregando...</p>
        ) : (
          <>
            <div style={{ marginBottom: "20px" }}>
              <p style={{
                margin: "0 0 8px 0",
                color: "var(--text-muted)",
                fontSize: "14px"
              }}>
                Seu link de indicação:
              </p>
              <div style={{
                display: "flex",
                gap: "8px",
                alignItems: "center"
              }}>
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "var(--bg-elevated)",
                    border: "1px solid rgba(246, 196, 83, 0.3)",
                    borderRadius: "8px",
                    color: "var(--text-main)",
                    fontSize: "14px"
                  }}
                />
                <button
                  onClick={onCopyLink}
                  style={{
                    padding: "12px 20px",
                    background: "var(--gold)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#000",
                    fontWeight: "bold",
                    cursor: "pointer",
                    fontSize: "14px",
                    whiteSpace: "nowrap"
                  }}
                >
                  Copiar
                </button>
              </div>
            </div>

            {referralStats && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px"
              }}>
                <div style={{
                  background: "var(--bg-elevated)",
                  padding: "16px",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <p style={{
                    margin: "0 0 8px 0",
                    color: "var(--text-muted)",
                    fontSize: "12px"
                  }}>
                    Indicados
                  </p>
                  <p style={{
                    margin: 0,
                    color: "var(--gold)",
                    fontSize: "24px",
                    fontWeight: "bold"
                  }}>
                    {referralStats.totalReferrals}
                  </p>
                </div>
                <div style={{
                  background: "var(--bg-elevated)",
                  padding: "16px",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <p style={{
                    margin: "0 0 8px 0",
                    color: "var(--text-muted)",
                    fontSize: "12px"
                  }}>
                    Bônus Disponível
                  </p>
                  <p style={{
                    margin: 0,
                    color: "var(--gold)",
                    fontSize: "24px",
                    fontWeight: "bold"
                  }}>
                    R$ {referralStats.bonusBalance.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            )}

            <div style={{
              padding: "16px",
              background: "rgba(246, 196, 83, 0.1)",
              borderRadius: "8px",
              fontSize: "14px",
              color: "var(--text-main)"
            }}>
              <p style={{ margin: "0 0 12px 0", fontWeight: "bold", color: "var(--gold)" }}>
                Como funciona:
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8" }}>
                <li>Compartilhe seu link com amigos</li>
                <li>Quando alguém se cadastrar pelo seu link e jogar R$ 100, você ganha R$ 30 em bônus!</li>
                <li>O bônus pode ser usado para jogar, mas não pode ser sacado</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EditPasswordModal({ onClose }: EditPasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      await api.put("/auth/password", {
        currentPassword,
        newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Erro ao atualizar senha:", err);
      setError(err.response?.data?.error || "Erro ao atualizar senha");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Alterar Senha</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="currentPassword">Senha Atual</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Nova Senha</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Digite a nova senha novamente"
              disabled={loading}
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="form-error" style={{ color: "var(--error)", marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {success && (
            <div className="form-success" style={{ color: "var(--success)", marginBottom: "16px" }}>
              Senha alterada com sucesso!
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Alterando..." : "Alterar Senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
