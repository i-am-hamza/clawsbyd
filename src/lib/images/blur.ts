'use client';

/**
 * Render a 10×10 version of the canvas and return a data URL.
 * Used as a blur placeholder for images.
 */
export function generateBlurDataUrl(source: HTMLCanvasElement): string {
  const w = 10;
  const h = Math.max(1, Math.round((source.height / source.width) * w));
  const tiny = document.createElement('canvas');
  tiny.width = w;
  tiny.height = h;
  const ctx = tiny.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(source, 0, 0, w, h);
  return tiny.toDataURL('image/webp', 0.5);
}
