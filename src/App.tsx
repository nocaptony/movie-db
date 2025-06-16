import { useState } from "react";
import { MovieCard } from "./components/MovieCard";
import "./App.css";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
}

type Tab = "home" | "search" | "favorites" | "about";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);

  const handleSearch = async () => {
    if (!query) return;

    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setMovies(data.results || []);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return <p>🎉 Welcome to TMDB Viewer! Click a tab to get started.</p>;

      case "search":
        return (
          <>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Enter movie title..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <button onClick={handleSearch}>Search</button>
            </div>

            <div className="results">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  title={movie.title}
                  overview={movie.overview}
                  posterPath={movie.poster_path}
                >

                </MovieCard>
              ))}
            </div>
          </>
        );

      case "about":
        return (
          <div>
            <h2>About</h2>
            <p>This app uses the TMDB API to search and list movies.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      <nav className="navbar">
        <button onClick={() => setActiveTab("home")}>🏠 Home</button>
        <button onClick={() => setActiveTab("search")}>🔍 Search</button>
        <button onClick={() => setActiveTab("about")}>ℹ️ About</button>
      </nav>

      <h1>🎬 TMDB Movie App</h1>
      <div className="tab-content">{renderTabContent()}</div>
    </div>
  );
}

export default App;