import 'server-only';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { db } from '@/lib/db/client';
import { owner } from '@/lib/db/schema';
import { COOKIE_NAME, getSessionRow } from './session';
import type { Owner } from '@/lib/db/schema';

/**
 * Verify the current session and return the owner row.
 * In layouts / server components: calls redirect('/admin/login') on failure.
 * In server actions: also calls redirect (Next.js handles it as a thrown response).
 */
export async function requireOwner(): Promise<Owner> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) redirect('/admin/login');

  const session = await getSessionRow(token);
  if (!session) redirect('/admin/login');

  const [row] = await db.select().from(owner);
  if (!row) redirect('/admin/login');

  return row;
}
