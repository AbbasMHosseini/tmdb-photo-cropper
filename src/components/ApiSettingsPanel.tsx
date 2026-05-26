import { Eye, EyeOff, Settings, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearTmdbApiToken, getTmdbApiToken, setTmdbApiToken } from '../lib/tmdb';

type ApiSettingsPanelProps = {
  onTokenChange?: () => void;
};

export function ApiSettingsPanel({ onTokenChange }: ApiSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const savedToken = getTmdbApiToken();
    setHasToken(!!savedToken);
  }, []);

  function handleSave() {
    if (token.trim()) {
      setTmdbApiToken(token);
      setHasToken(true);
      setToken('');
      setIsSaved(true);
      onTokenChange?.();
      window.setTimeout(() => setIsSaved(false), 2000);
    }
  }

  function handleClear() {
    clearTmdbApiToken();
    setHasToken(false);
    setToken('');
    onTokenChange?.();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 shadow-2xl shadow-slate-950/50 transition hover:border-slate-500 hover:bg-slate-800 hover:text-slate-100"
        title="API Settings"
      >
        <Settings className="h-4 w-4" />
        API
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">TMDB API Settings</h2>

            <div className="mb-4 rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-300">
              <p className="mb-2">
                Enter your{' '}
                <a
                  href="https://www.themoviedb.org/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 underline hover:text-sky-300"
                >
                  TMDB API key or Read Access Token
                </a>
                . Your credential is stored only in this browser.
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase text-slate-400">Token or API key</label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSave()}
                  placeholder="Paste your TMDB API credential"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 pr-10 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-400"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {hasToken && (
              <div className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
                API credential is configured
              </div>
            )}

            {isSaved && (
              <div className="mb-4 rounded-lg border border-sky-800 bg-sky-950/30 px-3 py-2 text-sm text-sky-300">
                Saved successfully
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!token.trim()}
                className="flex-1 rounded-lg bg-sky-400 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300 disabled:bg-slate-700 disabled:text-slate-500"
              >
                Save
              </button>
              {hasToken && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                  title="Clear saved credential"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
