'use server';
import { redirect } from 'next/navigation';
import { verify } from '@node-rs/argon2';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { owner, sessions } from '@/lib/db/schema';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  deleteAllSessions,
  hashToken,
  COOKIE_NAME,
} from '@/lib/auth/session';
import { cookies } from 'next/headers';

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  if (!email || !password) return { error: 'Email and password are required.' };

  const hdrs = await headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    'unknown';

  // Rate limit: 5 / 15 min / IP, 20 / hour global
  const [perIp, global] = await Promise.all([
    checkRateLimit({ key: `login:ip:${ip}`, windowMs: 15 * 60 * 1000, max: 5 }),
    checkRateLimit({ key: 'login:global', windowMs: 60 * 60 * 1000, max: 20 }),
  ]);
  if (!perIp.allowed || !global.allowed) {
    return { error: 'Too many login attempts. Please try again later.' };
  }

  const ownerEmail = process.env.OWNER_EMAIL?.trim() ?? '';
  const [ownerRow] = await db.select().from(owner).where(eq(owner.email, ownerEmail));

  if (!ownerRow?.passwordHash || email.toLowerCase() !== ownerEmail.toLowerCase()) {
    return { error: 'Incorrect email or password.' };
  }

  let valid = false;
  try {
    valid = await verify(ownerRow.passwordHash, password);
  } catch {
    return { error: 'Incorrect email or password.' };
  }
  if (!valid) return { error: 'Incorrect email or password.' };

  const ua = hdrs.get('user-agent') ?? undefined;
  const token = await createSession(ua);
  await setSessionCookie(token);

  redirect(ownerRow.welcomeSeenAt === null ? '/admin/welcome' : '/admin');
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  await clearSessionCookie();
  redirect('/admin/login');
}

export async function logoutEverywhereAction(): Promise<void> {
  await deleteAllSessions();
  await clearSessionCookie();
  redirect('/admin/login');
}
