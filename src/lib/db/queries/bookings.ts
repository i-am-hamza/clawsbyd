import 'server-only';
import { db } from '@/lib/db/client';
import { bookings, bookingItems } from '@/lib/db/schema';
import { eq, and, gte, desc, inArray } from 'drizzle-orm';
import type { BookingStatus } from '@/lib/domain/status';

export async function getBookingByRef(ref: string) {
  const [booking] = await db.select().from(bookings).where(eq(bookings.ref, ref));
  return booking ?? null;
}

export async function getBookingById(id: string) {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  return booking ?? null;
}

export async function getBookingItems(bookingId: string) {
  return db.select().from(bookingItems).where(eq(bookingItems.bookingId, bookingId));
}

export async function getBookingsByStatus(statuses: BookingStatus[]) {
  return db
    .select()
    .from(bookings)
    .where(inArray(bookings.status, statuses))
    .orderBy(desc(bookings.createdAt));
}

export async function getUpcomingConfirmedBookings(after: Date) {
  return db
    .select()
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, ['confirmed', 'awaiting_deposit']),
        gte(bookings.startsAt, after),
      ),
    )
    .orderBy(bookings.startsAt);
}

/** Returns bookings that are currently holding a slot (for the slot engine). */
export async function getHoldingBookings(onDate: Date) {
  const dayStart = new Date(onDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(onDate);
  dayEnd.setHours(23, 59, 59, 999);

  return db
    .select()
    .from(bookings)
    .where(
      and(
        inArray(bookings.status, ['awaiting_deposit', 'confirmed']),
        gte(bookings.startsAt, dayStart),
      ),
    );
}

export async function getBookingByPhone(phoneE164: string) {
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.phoneE164, phoneE164))
    .orderBy(desc(bookings.createdAt));
}
