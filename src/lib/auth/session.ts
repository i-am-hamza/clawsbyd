import 'server-only';
import { randomBytes, createHash } from 'crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db/client';
import { sessions } from '@/lib/db/schema';
import { and, eq, gt, lt } from 'drizzle-orm';

export const COOKIE_NAME = 'session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const REFRESH_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // refresh if < 15 days remain

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userAgent?: string): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ tokenHash, expiresAt, userAgent: userAgent ?? null });
  return token;
}

export async function getSessionRow(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, now)));
  if (!row) return null;

  // Sliding expiry: extend when fewer than REFRESH_THRESHOLD_MS remain.
  if (row.expiresAt.getTime() - now.getTime() < REFRESH_THRESHOLD_MS) {
    const newExpiry = new Date(Date.now() + SESSION_TTL_MS);
    await db
      .update(sessions)
      .set({ expiresAt: newExpiry })
      .where(eq(sessions.tokenHash, tokenHash));
    row.expiresAt = newExpiry;
  }
  return row;
}

export async function deleteCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function deleteAllSessions(): Promise<void> {
  await db.delete(sessions);
}

/** Sweep sessions expired more than `ageSec` seconds ago. Called from the daily cron. */
export async function sweepExpiredSessions(ageSec = 0): Promise<void> {
  const cutoff = new Date(Date.now() - ageSec * 1000);
  await db.delete(sessions).where(lt(sessions.expiresAt, cutoff));
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_MS / 1000,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
