import { Download, RotateCcw } from 'lucide-react';
import { EXPORT_SIZES, type ExportSize } from '../lib/imageExport';

type ExportControlsProps = {
  zoom: number;
  selectedSize: ExportSize;
  canExport: boolean;
  onZoomChange: (zoom: number) => void;
  onSizeChange: (size: ExportSize) => void;
  onReset: () => void;
  onExport: () => void;
};

export function ExportControls({
  zoom,
  selectedSize,
  canExport,
  onZoomChange,
  onSizeChange,
  onReset,
  onExport,
}: ExportControlsProps) {
  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
        <label className="block">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span>Zoom</span>
            <span>{zoom.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => onZoomChange(Number(event.target.value))}
            className="w-full accent-sky-400"
          />
        </label>

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
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>

        <button
          type="button"
          disabled={!canExport}
          onClick={onExport}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          Export JPG
        </button>
      </div>
    </section>
  );
}
