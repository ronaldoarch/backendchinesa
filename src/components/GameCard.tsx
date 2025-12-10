type Props = {
  title: string;
  provider: string;
  gameId?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (gameId: number) => void;
};

export function GameCard({ title, provider, gameId, isFavorite = false, onToggleFavorite }: Props) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (gameId && onToggleFavorite) {
      onToggleFavorite(gameId);
    }
  };

  return (
    <article className="game-card">
      <div className="game-card-thumbnail">
        <div className="game-card-gradient" />
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
            {isFavorite ? "❤️" : "🤍"}
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


