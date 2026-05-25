import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type PointerEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { detectFace } from '../lib/faceDetection';
import type { ExportSize } from '../lib/imageExport';

export type CropCanvasHandle = {
  renderToCanvas: () => HTMLCanvasElement | null;
};

type CropCanvasProps = {
  imageSource: string | null;
  exportSize: ExportSize;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onReadyChange: (ready: boolean) => void;
  onReset?: () => void;
};

type Pan = {
  x: number;
  y: number;
};

const PREVIEW_WIDTH = 420;
const PREVIEW_HEIGHT = 630;
const EDGE_SNAP_PX = 2;

export const CropCanvas = forwardRef<CropCanvasHandle, CropCanvasProps>(function CropCanvas(
  { imageSource, exportSize, zoom, onZoomChange, onReadyChange, onReset },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const dragRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const panRef = useRef<Pan>(pan);
  const zoomRef = useRef(zoom);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    panRef.current = pan;
    scheduleDraw();
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
    const image = imageRef.current;
    if (image) {
      setPan((current) => clampPan(current, image, zoom));
    }
    scheduleDraw();
  }, [zoom]);

  useEffect(() => {
    if (!imageSource) {
      imageRef.current = null;
      onReadyChange(false);
      scheduleDraw();
      return;
    }

    setError(null);
    onReadyChange(false);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = async () => {
      imageRef.current = image;
      const nextZoom = Math.max(1, zoomRef.current || 1);
      const nextPan = await getInitialPan(image, nextZoom);
      setPan(clampPan(nextPan, image, nextZoom));
      onZoomChange(nextZoom);
      onReadyChange(true);
      scheduleDraw();
    };
    image.onerror = () => {
      setError('This image URL could not be loaded here. Many websites block direct browser loading with CORS. Download the image and upload the file instead.');
      imageRef.current = null;
      onReadyChange(false);
      scheduleDraw();
    };
    image.src = imageSource;
  }, [imageSource]);

  useImperativeHandle(ref, () => ({
    renderToCanvas: () => {
      if (!imageRef.current) return null;
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = exportSize.width;
      outputCanvas.height = exportSize.height;
      const safePan = clampPan(panRef.current, imageRef.current, zoomRef.current);
      drawImageToCanvas(outputCanvas, imageRef.current, safePan, zoomRef.current);
      return outputCanvas;
    },
  }));

  async function getInitialPan(image: HTMLImageElement, currentZoom: number): Promise<Pan> {
    try {
      const face = await detectFace(image);
      const scale = getBaseScale(image, PREVIEW_WIDTH, PREVIEW_HEIGHT) * currentZoom;
      const faceCenterX = face.x + face.width / 2;
      const faceCenterY = face.y + face.height / 2;
      return {
        x: (image.naturalWidth / 2 - faceCenterX) * scale,
        y: (image.naturalHeight * 0.38 - faceCenterY) * scale,
      };
    } catch {
      return { x: 0, y: 0 };
    }
  }

  function handleCanvasReset() {
    setPan({ x: 0, y: 0 });
    onReset?.();
    scheduleDraw();
  }

  function scheduleDraw() {
    if (animationRef.current) return;
    animationRef.current = window.requestAnimationFrame(() => {
      animationRef.current = null;
      const canvas = canvasRef.current;
      const image = imageRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#020617';
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (!image) {
        context.fillStyle = '#475569';
        context.font = '16px Inter, sans-serif';
        context.textAlign = 'center';
        context.fillText('Upload a portrait image', canvas.width / 2, canvas.height / 2);
        drawPreviewFrame(canvas);
        return;
      }

      const safePan = clampPan(panRef.current, image, zoomRef.current);
      drawImageToCanvas(canvas, image, safePan, zoomRef.current);
      drawPreviewFrame(canvas);
    });
  }

  function drawImageToCanvas(canvas: HTMLCanvasElement, image: HTMLImageElement, currentPan: Pan, currentZoom: number) {
    const context = canvas.getContext('2d');
    if (!context) return;
    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#020617';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const baseScale = getBaseScale(image, canvas.width, canvas.height);
    const scale = baseScale * currentZoom;
    context.translate(canvas.width / 2 + currentPan.x * (canvas.width / PREVIEW_WIDTH), canvas.height / 2 + currentPan.y * (canvas.height / PREVIEW_HEIGHT));
    context.scale(scale, scale);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    context.restore();
  }

  function drawPreviewFrame(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) return;
    context.save();
    context.strokeStyle = '#38bdf8';
    context.lineWidth = 2;
    context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    context.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    context.lineWidth = 1;
    context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    context.restore();
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    const image = imageRef.current;
    setPan((current) => {
      const nextPan = { x: current.x + dx, y: current.y + dy };
      return image ? clampPan(nextPan, image, zoomRef.current) : nextPan;
    });
  }

  function handlePointerUp() {
    dragRef.current.active = false;
  }

  return (
    <section className="relative rounded-3xl border border-slate-600 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/50">
      <button
        type="button"
        onClick={handleCanvasReset}
        className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-sm font-semibold text-slate-200 backdrop-blur hover:border-slate-500"
      >
        <RotateCcw className="h-4 w-4" />
        Reset
      </button>
      <div className="mx-auto w-full max-w-[420px] rounded-2xl border-2 border-sky-400/80 bg-slate-950 p-[2px] shadow-[0_0_0_1px_rgba(255,255,255,0.16)]">
        <canvas
          ref={canvasRef}
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="aspect-[2/3] w-full touch-none cursor-grab rounded-xl bg-slate-950 shadow-inner active:cursor-grabbing"
        />
      </div>
      {error && <p className="mt-3 rounded-xl border border-amber-800 bg-amber-950/30 px-3 py-2 text-center text-sm text-amber-200">{error}</p>}
    </section>
  );
});

function clampPan(pan: Pan, image: HTMLImageElement, currentZoom: number): Pan {
  const baseScale = getBaseScale(image, PREVIEW_WIDTH, PREVIEW_HEIGHT);
  const scale = baseScale * currentZoom;
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  const maxPanX = Math.max(0, (drawnWidth - PREVIEW_WIDTH) / 2);
  const maxPanY = Math.max(0, (drawnHeight - PREVIEW_HEIGHT) / 2);

  return {
    x: snapToEdge(clamp(pan.x, -maxPanX, maxPanX), maxPanX),
    y: snapToEdge(clamp(pan.y, -maxPanY, maxPanY), maxPanY),
  };
}

function snapToEdge(value: number, max: number) {
  if (Math.abs(value) < EDGE_SNAP_PX) return 0;
  if (Math.abs(value - max) < EDGE_SNAP_PX) return max;
  if (Math.abs(value + max) < EDGE_SNAP_PX) return -max;
  return value;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getBaseScale(image: HTMLImageElement, canvasWidth: number, canvasHeight: number) {
  const imageAspect = image.naturalWidth / image.naturalHeight;
  const canvasAspect = canvasWidth / canvasHeight;
  if (imageAspect > canvasAspect) {
    return canvasHeight / image.naturalHeight;
  }
  return canvasWidth / image.naturalWidth;
}
