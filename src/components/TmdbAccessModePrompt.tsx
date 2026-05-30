import { useEffect, useState } from 'react';
import { setTmdbAccessMode, type TmdbAccessMode } from '../lib/tmdb';

type TmdbAccessModePromptProps = {
  onModeSelected?: (mode: TmdbAccessMode) => void;
};

export function TmdbAccessModePrompt({ onModeSelected }: TmdbAccessModePromptProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('tmdb_access_mode');
    if (!savedMode) setIsOpen(true);
  }, []);

  function chooseMode(mode: TmdbAccessMode) {
    setTmdbAccessMode(mode);
    setIsOpen(false);
    onModeSelected?.(mode);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl shadow-slate-950/60">
        <div className="mb-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">TMDB Access</div>
          <h2 className="text-lg font-semibold text-slate-100">Are you in Iran or outside Iran?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            TMDB may not open from Iran. Choose proxy mode if you are in Iran. You can change this later from the API settings.
          </p>
        </div>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => chooseMode('proxy')}
            className="rounded-xl border border-sky-700 bg-sky-950/40 px-4 py-3 text-left text-sm font-semibold text-sky-100 hover:border-sky-500 hover:bg-sky-900/50"
          >
            I am in Iran, use proxy
            <span className="mt-1 block text-xs font-normal text-sky-300/80">Uses the nnapub.com Cloudflare Worker route.</span>
          </button>

          <button
            type="button"
            onClick={() => chooseMode('direct')}
            className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-200 hover:border-slate-500 hover:bg-slate-800"
          >
            I am outside Iran, use direct TMDB
            <span className="mt-1 block text-xs font-normal text-slate-500">Uses api.themoviedb.org and image.tmdb.org directly.</span>
          </button>
        </div>
      </div>
    </div>
  );
}
