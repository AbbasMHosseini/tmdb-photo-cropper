import { ExternalLink, Film, Image, Search, UserRound } from 'lucide-react';
import { useState } from 'react';
import { lookupTmdbMovie, type TmdbMovieLookupResult } from '../lib/tmdb';

type FilmLookupPanelProps = {
  onLoadDirector: (personId: number, name: string) => void;
};

export function FilmLookupPanel({ onLoadDirector }: FilmLookupPanelProps) {
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<TmdbMovieLookupResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!input.trim()) return;
    setIsSearching(true);
    setError(null);
    const response = await lookupTmdbMovie(input);
    setResults(response.results);
    setError(response.error || null);
    setIsSearching(false);
  }

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Film</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
          placeholder="Film title    Director name"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-400"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300"
        >
          <Search className="h-4 w-4" />
          Find
        </button>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        Example: American Doctor&nbsp;&nbsp; Poh Si Teng
      </p>

      <div className="mt-3 min-h-[300px] rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
        {isSearching && <span>Searching TMDB movies...</span>}
        {!isSearching && error && <span className="text-amber-300">{error}</span>}
        {!isSearching && !error && results.length === 0 && <span>Search by film title and director name to find the movie poster and director.</span>}

        {!isSearching && results.length > 0 && (
          <div className="space-y-3">
            {results.map((movie) => (
              <article
                key={movie.movieId}
                className={`grid grid-cols-[72px_1fr] gap-3 rounded-xl border p-2 ${
                  movie.matchedDirector ? 'border-emerald-700 bg-emerald-950/20' : 'border-slate-800 bg-slate-900/70'
                }`}
              >
                {movie.posterUrl ? (
                  <a href={movie.posterLargeUrl || movie.posterUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={movie.posterUrl}
                      alt={`${movie.title} poster`}
                      className="h-28 w-[72px] rounded-lg object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex h-28 w-[72px] items-center justify-center rounded-lg border border-slate-800 bg-slate-950 text-xl">
                    🎬
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-100">
                        {movie.title}{movie.releaseYear ? ` (${movie.releaseYear})` : ''}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        Director: {movie.directorName || 'Not found'}
                      </p>
                    </div>
                    {movie.matchedDirector && (
                      <span className="rounded-full border border-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                        Match
                      </span>
                    )}
                  </div>

                  {movie.overview && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{movie.overview}</p>}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={movie.tmdbMovieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-300 hover:border-slate-500"
                    >
                      <Film className="h-3.5 w-3.5" />
                      Movie
                    </a>
                    <a
                      href={movie.posterPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-300 hover:border-slate-500"
                    >
                      <Image className="h-3.5 w-3.5" />
                      Posters
                    </a>
                    {movie.posterLargeUrl && (
                      <a
                        href={movie.posterLargeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-300 hover:border-slate-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Image
                      </a>
                    )}
                    {movie.directorPersonId && movie.directorName && (
                      <button
                        type="button"
                        onClick={() => onLoadDirector(movie.directorPersonId!, movie.directorName!)}
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-800/70 bg-sky-950/20 px-2 py-1 text-xs font-semibold text-sky-200 hover:border-sky-600/80"
                      >
                        <UserRound className="h-3.5 w-3.5" />
                        Load Director
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
