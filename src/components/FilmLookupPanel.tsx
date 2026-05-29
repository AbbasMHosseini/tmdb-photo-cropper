import { Check, Copy, ExternalLink, Film, Search, UserRound } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { lookupTmdbMovie, type TmdbMovieLookupResult } from '../lib/tmdb';

type FilmLookupPanelProps = {
  onLoadDirector: (personId: number, name: string) => void;
  onSearchComplete?: (query: string, results: TmdbMovieLookupResult[]) => void;
};

export type FilmLookupPanelHandle = {
  searchFilm: (query: string) => void;
};

export const FilmLookupPanel = forwardRef<FilmLookupPanelHandle, FilmLookupPanelProps>(function FilmLookupPanel(
  { onLoadDirector, onSearchComplete },
  ref,
) {
  const [input, setInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<TmdbMovieLookupResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedMovieId, setCopiedMovieId] = useState<number | null>(null);

  useImperativeHandle(ref, () => ({
    searchFilm: (query: string) => {
      const cleanQuery = query.trim();
      if (!cleanQuery) return;
      setInput(cleanQuery);
      void handleSearch(cleanQuery);
    },
  }));

  async function handleSearch(nextInput = input) {
    if (!nextInput.trim()) return;
    setIsSearching(true);
    setError(null);
    const response = await lookupTmdbMovie(nextInput);
    setResults(response.results);
    setError(response.error || null);
    onSearchComplete?.(nextInput.trim(), response.results);
    setIsSearching(false);
  }

  async function copyMovieUrl(movieId: number, tmdbMovieUrl: string) {
    await navigator.clipboard.writeText(tmdbMovieUrl);
    setCopiedMovieId(movieId);
    window.setTimeout(() => setCopiedMovieId(null), 1500);
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
          onClick={() => handleSearch()}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300"
        >
          <Search className="h-4 w-4" />
          Find
        </button>
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        Examples: American Doctor Poh Si Teng, American Poh Si Teng
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
                        Director: {movie.directors.length > 0 ? movie.directors.map((director) => director.name).join(', ') : 'Not found'}
                      </p>
                    </div>
                    {movie.matchedDirector && (
                      <span className="rounded-full border border-emerald-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                        Match
                      </span>
                    )}
                  </div>

                  {movie.overview && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{movie.overview}</p>}

                  <button
                    type="button"
                    onClick={() => copyMovieUrl(movie.movieId, movie.tmdbMovieUrl)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-700/70 bg-sky-950/30 px-3 py-2 text-sm font-bold text-sky-100 shadow-sm shadow-sky-950/30 hover:border-sky-500 hover:bg-sky-900/40"
                    title="Copy TMDB movie page URL"
                  >
                    {copiedMovieId === movie.movieId ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                    TMDB ID: {movie.movieId}
                  </button>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <a
                      href={movie.tmdbMovieUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-300 hover:border-slate-500"
                    >
                      <Film className="h-3.5 w-3.5" />
                      Film Page
                    </a>
                    {movie.imdbUrl && (
                      <a
                        href={movie.imdbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-300 hover:border-slate-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        IMDb
                      </a>
                    )}
                  </div>

                  {movie.directors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {movie.directors.map((director, index) => (
                        <button
                          key={director.id}
                          type="button"
                          onClick={() => onLoadDirector(director.id, director.name)}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${
                            director.matched
                              ? 'border-sky-700 bg-sky-950/30 text-sky-200 hover:border-sky-500'
                              : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          <UserRound className="h-3.5 w-3.5" />
                          Load Director {movie.directors.length > 1 ? index + 1 : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});
