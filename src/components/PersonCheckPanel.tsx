import { AlertTriangle, Check, Copy, ExternalLink, Search, UserCheck } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { PhotoSearchPanel } from './PhotoSearchPanel';
import { buildTmdbPersonUrl, checkTmdbPersonPhoto, type TmdbPersonPhotoCheck } from '../lib/tmdb';

export type PersonCheckPanelHandle = {
  searchPerson: (name: string, askConfirmation?: boolean) => void;
};

type PersonCheckPanelProps = {
  onPersonResolved: (name: string) => void;
  onCheckComplete?: (result: TmdbPersonPhotoCheck, fallbackName: string) => void;
  initialInput?: string;
};

export const PersonCheckPanel = forwardRef<PersonCheckPanelHandle, PersonCheckPanelProps>(function PersonCheckPanel(
  { onPersonResolved, onCheckComplete, initialInput = '' },
  ref,
) {
  const [input, setInput] = useState(initialInput);
  const [result, setResult] = useState<TmdbPersonPhotoCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  useImperativeHandle(ref, () => ({
    searchPerson: (name: string, askConfirmation = false) => {
      const cleanName = name.trim();
      if (!cleanName) return;
      if (askConfirmation) {
        const confirmed = window.confirm(`Search TMDB again for "${cleanName}"?`);
        if (!confirmed) return;
      }
      setInput(cleanName);
      void handleCheck(cleanName);
    },
  }));

  async function handleCheck(nextInput = input) {
    if (!nextInput.trim()) return;
    setIsChecking(true);
    setCopied(false);
    const nextResult = await checkTmdbPersonPhoto(nextInput);
    setResult(nextResult);
    onPersonResolved(nextResult.name || nextInput.trim());
    onCheckComplete?.(nextResult, nextInput.trim());
    setIsChecking(false);
  }

  async function copyTmdbUrl() {
    if (!result?.personId) return;
    const url = buildTmdbPersonUrl(result.personId, result.name);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function openTmdbPersonPage() {
    if (!result?.personId) return;
    window.open(buildTmdbPersonUrl(result.personId, result.name), '_blank', 'noopener,noreferrer');
  }

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Person</label>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleCheck()}
          placeholder="Name, TMDB URL, or IMDb name URL"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-400"
        />
        <button
          type="button"
          onClick={() => handleCheck()}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300"
        >
          <Search className="h-4 w-4" />
          Check
        </button>
      </div>

      <div className="mt-3 h-[300px] overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-300">
        {isChecking && <span>Checking TMDB...</span>}
        {!isChecking && !result && <span>Use the settings button to save a TMDB credential, then check a person.</span>}
        {!isChecking && result && (
          <div className="flex h-full flex-col gap-2">
            <div className="flex items-start gap-2">
              {result.error ? (
                <AlertTriangle className="mt-1 h-4 w-4 flex-none text-amber-300" />
              ) : (
                <UserCheck className="mt-1 h-4 w-4 flex-none text-emerald-300" />
              )}
              <span className="line-clamp-2 leading-6">
                {result.name || 'Unknown person'}: {result.hasProfilePhoto ? 'already has a TMDB photo' : 'no TMDB photo found'}
              </span>
            </div>

            <div className="grid gap-1.5 text-xs text-slate-400">
              {result.personId && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={copyTmdbUrl}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 hover:border-slate-500 hover:text-slate-100"
                    title="Copy TMDB person link"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                    TMDB ID: {result.personId}
                  </button>
                  <button
                    type="button"
                    onClick={openTmdbPersonPage}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-slate-300 hover:border-slate-500 hover:text-slate-100"
                    title="Open TMDB person page"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </button>
                </div>
              )}
              <span>Profile images: {result.profileImageCount ?? 0}</span>
              {result.checkedAt && <span>Last checked: {new Date(result.checkedAt).toLocaleString()}</span>}
              {result.hasProfilePhoto && <span>Photo upload date: not available from the TMDB API</span>}
              {result.error && <span className="line-clamp-2 text-amber-300">{result.error}</span>}
            </div>

            <div className="mt-auto grid grid-cols-[86px_1fr] items-end gap-3">
              {result.existingProfileUrl ? (
                <img
                  src={result.existingProfileUrl}
                  alt={result.name ? `${result.name} existing TMDB profile` : 'Existing TMDB profile'}
                  className="h-24 w-[68px] rounded-xl border border-slate-700 object-cover"
                />
              ) : (
                <div className="flex h-24 w-[68px] items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-2xl">
                  👤
                </div>
              )}

              <PhotoSearchPanel personName={result.name || input.trim()} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
});
