import 'server-only';
import { db } from '@/lib/db/client';
import { reviews } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getApprovedReviews(isLive: boolean) {
  if (!isLive) {
    // While not live, include placeholder reviews
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.status, 'approved'))
      .orderBy(desc(reviews.createdAt));
  }
  // When live, exclude placeholders
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.status, 'approved'), eq(reviews.isPlaceholder, false)))
    .orderBy(desc(reviews.createdAt));
}

export async function getFeaturedReviews(isLive: boolean) {
  if (!isLive) {
    return db
      .select()
      .from(reviews)
      .where(and(eq(reviews.status, 'approved'), eq(reviews.isFeatured, true)))
      .orderBy(desc(reviews.createdAt));
  }
  return db
    .select()
    .from(reviews)
    .where(
      and(
        eq(reviews.status, 'approved'),
        eq(reviews.isFeatured, true),
        eq(reviews.isPlaceholder, false),
      ),
    )
    .orderBy(desc(reviews.createdAt));
}

export async function getReviewByBookingRef(_ref: string) {
  // TODO: join on bookings — implement when bookings queries are complete
  return null;
}
