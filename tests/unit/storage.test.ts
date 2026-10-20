/**
 * Unit tests for src/lib/images/storage.ts
 *
 * These tests verify that inspiration uploads use the private token and that
 * path prefixes are applied correctly without hitting the real Vercel API.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────────────
// Mock @vercel/blob so no network calls are made
vi.mock('@vercel/blob', () => ({
  put: vi.fn(async (pathname: string, _body: unknown, opts: Record<string, unknown>) => ({
    url: `https://mock.vercel-storage.com/${pathname}`,
    pathname,
    token: opts['token'],
    downloadUrl: `https://mock.vercel-storage.com/${pathname}?download=1`,
  })),
  del: vi.fn(async () => undefined),
  head: vi.fn(async () => ({ url: 'https://mock.vercel-storage.com/test' })),
  list: vi.fn(async () => ({ blobs: [] })),
  download: vi.fn(async () => new Response('mock', { status: 200 })),
}));

// Mock server-only so it doesn't throw outside Next.js
vi.mock('server-only', () => ({}));

import { put as mockPut } from '@vercel/blob';
import {
  putPublic,
  putPrivate,
  publicBlobToken,
  privateBlobToken,
  withPrefix,
  getBlobPathPrefix,
} from '@/lib/images/storage';

describe('storage.ts', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = 'pub-token-abc';
    process.env.PRIVATE_BLOB_READ_WRITE_TOKEN = 'priv-token-xyz';
    delete process.env.VERCEL_ENV;
    delete process.env.BLOB_PATH_PREFIX;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  // ── Token accessors ───────────────────────────────────────────────────────
  it('publicBlobToken returns BLOB_READ_WRITE_TOKEN', () => {
    expect(publicBlobToken()).toBe('pub-token-abc');
  });

  it('privateBlobToken returns PRIVATE_BLOB_READ_WRITE_TOKEN', () => {
    expect(privateBlobToken()).toBe('priv-token-xyz');
  });

  // ── Path prefix ───────────────────────────────────────────────────────────
  it('adds dev/ prefix in non-production environments', () => {
    expect(getBlobPathPrefix()).toBe('dev/');
    expect(withPrefix('portfolio/foo.jpg')).toBe('dev/portfolio/foo.jpg');
  });

  it('adds no prefix in production', () => {
    process.env.VERCEL_ENV = 'production';
    expect(getBlobPathPrefix()).toBe('');
    expect(withPrefix('portfolio/foo.jpg')).toBe('portfolio/foo.jpg');
  });

  it('uses BLOB_PATH_PREFIX env override when set', () => {
    process.env.BLOB_PATH_PREFIX = 'test/';
    expect(getBlobPathPrefix()).toBe('test/');
    expect(withPrefix('portfolio/foo.jpg')).toBe('test/portfolio/foo.jpg');
  });

  it('does not double-prefix an already-prefixed pathname', () => {
    expect(withPrefix('dev/portfolio/foo.jpg')).toBe('dev/portfolio/foo.jpg');
  });

  // ── Public store ─────────────────────────────────────────────────────────
  it('putPublic calls put() with the public token', async () => {
    const body = new Blob(['x'], { type: 'image/webp' });
    await putPublic('portfolio/test.webp', body);
    expect(mockPut).toHaveBeenCalledWith(
      'dev/portfolio/test.webp',
      body,
      expect.objectContaining({ token: 'pub-token-abc', access: 'public' }),
    );
  });

  // ── Private store ─────────────────────────────────────────────────────────
  it('putPrivate calls put() with the PRIVATE token — not the public one', async () => {
    const body = new Blob(['x'], { type: 'image/jpeg' });
    await putPrivate('inspiration/test.jpg', body);
    expect(mockPut).toHaveBeenCalledWith(
      'dev/inspiration/test.jpg',
      body,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect.objectContaining({ token: 'priv-token-xyz' }),
    );
    // Crucially: the public token must NOT be used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs = vi.mocked(mockPut).mock.calls[0]![2] as any;
    expect(callArgs.token).not.toBe('pub-token-abc');
  });

  it('inspiration uploads NEVER use the public token', async () => {
    const body = new Blob(['y'], { type: 'image/jpeg' });
    await putPrivate('inspiration/user-upload.jpg', body);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs = vi.mocked(mockPut).mock.calls[0]![2] as any;
    expect(callArgs.token).toBe('priv-token-xyz');
    expect(callArgs.token).not.toBe('pub-token-abc');
  });

  // ── Missing token ─────────────────────────────────────────────────────────
  it('privateBlobToken throws if env var is missing', () => {
    delete process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
    expect(() => privateBlobToken()).toThrow('PRIVATE_BLOB_READ_WRITE_TOKEN not set');
  });

  it('publicBlobToken throws if env var is missing', () => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
    expect(() => publicBlobToken()).toThrow('BLOB_READ_WRITE_TOKEN not set');
  });
});
