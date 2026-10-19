'use server';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { owner } from '@/lib/db/schema';
import { requireOwner } from '@/lib/auth/require-owner';

/** Mark the welcome note as seen and go to the dashboard. */
export async function markWelcomeSeenAction(): Promise<void> {
  const ownerRow = await requireOwner();
  await db
    .update(owner)
    .set({ welcomeSeenAt: new Date() })
    .where(eq(owner.id, ownerRow.id));
  redirect('/admin');
}
