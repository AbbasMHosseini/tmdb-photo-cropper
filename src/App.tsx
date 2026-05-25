import { useRef, useState } from 'react';
import { Film, Sparkles } from 'lucide-react';
import { ApiSettingsPanel } from './components/ApiSettingsPanel';
import { CropCanvas, type CropCanvasHandle } from './components/CropCanvas';
import { ExportControls } from './components/ExportControls';
import { ImageDropzone } from './components/ImageDropzone';
import { PhotoSearchPanel } from './components/PhotoSearchPanel';
import { PersonCheckPanel } from './components/PersonCheckPanel';
import { downloadCanvasAsJpg, EXPORT_SIZES, safeFilename, type ExportSize } from './lib/imageExport';

export default function App() {
  const cropCanvasRef = useRef<CropCanvasHandle | null>(null);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [personName, setPersonName] = useState('person');
  const [sourceFileName, setSourceFileName] = useState<string | undefined>();
  const [zoom, setZoom] = useState(1);
  const [selectedSize, setSelectedSize] = useState<ExportSize>(EXPORT_SIZES[1]);
  const [canExport, setCanExport] = useState(false);
  const [tokenRefreshKey, setTokenRefreshKey] = useState(0);

  function handleExport() {
    const canvas = cropCanvasRef.current?.renderToCanvas();
    if (!canvas) return;
    const baseName = personName || sourceFileName?.replace(/\.[^.]+$/, '') || 'person';
    downloadCanvasAsJpg(canvas, safeFilename(baseName));
  }

  function handleReset() {
    setZoom(1);
  }

  return (
    <main className="min-h-screen px-4 py-4 text-slate-100 sm:px-6 lg:px-8">
      <header className="mx-auto mb-5 flex max-w-6xl items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400 text-slate-950">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">TMDB Photo Cropper</h1>
            <p className="text-xs text-slate-400">2:3 person profile image tool</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 sm:flex">
          <Sparkles className="h-3.5 w-3.5 text-sky-300" />
          GitHub Pages
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <PersonCheckPanel key={tokenRefreshKey} onPersonResolved={setPersonName} />
          <ImageDropzone
            onImageSelected={(source, fileName) => {
              setImageSource(source);
              setSourceFileName(fileName);
              setCanExport(false);
            }}
          />
          {imageSource && <PhotoSearchPanel personName={personName} />}
        </aside>

        <section className="space-y-5">
          <CropCanvas
            ref={cropCanvasRef}
            imageSource={imageSource}
            exportSize={selectedSize}
            zoom={zoom}
            onZoomChange={setZoom}
            onReadyChange={setCanExport}
          />
          <ExportControls
            zoom={zoom}
            selectedSize={selectedSize}
            canExport={canExport}
            onZoomChange={setZoom}
            onSizeChange={setSelectedSize}
            onReset={handleReset}
            onExport={handleExport}
          />
        </section>
      </div>

      <ApiSettingsPanel onTokenChange={() => setTokenRefreshKey((current) => current + 1)} />
    </main>
  );
}
