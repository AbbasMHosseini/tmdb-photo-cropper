import { Download, ExternalLink, Minus, Plus } from 'lucide-react';
import { EXPORT_SIZES, type ExportSize } from '../lib/imageExport';

type ExportControlsProps = {
  zoom: number;
  selectedSize: ExportSize;
  canExport: boolean;
  tmdbPersonId?: number;
  tmdbPersonName?: string;
  onZoomChange: (zoom: number) => void;
  onSizeChange: (size: ExportSize) => void;
  onExport: () => void;
};

export function ExportControls({
  zoom,
  selectedSize,
  canExport,
  tmdbPersonId,
  tmdbPersonName,
  onZoomChange,
  onSizeChange,
  onExport,
}: ExportControlsProps) {
  function nudgeZoom(delta: number) {
    const nextZoom = Math.min(3, Math.max(1, Number((zoom + delta).toFixed(2))));
    onZoomChange(nextZoom);
  }

  function openTmdbMediaPage() {
    if (!tmdbPersonId) return;
    const slug = toTmdbSlug(tmdbPersonName || '');
    const personPath = slug ? `${tmdbPersonId}-${slug}` : String(tmdbPersonId);
    window.open(`https://www.themoviedb.org/person/${personPath}/images/profiles`, '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-3 shadow-2xl shadow-slate-950/40">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Zoom</span>
          <button
            type="button"
            onClick={() => nudgeZoom(-0.05)}
            className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-200 hover:border-slate-500"
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.target.value))}
            className="h-2 max-w-40 flex-1 accent-sky-400"
          />
          <button
            type="button"
            onClick={() => nudgeZoom(0.05)}
            className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-200 hover:border-slate-500"
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <span className="w-12 text-right text-xs font-semibold text-slate-400">{zoom.toFixed(2)}x</span>
        </div>

        <select
          value={selectedSize.label}
          onChange={(event) => {
            const nextSize = EXPORT_SIZES.find((size) => size.label === event.target.value);
            if (nextSize) onSizeChange(nextSize);
          }}
          className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-400"
        >
          {EXPORT_SIZES.map((size) => (
            <option key={size.label} value={size.label}>
              {size.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={!canExport}
          onClick={onExport}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          Export JPG
        </button>

        <button
          type="button"
          disabled={!tmdbPersonId}
          onClick={openTmdbMediaPage}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ExternalLink className="h-4 w-4" />
          TMDB Media
        </button>
      </div>
    </section>
  );
}

function toTmdbSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
