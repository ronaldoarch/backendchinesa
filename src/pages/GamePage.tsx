import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export function GamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("ID do jogo não fornecido");
      setLoading(false);
      return;
    }

    // A autenticação já foi verificada pelo ProtectedRoute
    // Mas verificamos novamente aqui para garantir que o token ainda é válido
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Sessão expirada. Por favor, faça login novamente.");
      setLoading(false);
      setTimeout(() => navigate("/"), 2000);
      return;
    }

    // Lançar jogo
    void (async () => {
      try {
        setLoading(true);
        const response = await api.post<{ url: string }>(`/games/${id}/launch`);
        if (response.data?.url) {
          setGameUrl(response.data.url);
        } else {
          setError("URL do jogo não retornada pela API");
        }
      } catch (error: any) {
        console.error("Erro ao lançar jogo:", error);
        
        // Tratar erros específicos
        if (error.response?.status === 403) {
          const errorMsg = error.response?.data?.message || error.response?.data?.error || "Saldo insuficiente. Faça um depósito primeiro.";
          setError(errorMsg);
        } else if (error.response?.status === 401) {
          setError("Sessão expirada. Por favor, faça login novamente.");
          setTimeout(() => navigate("/"), 2000);
        } else if (error.response?.status === 404) {
          setError("Jogo não encontrado.");
        } else {
          const errorMsg = error.response?.data?.error || error.response?.data?.message || "Erro ao abrir o jogo. Tente novamente.";
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "16px",
        background: "var(--bg-primary)"
      }}>
        <div style={{ fontSize: "18px", color: "var(--gold)" }}>Carregando jogo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "16px",
        background: "var(--bg-primary)",
        padding: "20px"
      }}>
        <div style={{ fontSize: "18px", color: "#ff6b6b", textAlign: "center" }}>{error}</div>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            background: "var(--gold)",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  if (!gameUrl) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "16px",
        background: "var(--bg-primary)"
      }}>
        <div style={{ fontSize: "18px", color: "#ff6b6b" }}>Erro: URL do jogo não disponível</div>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            background: "var(--gold)",
            color: "#000",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "#000",
      zIndex: 9999
    }}>
      {/* Botão de fechar */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 10000,
          background: "rgba(0, 0, 0, 0.7)",
          color: "#fff",
          border: "2px solid var(--gold)",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >
        ✕ Fechar
      </button>

      {/* Iframe do jogo */}
      <iframe
        src={gameUrl}
        style={{
          width: "100%",
          height: "100%",
          border: "none"
        }}
        title="Jogo"
        allow="fullscreen; autoplay; payment"
        allowFullScreen
      />
    </div>
  );
}
