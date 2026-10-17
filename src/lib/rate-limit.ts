import 'server-only';
import { db } from '@/lib/db/client';
import { rateLimits } from '@/lib/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';

type RateLimitConfig = {
  key: string;
  windowMs: number;
  max: number;
};

export type RateLimitResult = { allowed: boolean; remaining: number };

/**
 * Check and increment a rate-limit counter.
 * Window is aligned to the start of the period (not rolling).
 */
export async function checkRateLimit(cfg: RateLimitConfig): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / cfg.windowMs) * cfg.windowMs);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(rateLimits)
      .where(and(eq(rateLimits.key, cfg.key), eq(rateLimits.windowStart, windowStart)));

    if (!existing) {
      await tx.insert(rateLimits).values({ key: cfg.key, windowStart, count: 1 });
      return { allowed: true, remaining: cfg.max - 1 };
    }

    if (existing.count >= cfg.max) {
      return { allowed: false, remaining: 0 };
    }

    await tx
      .update(rateLimits)
      .set({ count: sql`${rateLimits.count} + 1` })
      .where(and(eq(rateLimits.key, cfg.key), eq(rateLimits.windowStart, windowStart)));

    return { allowed: true, remaining: cfg.max - existing.count - 1 };
  });
}

/** Clean up expired rate-limit windows. Called from the daily cron. */
export async function sweepRateLimits(olderThanMs = 3600_000): Promise<void> {
  const cutoff = new Date(Date.now() - olderThanMs);
  await db.delete(rateLimits).where(gte(rateLimits.windowStart, cutoff));
}
