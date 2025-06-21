import { useState, useEffect } from "react";
import { MovieCard } from "./components/MovieCard";
import "./App.css";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

interface CastMember {
  cast_id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

type Tab = "home" | "search" | "about";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieCast, setMovieCast] = useState<CastMember[]>([]);
  const [loadingCast, setLoadingCast] = useState(false);

  const handleSearch = async () => {
    if (!query) return;

    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setMovies(data.results || []);
  };

  const fetchTopRatedByYear = async (year: number) => {
    try {
      const allMovies: Movie[] = [];

      for (let page = 1; page <= 3; page++) {
        const res = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY
          }&primary_release_year=${year}&sort_by=vote_average.desc&vote_count.gte=100&region=US&with_original_language=en&without_genres=99&page=${page}`
        );
        const data = await res.json();

        const filtered = (data.results || []).filter(
          (movie: Movie) => movie.poster_path && movie.overview
        );

        allMovies.push(...filtered);
      }

      setTopMovies(allMovies);
    } catch (err) {
      console.error(`Failed to fetch top-rated movies of ${year}:`, err);
    }
  };

  const fetchMovieCast = async (movieId: number) => {
    setLoadingCast(true);
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
      );
      const data = await res.json();
      setMovieCast(data.cast.slice(0, 12));
    } catch (err) {
      console.error("Failed to fetch movie cast:", err);
      setMovieCast([]);
    } finally {
      setLoadingCast(false);
    }
  };

  useEffect(() => {
    fetchTopRatedByYear(selectedYear);
  }, [selectedYear]);

  const renderYearDropdown = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1940; y--) {
      years.push(y);
    }

    return (
      <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    );
  };

  const closeModal = () => setSelectedMovie(null);

  const renderModal = () => {
    if (!selectedMovie) return null;

    const imageUrl = selectedMovie.poster_path
      ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
      : "https://via.placeholder.com/500x750?text=No+Image";

    return (
      <>
        <div className="modal-overlay" onClick={closeModal}></div>
        <div className="modal-content">
          <button className="modal-close" onClick={closeModal}>
            &times;
          </button>
          <img className="modal-movie-poster" src={imageUrl} alt={selectedMovie.title} />
          <h2>{selectedMovie.title}</h2>
          <p><strong>Release Date:</strong> {selectedMovie.release_date}</p>
          <p><strong>Rating:</strong> {selectedMovie.vote_average}</p>
          <p>{selectedMovie.overview}</p>

          <h3>Cast</h3>
          {loadingCast ? (
            <p>Loading cast...</p>
          ) : movieCast.length > 0 ? (
            <div className="cast-list">
              {movieCast.map((cast) => {
                const profileUrl = cast.profile_path
                  ? `https://image.tmdb.org/t/p/w92${cast.profile_path}`
                  : "https://via.placeholder.com/92x138?text=No+Image";

                return (
                  <div key={cast.cast_id} className="cast-member">
                    <img className="cast-member-img" src={profileUrl} alt={cast.name} />
                    <p><strong>{cast.name}</strong></p>
                    <p className="character">{cast.character}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No cast information available.</p>
          )}
        </div>
      </>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <>
            <div className="year-filter">
              <p>🏆 Top-Rated Movies of {selectedYear}:</p>
              {renderYearDropdown()}
            </div>
            <div className="results">
              {topMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  title={movie.title}
                  overview={movie.overview}
                  posterPath={movie.poster_path}
                  onClick={() => {
                    setSelectedMovie(movie);
                    fetchMovieCast(movie.id);
                  }}
                />
              ))}
            </div>
          </>
        );

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
                  onClick={() => setSelectedMovie(movie)}
                />
              ))}
            </div>
          </>
        );

      case "about":
        return (
          <div className="results">
            <h2>About</h2>
            <p>
              TMDB (Tony's Movie Database) is an app created out of my love for
              movies. Powered by the amazing TMDB API.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="App">
      <h1>🎬 TMDB Movie App</h1>
      <nav className="navbar">
        <button onClick={() => setActiveTab("home")}>🏠 Home</button>
        <button onClick={() => setActiveTab("search")}>🔍 Search</button>
        <button onClick={() => setActiveTab("about")}>ℹ️ About</button>
      </nav>

      <div className="tab-content">{renderTabContent()}</div>

      {renderModal()}
    </div>
  );
}

export default App;