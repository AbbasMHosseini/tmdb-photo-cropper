import { useEffect, useRef, useState } from 'react';
import { Film } from 'lucide-react';
import { ApiSettingsPanel } from './components/ApiSettingsPanel';
import { CropCanvas, type CropCanvasHandle } from './components/CropCanvas';
import { ExportControls } from './components/ExportControls';
import { FilmLookupPanel } from './components/FilmLookupPanel';
import { ImageDropzone } from './components/ImageDropzone';
import { PersonCheckPanel, type PersonCheckPanelHandle } from './components/PersonCheckPanel';
import { SearchHistoryPanel } from './components/SearchHistoryPanel';
import { downloadCanvasAsJpg, EXPORT_SIZES, safeFilename, type ExportSize } from './lib/imageExport';
import { clearPersonSearchHistory, loadPersonSearchHistory, savePersonSearchToHistory, type PersonSearchHistoryItem } from './lib/searchHistory';
import { buildTmdbPersonInput, buildTmdbPersonUrl, type TmdbPersonPhotoCheck } from './lib/tmdb';

export default function App() {
  const cropCanvasRef = useRef<CropCanvasHandle | null>(null);
  const personCheckRef = useRef<PersonCheckPanelHandle | null>(null);
  const hasHandledInitialRouteRef = useRef(false);
  const [lookupMode, setLookupMode] = useState<'person' | 'film'>('person');
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tmdb_cropper_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (hasHandledInitialRouteRef.current) return;
    if (!personCheckRef.current) return;

    const routeInput = getPersonInputFromUrl();
    if (!routeInput) return;

    hasHandledInitialRouteRef.current = true;
    setLookupMode('person');
    personCheckRef.current.searchPerson(routeInput, false);
  }, [tokenRefreshKey]);

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
    personCheckRef.current?.loadCachedPerson(item);

    if (item.personId) {
      window.history.replaceState(null, '', getAppUrlPath(item.personId, item.name));
    }
  }

  function handleLoadDirector(personId: number, name: string) {
    setLookupMode('person');
    setPersonName(name);
    setTmdbPersonId(personId);
    window.history.replaceState(null, '', getAppUrlPath(personId, name));
    personCheckRef.current?.searchPerson(buildTmdbPersonUrl(personId, name), false);
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
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 fill-current text-sky-300"
            >
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
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                lookupMode === 'person' ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Person
            </button>
            <button
              type="button"
              onClick={() => setLookupMode('film')}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                lookupMode === 'film' ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Film
            </button>
          </div>

          <PersonCheckPanel
            key={tokenRefreshKey}
            ref={personCheckRef}
            onPersonResolved={setPersonName}
            onCheckComplete={handleCheckComplete}
          />

          {lookupMode === 'film' && <FilmLookupPanel onLoadDirector={handleLoadDirector} />}

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

      <div className="mx-auto mt-5 max-w-6xl">
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

function getPersonInputFromUrl() {
  const redirectedPath = sessionStorage.getItem('tmdb_cropper_redirect_path');
  if (redirectedPath) {
    sessionStorage.removeItem('tmdb_cropper_redirect_path');
    window.history.replaceState(null, '', redirectedPath);
  }

  const basePath = '/tmdb-photo-cropper';
  const path = redirectedPath ? redirectedPath.split(/[?#]/)[0] : window.location.pathname;
  const routePart = path.startsWith(basePath) ? path.slice(basePath.length) : path;
  const cleanRoute = decodeURIComponent(routePart).replace(/^\/+|\/+$/g, '');

  if (!cleanRoute || cleanRoute === 'index.html') return null;
  return buildTmdbPersonInput(cleanRoute);
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
