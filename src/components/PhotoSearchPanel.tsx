import { ExternalLink } from 'lucide-react';

interface PhotoSearchPanelProps {
  personName: string | null;
}

function openImageSearch(engine: 'google' | 'bing', personName: string) {
  const query = `${personName} photos`;
  const url =
    engine === 'google'
      ? `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`
      : `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;

  window.open(url, '_blank', 'noopener,noreferrer');
}

function GoogleIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950 shadow-sm">
      G
    </span>
  );
}

function BingIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-300 text-sm font-bold text-slate-950 shadow-sm">
      b
    </span>
  );
}

export function PhotoSearchPanel({ personName }: PhotoSearchPanelProps) {
  const searchName = (personName || 'person').trim();

  return (
    <div className="flex h-28 min-w-[170px] flex-col justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/50 p-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Find photos</div>

      <button
        type="button"
        onClick={() => openImageSearch('google', searchName)}
        className="flex h-9 items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
      >
        <span className="flex items-center gap-2">
          <GoogleIcon />
          Google
        </span>
        <ExternalLink className="h-3 w-3 text-slate-400" />
      </button>

      <button
        type="button"
        onClick={() => openImageSearch('bing', searchName)}
        className="flex h-9 items-center justify-between gap-2 rounded-lg border border-sky-800/70 bg-sky-950/20 px-2 text-xs font-semibold text-slate-200 transition hover:border-sky-600/80 hover:bg-sky-950/40"
      >
        <span className="flex items-center gap-2">
          <BingIcon />
          Bing
        </span>
        <ExternalLink className="h-3 w-3 text-slate-400" />
      </button>
    </div>
  );
}
