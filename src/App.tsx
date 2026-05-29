import { useEffect, useRef, useState } from 'react';
import { Film, Trash2 } from 'lucide-react';
import { ApiSettingsPanel } from './components/ApiSettingsPanel';
import { CropCanvas, type CropCanvasHandle } from './components/CropCanvas';
import { ExportControls } from './components/ExportControls';
import { FilmLookupPanel, type FilmLookupPanelHandle } from './components/FilmLookupPanel';
import { ImageDropzone } from './components/ImageDropzone';
import { PersonCheckPanel, type PersonCheckPanelHandle } from './components/PersonCheckPanel';
import { SearchHistoryPanel } from './components/SearchHistoryPanel';
import { downloadCanvasAsJpg, EXPORT_SIZES, safeFilename, type ExportSize } from './lib/imageExport';
import { clearPersonSearchHistory, loadPersonSearchHistory, savePersonSearchToHistory, type PersonSearchHistoryItem } from './lib/searchHistory';
import { buildTmdbPersonInput, buildTmdbPersonUrl, type TmdbMovieLookupResult, type TmdbPersonPhotoCheck } from './lib/tmdb';

type FilmHistoryItem = {
  id: string;
  query: string;
  title: string;
  movieId: number;
  posterUrl?: string;
  releaseYear?: string;
  directorNames: string;
  searchedAt: number;
};

const FILM_HISTORY_KEY = 'tmdb_movie_search_history';

export default function App() {
  const cropCanvasRef = useRef<CropCanvasHandle | null>(null);
  const personCheckRef = useRef<PersonCheckPanelHandle | null>(null);
  const filmLookupRef = useRef<FilmLookupPanelHandle | null>(null);
  const hasHandledInitialRouteRef = useRef(false);
  const [lookupMode, setLookupMode] = useState<'person' | 'film'>('person');
  const [pendingPersonInput, setPendingPersonInput] = useState<string | null>(null);
  const [pendingFilmQuery, setPendingFilmQuery] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [personName, setPersonName] = useState('person');
  const [tmdbPersonId, setTmdbPersonId] = useState<number | undefined>();
  const [sourceFileName, setSourceFileName] = useState<string | undefined>();
  const [zoom, setZoom] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ExportSize>(EXPORT_SIZES[1]);
  const [canExport, setCanExport] = useState(false);
  const [tokenRefreshKey, setTokenRefreshKey] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('tmdb_cropper_theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });
  const [history, setHistory] = useState<PersonSearchHistoryItem[]>(() => loadPersonSearchHistory());
  const [filmHistory, setFilmHistory] = useState<FilmHistoryItem[]>(() => loadFilmHistory());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tmdb_cropper_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (hasHandledInitialRouteRef.current) return;
    const initialSearch = getInitialSearchFromUrl();
    if (!initialSearch) return;

    hasHandledInitialRouteRef.current = true;
    setLookupMode(initialSearch.mode);
    if (initialSearch.mode === 'film') {
      setPendingFilmQuery(initialSearch.input);
    } else {
      setPendingPersonInput(initialSearch.input);
    }
  }, [tokenRefreshKey]);

  useEffect(() => {
    if (lookupMode !== 'person' || !pendingPersonInput || !personCheckRef.current) return;
    personCheckRef.current.searchPerson(pendingPersonInput, false);
    setPendingPersonInput(null);
  }, [lookupMode, pendingPersonInput]);

  useEffect(() => {
    if (lookupMode !== 'film' || !pendingFilmQuery || !filmLookupRef.current) return;
    filmLookupRef.current.searchFilm(pendingFilmQuery);
    setPendingFilmQuery(null);
  }, [lookupMode, pendingFilmQuery]);

  function handleExport() {
    const canvas = cropCanvasRef.current?.renderToCanvas();
    if (!canvas) return;
    const baseName = personName || sourceFileName?.replace(/\.[^.]+$/, '') || 'person';
    downloadCanvasAsJpg(canvas, safeFilename(baseName));
  }

  function handleReset() {
    setZoom(1);
  }

  function handleCheckComplete(result: TmdbPersonPhotoCheck, fallbackName: string) {
    setTmdbPersonId(result.personId);
    setHistory(savePersonSearchToHistory(result, fallbackName));

    if (result.personId && result.name) {
      window.history.replaceState(null, '', getAppUrlPath(result.personId, result.name));
    }
  }

  function handleHistorySelect(item: PersonSearchHistoryItem) {
    setLookupMode('person');
    setPersonName(item.name);
    setTmdbPersonId(item.personId);
    setPendingPersonInput(null);
    window.setTimeout(() => personCheckRef.current?.loadCachedPerson(item), 0);

    if (item.personId) {
      window.history.replaceState(null, '', getAppUrlPath(item.personId, item.name));
    }
  }

  function handleFilmHistorySelect(item: FilmHistoryItem) {
    setLookupMode('film');
    setPendingFilmQuery(item.query);
    window.history.replaceState(null, '', `/tmdb-photo-cropper/?${encodeURIComponent(item.query).replace(/%20/g, '+')}`);
  }

  function handleLoadDirector(personId: number, name: string) {
    setLookupMode('person');
    setPersonName(name);
    setTmdbPersonId(personId);
    setPendingPersonInput(buildTmdbPersonUrl(personId, name));
    window.history.replaceState(null, '', getAppUrlPath(personId, name));
  }

  function handleFilmSearchComplete(query: string, results: TmdbMovieLookupResult[]) {
    setFilmHistory(saveFilmHistory(query, results));
    window.history.replaceState(null, '', `/tmdb-photo-cropper/?${encodeURIComponent(query).replace(/%20/g, '+')}`);
  }

  return (
    <main className="min-h-screen px-4 py-4 text-slate-100 sm:px-6 lg:px-8">
      <header className="mx-auto mb-5 flex max-w-6xl items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400 text-slate-950">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">TMDB Photo Cropper</h1>
            <p className="text-xs text-slate-400">2:3 person profile image tool</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
            className="hidden rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100 sm:inline-flex"
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <a
            href="https://github.com/AbbasMHosseini/tmdb-photo-cropper"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100 sm:flex"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current text-sky-300">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56v-2.02c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .98-.31 3.18 1.18A11.1 11.1 0 0 1 12 6.22c.98 0 1.97.13 2.89.38 2.2-1.49 3.17-1.18 3.17-1.18.64 1.58.24 2.75.12 3.04.74.8 1.18 1.83 1.18 3.08 0 4.42-2.69 5.38-5.25 5.67.42.36.78 1.07.78 2.16v3.02c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            Contribute
          </a>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-2">
            <button
              type="button"
              onClick={() => setLookupMode('person')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${lookupMode === 'person' ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
            >
              Person
            </button>
            <button
              type="button"
              onClick={() => setLookupMode('film')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${lookupMode === 'film' ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
            >
              Film
            </button>
          </div>

          {lookupMode === 'person' && (
            <PersonCheckPanel
              key={tokenRefreshKey}
              ref={personCheckRef}
              onPersonResolved={setPersonName}
              onCheckComplete={handleCheckComplete}
            />
          )}

          {lookupMode === 'film' && (
            <FilmLookupPanel ref={filmLookupRef} onLoadDirector={handleLoadDirector} onSearchComplete={handleFilmSearchComplete} />
          )}

          <ImageDropzone
            onImageSelected={(source, fileName) => {
              setImageSource(source);
              setSourceFileName(fileName);
              setCanExport(false);
            }}
          />
        </aside>

        <section className="space-y-5">
          <CropCanvas
            ref={cropCanvasRef}
            imageSource={imageSource}
            exportSize={selectedSize}
            zoom={zoom}
            onZoomChange={setZoom}
            onReadyChange={setCanExport}
            onReset={handleReset}
          />
          <ExportControls
            zoom={zoom}
            selectedSize={selectedSize}
            canExport={canExport}
            tmdbPersonId={tmdbPersonId}
            tmdbPersonName={personName}
            onZoomChange={setZoom}
            onSizeChange={setSelectedSize}
            onExport={handleExport}
          />
        </section>
      </div>

      <div className="mx-auto mt-5 max-w-6xl space-y-5">
        {filmHistory.length > 0 && (
          <FilmHistoryPanel items={filmHistory} onSelect={handleFilmHistorySelect} onClear={() => setFilmHistory(clearFilmHistory())} />
        )}
        <SearchHistoryPanel
          items={history}
          onSelect={handleHistorySelect}
          onClear={() => setHistory(clearPersonSearchHistory())}
        />
      </div>

      <ApiSettingsPanel onTokenChange={() => setTokenRefreshKey((current) => current + 1)} />
    </main>
  );
}

function FilmHistoryPanel({ items, onSelect, onClear }: { items: FilmHistoryItem[]; onSelect: (item: FilmHistoryItem) => void; onClear: () => void }) {
  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recent film searches</div>
          <p className="mt-1 text-xs text-slate-500">Last checked TMDB movies</p>
        </div>
        <button type="button" onClick={onClear} className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 hover:text-slate-100" title="Clear film history">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {items.map((item) => (
          <button key={item.id} type="button" onClick={() => onSelect(item)} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-left hover:border-slate-600">
            {item.posterUrl ? <img src={item.posterUrl} alt={`${item.title} poster`} className="h-12 w-8 flex-none rounded-lg object-cover" /> : <div className="flex h-12 w-8 flex-none items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-base">🎬</div>}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-100">{item.title}{item.releaseYear ? ` (${item.releaseYear})` : ''}</div>
              <div className="mt-0.5 truncate text-[11px] text-slate-500">{item.directorNames || item.query}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function getInitialSearchFromUrl(): { mode: 'person' | 'film'; input: string } | null {
  const redirectedPath = sessionStorage.getItem('tmdb_cropper_redirect_path');
  if (redirectedPath) {
    sessionStorage.removeItem('tmdb_cropper_redirect_path');
    window.history.replaceState(null, '', redirectedPath);
  }

  const searchText = getFilmQueryFromSearch(window.location.search);
  if (searchText) return { mode: 'film', input: searchText };

  const basePath = '/tmdb-photo-cropper';
  const path = redirectedPath ? redirectedPath.split(/[?#]/)[0] : window.location.pathname;
  const routePart = path.startsWith(basePath) ? path.slice(basePath.length) : path;
  const cleanRoute = decodeURIComponent(routePart).replace(/^\/+|\/+$/g, '');

  if (!cleanRoute || cleanRoute === 'index.html') return null;
  return { mode: 'person', input: buildTmdbPersonInput(cleanRoute) };
}

function getFilmQueryFromSearch(search: string) {
  if (!search || search === '?') return null;
  const raw = search.slice(1);
  const params = new URLSearchParams(search);
  const namedValue = params.get('film') || params.get('movie') || params.get('q') || params.get('search');
  if (namedValue) return namedValue.trim();
  if (!raw.includes('=')) return decodeURIComponent(raw.replace(/\+/g, ' ')).trim();
  return null;
}

function saveFilmHistory(query: string, results: TmdbMovieLookupResult[]) {
  const firstResult = results[0];
  if (!firstResult) return loadFilmHistory();

  const nextItem: FilmHistoryItem = {
    id: String(firstResult.movieId),
    query,
    title: firstResult.title,
    movieId: firstResult.movieId,
    posterUrl: firstResult.posterUrl,
    releaseYear: firstResult.releaseYear,
    directorNames: firstResult.directors.map((director) => director.name).join(', '),
    searchedAt: Date.now(),
  };

  const existing = loadFilmHistory().filter((item) => item.movieId !== nextItem.movieId);
  const nextHistory = [nextItem, ...existing].slice(0, 18);
  localStorage.setItem(FILM_HISTORY_KEY, JSON.stringify(nextHistory));
  return nextHistory;
}

function loadFilmHistory(): FilmHistoryItem[] {
  try {
    const raw = localStorage.getItem(FILM_HISTORY_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function clearFilmHistory() {
  localStorage.removeItem(FILM_HISTORY_KEY);
  return [];
}

function getAppUrlPath(personId: number, name: string) {
  return `/tmdb-photo-cropper/${personId}-${toUrlSlug(name)}`;
}

function toUrlSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
