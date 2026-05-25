import { Trash2 } from 'lucide-react';
import type { PersonSearchHistoryItem } from '../lib/searchHistory';

type SearchHistoryPanelProps = {
  items: PersonSearchHistoryItem[];
  onSelect: (item: PersonSearchHistoryItem) => void;
  onClear: () => void;
};

export function SearchHistoryPanel({ items, onSelect, onClear }: SearchHistoryPanelProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recent searches</div>
          <p className="mt-1 text-xs text-slate-500">Last checked TMDB people</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 hover:text-slate-100"
          title="Clear history"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={`${item.id}-${item.searchedAt}`}
            type="button"
            onClick={() => onSelect(item)}
            className="flex w-[180px] items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-2 text-left hover:border-slate-600"
          >
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt={`${item.name} TMDB thumbnail`}
                className="h-11 w-8 flex-none rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-11 w-8 flex-none items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-base">
                👤
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-100">{item.name}</div>
              <div className="mt-0.5 truncate text-[11px] text-slate-500">
                {item.hasProfilePhoto ? `${item.profileImageCount} photo${item.profileImageCount === 1 ? '' : 's'}` : 'No photo'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
