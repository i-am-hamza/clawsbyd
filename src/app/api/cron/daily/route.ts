import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { media, bookings, designDrafts } from '@/lib/db/schema';
import { eq, and, lt, isNotNull } from 'drizzle-orm';
import { sweepExpiredSessions } from '@/lib/auth/session';
import { sweepRateLimits } from '@/lib/rate-limit';
import { delPrivate } from '@/lib/images/storage';

const INSPIRATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = request.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, number | string> = {};

  // 1. Sweep expired sessions
  await sweepExpiredSessions();

  // 2. Sweep old rate-limit windows (keep last hour)
  await sweepRateLimits(3_600_000);

  // 3. Delete inspiration media older than 7 days not referenced by any booking or design
  const cutoff = new Date(Date.now() - INSPIRATION_MAX_AGE_MS);

  const [refBookings, refDesigns] = await Promise.all([
    db.selectDistinct({ id: bookings.inspirationMediaId })
      .from(bookings)
      .where(isNotNull(bookings.inspirationMediaId)),
    db.selectDistinct({ id: designDrafts.inspirationMediaId })
      .from(designDrafts)
      .where(isNotNull(designDrafts.inspirationMediaId)),
  ]);

  const referencedIds = new Set<string>([
    ...refBookings.map((r) => r.id as string),
    ...refDesigns.map((r) => r.id as string),
  ]);

  const oldMedia = await db
    .select({ id: media.id, url: media.url })
    .from(media)
    .where(and(eq(media.kind, 'inspiration'), lt(media.createdAt, cutoff)));

  let deleted = 0;
  for (const m of oldMedia) {
    if (referencedIds.has(m.id)) continue;
    try {
      await delPrivate(m.url);
      await db.delete(media).where(eq(media.id, m.id));
      deleted++;
    } catch {
      // Don't fail the whole cron for one blob error
    }
  }
  results.inspirationDeleted = deleted;
  results.sweepedAt = new Date().toISOString();

  return NextResponse.json({ ok: true, ...results });
}
