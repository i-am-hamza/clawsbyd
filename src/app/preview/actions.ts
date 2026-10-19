'use server';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeNextPath } from '@/lib/gate/sanitize-next';

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

export type PreviewState = { error?: string };

export async function previewAuthAction(
  _prev: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  const hdrs = await headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    'unknown';

  const limit = await checkRateLimit({
    key: `preview:ip:${ip}`,
    windowMs: 15 * 60 * 1000,
    max: 10,
  });
  if (!limit.allowed) {
    return { error: 'Too many attempts. Try again later.' };
  }

  const entered = (formData.get('password') as string | null) ?? '';
  const expected = (process.env.PREVIEW_PASSWORD ?? '').trim();

  if (entered !== expected) {
    return { error: 'Incorrect password.' };
  }

  const token = await computePreviewToken();
  const jar = await cookies();
  jar.set('preview', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });

  const next = formData.get('next') as string | null;
  const safePath = sanitizeNextPath(next);
  redirect(safePath);
}
