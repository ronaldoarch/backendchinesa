import React from "react";
import { useNavigate } from "react-router-dom";
import { HeartIcon } from "./Icons";

type Props = {
  title: string;
  provider: string;
  gameId?: number;
  imageUrl?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (gameId: number) => void;
};

export function GameCard({ title, provider, gameId, imageUrl, isFavorite = false, onToggleFavorite }: Props) {
  const navigate = useNavigate();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameId && onToggleFavorite) {
      onToggleFavorite(gameId);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!gameId) return;

    // Navegar para a página do jogo
    // A autenticação será verificada pela rota protegida e pelo GamePage
    navigate(`/jogo/${gameId}`);
  };

  return (
    <article 
      className="game-card"
      onClick={handlePlayClick}
      style={{ cursor: gameId ? "pointer" : "default" }}
    >
      <div className="game-card-thumbnail" style={{ position: "relative" }}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
              borderRadius: "8px",
              zIndex: 1,
              background: "linear-gradient(135deg, #ff8c3a, #ffd06b)"
            }}
            onError={(e) => {
              // Se a imagem falhar ao carregar, esconder e mostrar o gradiente
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {/* Gradiente de fundo (sempre presente, mas atrás da imagem) */}
        <div className="game-card-gradient" style={{ zIndex: imageUrl ? 0 : 1 }} />
        <span className="game-card-badge">HOT</span>
        {gameId && onToggleFavorite && (
          <button
            onClick={handleFavoriteClick}
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              background: "rgba(0, 0, 0, 0.6)",
              border: "none",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: isFavorite ? "#ff6b6b" : "#fff",
              fontSize: "16px",
              zIndex: 10
            }}
            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <HeartIcon size={16} color={isFavorite ? "#ff6b6b" : "#fff"} filled={isFavorite} />
          </button>
        )}
      </div>
      <div className="game-card-info">
        <h3>{title}</h3>
        <span>{provider}</span>
      </div>
    </article>
  );
}


