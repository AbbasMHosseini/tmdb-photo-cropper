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
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-950">
      G
    </span>
  );
}

function BingIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-sm font-bold text-slate-950">
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
        className="flex h-9 items-center justify-between gap-2 rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-950 transition hover:bg-white"
      >
        <span className="flex items-center gap-2">
          <GoogleIcon />
          Google
        </span>
        <ExternalLink className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={() => openImageSearch('bing', searchName)}
        className="flex h-9 items-center justify-between gap-2 rounded-lg border border-slate-700 bg-slate-950 px-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
      >
        <span className="flex items-center gap-2">
          <BingIcon />
          Bing
        </span>
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}
