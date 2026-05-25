import { ExternalLink, Search } from 'lucide-react';

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

export function PhotoSearchPanel({ personName }: PhotoSearchPanelProps) {
  const searchName = (personName || 'person').trim();
  const queryLabel = `"${searchName} photos"`;

  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40">
      <div className="mb-3">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Find photos</div>
        <p className="mt-1 text-sm text-slate-300">Search query: {queryLabel}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <button
          type="button"
          onClick={() => openImageSearch('google', searchName)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white"
        >
          <Search className="h-4 w-4" />
          Google Photos
          <ExternalLink className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => openImageSearch('bing', searchName)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
        >
          <Search className="h-4 w-4" />
          Bing Photos
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
