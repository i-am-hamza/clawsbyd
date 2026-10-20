/**
 * Single entry point for all Vercel Blob operations.
 * No other file touches BLOB_READ_WRITE_TOKEN or PRIVATE_BLOB_READ_WRITE_TOKEN.
 */
import 'server-only';
import { put, del, head, list } from '@vercel/blob';

// ---------------------------------------------------------------------------
// Path prefix — dev/ in local dev, test/ in e2e, nothing in production
// ---------------------------------------------------------------------------

export function getBlobPathPrefix(): string {
  if (process.env.VERCEL_ENV === 'production') return '';
  if (process.env.BLOB_PATH_PREFIX) return process.env.BLOB_PATH_PREFIX;
  return 'dev/';
}

export function withPrefix(pathname: string): string {
  const prefix = getBlobPathPrefix();
  // Avoid double-prefixing
  if (pathname.startsWith(prefix)) return pathname;
  return `${prefix}${pathname}`;
}

// ---------------------------------------------------------------------------
// Public store — portfolio, products, brand, review photos
// ---------------------------------------------------------------------------

export async function putPublic(
  pathname: string,
  body: Blob | File | ReadableStream | Buffer,
  options: { contentType?: string; addRandomSuffix?: boolean } = {},
) {
  return put(withPrefix(pathname), body, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: options.addRandomSuffix ?? true,
    contentType: options.contentType,
  });
}

export async function delPublic(urls: string | string[]) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return del(urls, { token });
}

export async function listPublic(prefix?: string) {
  return list({ prefix: prefix ? withPrefix(prefix) : getBlobPathPrefix(), token: process.env.BLOB_READ_WRITE_TOKEN });
}

// ---------------------------------------------------------------------------
// Private store — customer inspiration uploads only
// ---------------------------------------------------------------------------

export async function putPrivate(
  pathname: string,
  body: Blob | File | ReadableStream | Buffer,
  options: { contentType?: string; addRandomSuffix?: boolean } = {},
) {
  return put(withPrefix(pathname), body, {
    access: 'public', // Vercel Blob "private" = store-level, not URL-level; access token gates fetches
    token: process.env.PRIVATE_BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: options.addRandomSuffix ?? true,
    contentType: options.contentType,
  });
}

export async function delPrivate(urls: string | string[]) {
  const token = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
  return del(urls, { token });
}

export async function headPrivate(url: string) {
  return head(url, { token: process.env.PRIVATE_BLOB_READ_WRITE_TOKEN });
}

/**
 * Fetch the raw bytes of a private blob so the admin can stream it.
 * Uses a signed token so the fetch doesn't require the blob to be publicly readable.
 */
export async function fetchPrivateBlob(url: string): Promise<Response> {
  const token = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
  // Append the token as a query param — Vercel Blob accepts token auth via Authorization header
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Blob fetch failed: ${res.status}`);
  return res;
}

export async function listPrivate(prefix?: string) {
  return list({ prefix: prefix ? withPrefix(prefix) : getBlobPathPrefix(), token: process.env.PRIVATE_BLOB_READ_WRITE_TOKEN });
}

// ---------------------------------------------------------------------------
// Token accessors — used only in the upload route handler
// ---------------------------------------------------------------------------

export function publicBlobToken(): string {
  const t = process.env.BLOB_READ_WRITE_TOKEN;
  if (!t) throw new Error('BLOB_READ_WRITE_TOKEN not set');
  return t;
}

export function privateBlobToken(): string {
  const t = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
  if (!t) throw new Error('PRIVATE_BLOB_READ_WRITE_TOKEN not set');
  return t;
}
