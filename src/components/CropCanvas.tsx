import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
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
};

type Pan = {
  x: number;
  y: number;
};

const PREVIEW_WIDTH = 420;
const PREVIEW_HEIGHT = 630;

export const CropCanvas = forwardRef<CropCanvasHandle, CropCanvasProps>(function CropCanvas(
  { imageSource, exportSize, zoom, onZoomChange, onReadyChange },
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
      const nextPan = await getInitialPan(image, zoomRef.current);
      setPan(nextPan);
      onZoomChange(1);
      onReadyChange(true);
      scheduleDraw();
    };
    image.onerror = () => {
      setError('Could not load this image. Try uploading the file instead.');
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
      drawImageToCanvas(outputCanvas, imageRef.current, panRef.current, zoomRef.current);
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
        return;
      }

      drawImageToCanvas(canvas, image, panRef.current, zoomRef.current);
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

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current.active) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
    setPan((current) => ({ x: current.x + dx, y: current.y + dy }));
  }

  function handlePointerUp() {
    dragRef.current.active = false;
  }

  return (
    <section className="rounded-3xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/50">
      <div className="mx-auto w-full max-w-[420px]">
        <canvas
          ref={canvasRef}
          width={PREVIEW_WIDTH}
          height={PREVIEW_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="aspect-[2/3] w-full touch-none cursor-grab rounded-2xl border border-slate-700 bg-slate-950 shadow-inner active:cursor-grabbing"
        />
      </div>
      {error && <p className="mt-3 text-center text-sm text-rose-300">{error}</p>}
    </section>
  );
});

function getBaseScale(image: HTMLImageElement, canvasWidth: number, canvasHeight: number) {
  const imageAspect = image.naturalWidth / image.naturalHeight;
  const canvasAspect = canvasWidth / canvasHeight;
  if (imageAspect > canvasAspect) {
    return canvasHeight / image.naturalHeight;
  }
  return canvasWidth / image.naturalWidth;
}
