import 'server-only';
import { db } from '@/lib/db/client';
import { availabilityRules, blockedPeriods, homeVisitAreas } from '@/lib/db/schema';
import { eq, asc, and, lte, gte } from 'drizzle-orm';

export async function getAvailabilityRules(activeOnly = true) {
  if (activeOnly) {
    return db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.isActive, true))
      .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime));
  }
  return db
    .select()
    .from(availabilityRules)
    .orderBy(asc(availabilityRules.weekday), asc(availabilityRules.startTime));
}

export async function getBlockedPeriods(from: Date, to: Date) {
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);
  return db
    .select()
    .from(blockedPeriods)
    .where(
      and(
        lte(blockedPeriods.startsOn, toStr),
        gte(blockedPeriods.endsOn, fromStr),
      ),
    );
}

export async function getHomeVisitAreas(activeOnly = true) {
  if (activeOnly) {
    return db
      .select()
      .from(homeVisitAreas)
      .where(eq(homeVisitAreas.isActive, true))
      .orderBy(asc(homeVisitAreas.sortOrder));
  }
  return db.select().from(homeVisitAreas).orderBy(asc(homeVisitAreas.sortOrder));
}
