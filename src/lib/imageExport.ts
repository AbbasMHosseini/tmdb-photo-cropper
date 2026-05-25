export type ExportSize = {
  label: string;
  width: number;
  height: number;
};

export const EXPORT_SIZES: ExportSize[] = [
  { label: '500 x 750', width: 500, height: 750 },
  { label: '1000 x 1500', width: 1000, height: 1500 },
  { label: '1500 x 2250', width: 1500, height: 2250 },
];

export function downloadCanvasAsJpg(canvas: HTMLCanvasElement, filename: string, quality = 0.92) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/jpeg', quality);
  link.click();
}

export function safeFilename(value: string) {
  const base = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${base || 'person'}-tmdb-profile.jpg`;
}
