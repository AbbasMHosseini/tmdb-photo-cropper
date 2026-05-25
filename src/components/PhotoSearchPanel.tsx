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
  const queryLabel = `"${searchName} photos"`;

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-3">
      <div className="mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Find photos</div>
        <p className="mt-1 text-xs leading-5 text-slate-400">{queryLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => openImageSearch('google', searchName)}
          className="flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-2 py-2 text-xs font-semibold text-slate-950 transition hover:bg-white"
        >
          <GoogleIcon />
          <span>Google</span>
          <ExternalLink className="h-3 w-3" />
        </button>

        <button
          type="button"
          onClick={() => openImageSearch('bing', searchName)}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
        >
          <BingIcon />
          <span>Bing</span>
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
