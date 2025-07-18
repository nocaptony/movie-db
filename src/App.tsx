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

type Tab = "home" | "trending" | "search" | "random" | "about";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieCast, setMovieCast] = useState<CastMember[]>([]);
  const [loadingCast, setLoadingCast] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | "">("");
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [randomMovieCount, setRandomMovieCount] = useState<number>(1);
  const [randomMovies, setRandomMovies] = useState<Movie[]>([]);
  const [trendingPeriod, setTrendingPeriod] = useState<"day" | "week">("day");
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);

  const fetchMovies = async (url: string) => {
    const res = await fetch(url);
    const data = await res.json();
    return (data.results || []).filter((movie: Movie) =>
      movie.poster_path && movie.overview && movie.vote_average > 0 && movie.vote_average <= 10
    );
  };

  const handleSearch = async () => {
    if (!query) return;
    setHasSearched(true);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const filtered = await fetchMovies(url);
    setMovies(filtered);
  };

  const fetchTopRatedByYear = async (year: number, genreId?: number) => {
    try {
      const allMovies: Movie[] = [];
      let baseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&primary_release_year=${year}&sort_by=vote_average.desc&vote_count.gte=100&region=US&without_genres=99`;

      if (genreId) {
        baseUrl += `&with_genres=${genreId}`;
      }

      for (let page = 1; page <= 3; page++) {
        const filtered = await fetchMovies(`${baseUrl}&page=${page}`);
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
      const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`);
      const data = await res.json();
      setMovieCast((data.cast || []).slice(0, 12));
    } catch (err) {
      console.error("Failed to fetch movie cast:", err);
      setMovieCast([]);
    } finally {
      setLoadingCast(false);
    }
  };

  useEffect(() => {
    fetchTopRatedByYear(selectedYear, selectedGenre || undefined);
  }, [selectedYear, selectedGenre]);

  const renderYearDropdown = () => (
    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
      {Array.from({ length: new Date().getFullYear() - 1939 }, (_, i) => (
        <option key={i} value={new Date().getFullYear() - i}>
          {new Date().getFullYear() - i}
        </option>
      ))}
    </select>
  );

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        );
        const data = await res.json();
        setGenres(data.genres || []);
      } catch (err) {
        console.error("Failed to fetch genres:", err);
      }
    };

    fetchGenres();
  }, []);

  const renderMovieGenre = () => (
    <select value={selectedGenre} onChange={(e) => setSelectedGenre(Number(e.target.value))}>
      <option value="">All Genres</option>
      {genres.map((genre) => (
        <option key={genre.id} value={genre.id}>
          {genre.name}
        </option>
      ))}
    </select>
  );

  const fetchRandomMovies = async (count: number) => {
    try {
      const movies: Movie[] = [];

      while (movies.length < count) {
        const randomPage = Math.floor(Math.random() * 50) + 1;
        const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}&page=${randomPage}`);
        const data = await res.json();

        const valid = data.results.filter(
          (m: Movie) =>
            m.poster_path && m.overview && m.vote_average > 0 && m.vote_average <= 10
        );

        while (valid.length > 0 && movies.length < count) {
          const index = Math.floor(Math.random() * valid.length);
          const selected = valid.splice(index, 1)[0];
          movies.push(selected);
        }
      }

      setRandomMovies(movies);
    } catch (err) {
      console.error("Failed to fetch random movies:", err);
      setRandomMovies([]);
    }
  };

  const fetchTrendingMovies = async (period: "day" | "week" = "day") => {
    try {
      const url = `https://api.themoviedb.org/3/trending/movie/${period}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`;
      const filtered = await fetchMovies(url);
      setTrendingMovies(filtered);
    } catch (err) {
      console.error(`Failed to fetch trending (${period}) movies:`, err);
      setTrendingMovies([]);
    }
  }

  useEffect(() => {
    if (activeTab === "trending") {
      fetchTrendingMovies(trendingPeriod);
    }
  }, [activeTab, trendingPeriod]);

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
          <button className="modal-close" onClick={closeModal}>&times;</button>
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
    if (activeTab === "home") {
      return (
        <>
          <div>
            <p>
              Top-Rated Movies of {renderYearDropdown()} &nbsp;|&nbsp; Genre: {renderMovieGenre()}
            </p>
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
    }

    if (activeTab === "trending") {
      return (
        <div className="trending-movies">
          <div>
            <p>Trending Movies: &nbsp;
              <select
                id="trending-period"
                value={trendingPeriod}
                onChange={(e) => setTrendingPeriod(e.target.value as "day" | "week")}
              >
                <option value="day">Today</option>
                <option value="week">This Week</option>
              </select>
            </p>

          </div>

          <div className="results">
            {trendingMovies.length > 0 ? (
              trendingMovies.map((movie) => (
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
              ))
            ) : (
              <p>Loading trending movies...</p>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "search") {
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
            {movies.length > 0 ? (
              movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  title={movie.title}
                  overview={movie.overview}
                  posterPath={movie.poster_path}
                  onClick={() => setSelectedMovie(movie)}
                />
              ))
            ) : hasSearched ? (
              <div className="text-center">
                <p>No movies found. Try a different search.</p>
              </div>
            ) : null}
          </div>
        </>
      );
    }

    if (activeTab === "random") {
      return (
        <div className="random-movie">
          <div>
            <label htmlFor="movie-count">Number of movies: </label>
            <select
              id="movie-count"
              value={randomMovieCount}
              onChange={(e) => setRandomMovieCount(Number(e.target.value))}
            >
              {Array.from({ length: 14 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <button onClick={() => fetchRandomMovies(randomMovieCount)} style={{ marginLeft: "1rem" }}>
              Generate
            </button>
          </div>
          {randomMovies.length > 0 ? (
            <div className="results">
              {randomMovies.map((movie) => (
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
          ) : (
            <p>Click "Generate" to get random movies!</p>
          )}
        </div>
      );
    }

    if (activeTab === "about") {
      return (
        <div>
          <h2>About</h2>
          <p>
            TMDB (Tony's Movie Database) is an app created out of my love for
            movies. Powered by the amazing TMDB API.
          </p>
          <p>
            <img className="image-size" src="/tmdb.png" alt="Description" />
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="App">
      <img src="/tmdb-c.png" alt="Tony's Movie Database Logo" className="app-logo" />
      <nav className="navbar-default">
        <button onClick={() => setActiveTab("home")}>Home</button>
        <button onClick={() => setActiveTab("trending")}>Trending</button>
        <button onClick={() => setActiveTab("search")}>Search</button>
        <button onClick={() => setActiveTab("random")}>Random Movie</button>
        <button onClick={() => setActiveTab("about")}>About</button>
      </nav>
      <div>{renderTabContent()}</div>
      {renderModal()}
    </div>
  );
}

export default App;
