import { Search, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { checkTmdbPersonPhoto, type TmdbPersonPhotoCheck } from '../lib/tmdb';

type PersonCheckPanelProps = {
  onPersonResolved: (name: string) => void;
};

export function PersonCheckPanel({ onPersonResolved }: PersonCheckPanelProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TmdbPersonPhotoCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  async function handleCheck() {
    if (!input.trim()) return;
    setIsChecking(true);
    const nextResult = await checkTmdbPersonPhoto(input);
    setResult(nextResult);
    onPersonResolved(nextResult.name || input.trim());
    setIsChecking(false);
  }

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Person</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleCheck()}
          placeholder="Name or TMDB person URL"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-400"
        />
        <button
          type="button"
          onClick={handleCheck}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300"
        >
          <Search className="h-4 w-4" />
          Check
        </button>
      </div>

      <div className="mt-3 min-h-9 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
        {isChecking && <span>Checking TMDB mock...</span>}
        {!isChecking && !result && <span>First version uses a mock TMDB check.</span>}
        {!isChecking && result && (
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-300" />
            <span>
              {result.name}: {result.hasProfilePhoto ? 'already has a TMDB photo' : 'no TMDB photo found'}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
