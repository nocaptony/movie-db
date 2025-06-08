import { useState, useEffect } from "react";
import { MovieCard } from "./components/MovieCard";
import "./App.css";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  release_date: string;
  media_type?: string;
}

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);

  const fetchSameDayReleases = async () => {
  const today = new Date();
  const monthDay = today.toISOString().slice(5, 10); // "MM-DD"

  const cached = localStorage.getItem("day_releases");
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed.date === monthDay) {
      setMovies(parsed.movies);
      return;
    }
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&primary_release_date.gte=1950-01-01&primary_release_date.lte=${today.toISOString().split("T")[0]}&sort_by=release_date.desc&page=1`
    );

    const data = await res.json();

    const filteredMovies = (data.results || [])
      .filter((movie: Movie) => {
        // Must have a poster
        if (!movie.poster_path) return false;
        // Must have a description
        if (!movie.overview) return false;

        // Must not be a PPV or event
        const title = movie.title.toLowerCase();
        const blocklist = ["ufc", "wwe", "mma", "boxing", "ppv", "wrestling"];
        if (blocklist.some(term => title.includes(term))) return false;

        // Check if release_date ends with today's MM-DD
        return movie.release_date?.slice(5) === monthDay;
      });

    localStorage.setItem("day_releases", JSON.stringify({ date: monthDay, movies: filteredMovies }));
    setMovies(filteredMovies);
  } catch (err) {
    console.error("Error fetching same-day movie releases:", err);
  }
};

  useEffect(() => {
    fetchSameDayReleases();
  }, []);

  const todayStr = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric"
  });

  return (
    <div className="App">
      <h1>🎬 Movies Released on This Day ({todayStr})</h1>
      <div className="results">
        {movies.length === 0 ? (
          <p>No movies released today match your criteria.</p>
        ) : (
          movies.map((movie) => (
            <MovieCard
              key={movie.id}
              title={movie.title}
              overview={movie.overview}
              posterPath={movie.poster_path}
            />
          ))
        )}
      </div>
      <div className="results">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            title={movie.title}
            overview={movie.overview}
            posterPath={movie.poster_path}
          />
        ))}
      </div>
    </div>
  );
}

export default App;