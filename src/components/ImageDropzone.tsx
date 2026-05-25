import { ImagePlus, Link } from 'lucide-react';
import { useRef, useState } from 'react';

type ImageDropzoneProps = {
  onImageSelected: (source: string, fileName?: string) => void;
};

export function ImageDropzone({ onImageSelected }: ImageDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file?: File) {
    if (!file || !file.type.startsWith('image/')) return;
    onImageSelected(URL.createObjectURL(file), file.name);
  }

  return (
    <section className="rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40">
      <div
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition ${
          isDragging ? 'border-sky-400 bg-sky-400/10' : 'border-slate-600 bg-slate-950/50 hover:border-slate-400'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
      >
        <ImagePlus className="mb-3 h-7 w-7 text-slate-300" />
        <p className="text-sm font-medium text-slate-100">Drop image here or click to upload</p>
        <p className="mt-1 text-xs text-slate-400">Best for portraits. JPG, PNG, WebP.</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Link className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Paste image URL"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none focus:border-sky-400"
          />
        </div>
        <button
          type="button"
          onClick={() => imageUrl.trim() && onImageSelected(imageUrl.trim())}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-white"
        >
          Load
        </button>
      </div>
    </section>
  );
}
