/**
 * proxy.ts — Next.js 16 renamed middleware to proxy.
 * Implements §14.1: go-live gate, preview cookie, X-Robots-Tag, fail-closed.
 *
 * Matcher excludes: /_next/*, static files, /admin/*, /api/blob/*,
 * /api/cron/*, /preview*, /manifest.webmanifest, and icon files.
 * Admin routes are protected by requireOwner() in their own layout.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { sanitizeNextPath } from '@/lib/gate/sanitize-next';
import { neon } from '@neondatabase/serverless';

// ---------------------------------------------------------------------------
// In-memory cache for site.go_live (TTL configurable via PROXY_CACHE_MS env var)
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = parseInt(process.env['PROXY_CACHE_MS'] ?? '15000', 10);

let _cached: boolean | null = null;
let _cacheExpiry = 0;

async function getGoLive(): Promise<boolean> {
  const now = Date.now();
  if (CACHE_TTL_MS > 0 && _cached !== null && now < _cacheExpiry) return _cached;
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT value FROM settings WHERE key = 'site.go_live' LIMIT 1`;
    const raw = rows[0]?.value;
    _cached = raw === true || raw === 'true';
    _cacheExpiry = now + CACHE_TTL_MS;
    return _cached;
  } catch {
    // Fail closed: if DB is unreachable, treat as not live.
    return false;
  }
}

// ---------------------------------------------------------------------------
// Preview-cookie helpers
// ---------------------------------------------------------------------------

async function computePreviewToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET ?? '';
  const password = (process.env.PREVIEW_PASSWORD ?? '').trim();
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hasValidPreviewCookie(request: NextRequest): Promise<boolean> {
  const cookieVal = request.cookies.get('preview')?.value;
  if (!cookieVal) return false;
  const expected = await computePreviewToken();
  return timingSafeEqual(cookieVal, expected);
}

// ---------------------------------------------------------------------------
// Proxy
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // Second guard: never redirect /preview/* even if the matcher lets it through.
  if (request.nextUrl.pathname.startsWith('/preview')) {
    return NextResponse.next();
  }

  const live = await getGoLive();

  if (live) {
    return NextResponse.next();
  }

  // Not live — check preview cookie.
  const previewing = await hasValidPreviewCookie(request);
  if (previewing) {
    // Still apply noindex headers even when previewing.
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  // No valid preview cookie — redirect to /preview, preserving the destination.
  const raw = request.nextUrl.pathname + request.nextUrl.search;
  const safePath = sanitizeNextPath(raw);
  const next = encodeURIComponent(safePath);
  return NextResponse.redirect(new URL(`/preview?next=${next}`, request.url), 307);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|apple-touch|manifest\\.webmanifest|admin|api/blob|api/admin|api/cron|preview).*)'],
};
