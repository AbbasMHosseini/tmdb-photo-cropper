import { Search } from 'lucide-react';

interface PhotoSearchPanelProps {
  personName: string | null;
}

export function PhotoSearchPanel({ personName }: PhotoSearchPanelProps) {
  const searchName = personName || 'person';

  const handleGoogleSearch = () => {
    const query = `${searchName} photos`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
    window.open(googleUrl, '_blank');
  };

  const handleBingSearch = () => {
    const query = `${searchName} photos`;
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
    window.open(bingUrl, '_blank');
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {searchName} Photos
      </div>

      <div className="space-y-2">
        <button
          onClick={handleGoogleSearch}
          className="flex w-full items-center gap-2 rounded-lg bg-sky-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700 active:bg-sky-800"
        >
          <Search className="h-4 w-4" />
          Search on Google
        </button>

        <button
          onClick={handleBingSearch}
          className="flex w-full items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 active:bg-cyan-800"
        >
          <Search className="h-4 w-4" />
          Search on Bing
        </button>
      </div>
    </div>
  );
}
