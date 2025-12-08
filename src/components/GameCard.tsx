type Props = {
  title: string;
  provider: string;
};

export function GameCard({ title, provider }: Props) {
  return (
    <article className="game-card">
      <div className="game-card-thumbnail">
        <div className="game-card-gradient" />
        <span className="game-card-badge">HOT</span>
      </div>
      <div className="game-card-info">
        <h3>{title}</h3>
        <span>{provider}</span>
      </div>
    </article>
  );
}


