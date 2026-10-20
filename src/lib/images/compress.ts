'use client';

import { generateBlurDataUrl } from './blur';

const MAX_LONG_EDGE = 2000;
const WEBP_QUALITY = 0.8;
const JPEG_QUALITY = 0.85;

export type CompressResult = {
  file: File;
  width: number;
  height: number;
  blurDataUrl: string;
};

/** Compress + re-encode an image in the browser. Strips EXIF via canvas. */
export async function compressImage(source: File): Promise<CompressResult> {
  const bitmap = await decodeToBitmap(source);

  const { width, height } = calcDimensions(bitmap.width, bitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Try WebP first; fall back to JPEG if the browser doesn't support it
  const blob =
    (await canvasToBlob(canvas, 'image/webp', WEBP_QUALITY)) ??
    (await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY));

  if (!blob) throw new Error('Canvas encode failed');

  const blurDataUrl = generateBlurDataUrl(canvas);
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const name = source.name.replace(/\.[^.]+$/, `.${ext}`);

  return { file: new File([blob], name, { type: blob.type }), width, height, blurDataUrl };
}

function calcDimensions(w: number, h: number): { width: number; height: number } {
  const long = Math.max(w, h);
  if (long <= MAX_LONG_EDGE) return { width: w, height: h };
  const scale = MAX_LONG_EDGE / long;
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Decode any image to ImageBitmap.
 * Falls back to heic2any for HEIC/HEIF which most browsers can't decode natively.
 */
async function decodeToBitmap(file: File): Promise<ImageBitmap> {
  // Browsers that support HEIC natively (Safari 17+) will succeed here
  try {
    return await createImageBitmap(file);
  } catch {
    // Fallback: decode HEIC via heic2any (loads lazily to avoid the ~200 kB bundle in non-HEIC paths)
    const heic2any = (await import('heic2any')).default;
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 1 });
    const jpeg = Array.isArray(result) ? result[0]! : result;
    return createImageBitmap(jpeg);
  }
}
