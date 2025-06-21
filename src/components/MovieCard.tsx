import React from "react";
import "./MovieCard.css";

interface MovieCardProps {
  title: string;
  overview: string;
  posterPath: string | null;
  onClick?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ title, overview, posterPath, onClick }) => {
  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w300${posterPath}`
    : "https://via.placeholder.com/300x450?text=No+Image";

  return (
    <div className="movie-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <img src={imageUrl} alt={title} />
      <h3>{title}</h3>
      <p>{overview ? overview.slice(0, 100) + "..." : "No description available."}</p>
    </div>
  );
};