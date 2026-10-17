import 'server-only';
import { db } from '@/lib/db/client';
import { lookbookItems, lookbookItemMedia, media } from '@/lib/db/schema';
import { eq, and, asc, desc, inArray } from 'drizzle-orm';

export async function getLookbookItems(opts?: { publishedOnly?: boolean }) {
  const query = db
    .select()
    .from(lookbookItems)
    .orderBy(asc(lookbookItems.sortOrder), desc(lookbookItems.createdAt));

  if (opts?.publishedOnly) {
    return db
      .select()
      .from(lookbookItems)
      .where(eq(lookbookItems.isPublished, true))
      .orderBy(asc(lookbookItems.sortOrder), desc(lookbookItems.createdAt));
  }

  return query;
}

export async function getLookbookItemBySlug(slug: string) {
  const [item] = await db
    .select()
    .from(lookbookItems)
    .where(eq(lookbookItems.slug, slug));
  return item ?? null;
}

export async function getFeaturedLooks(limit = 6) {
  return db
    .select()
    .from(lookbookItems)
    .where(and(eq(lookbookItems.isFeatured, true), eq(lookbookItems.isPublished, true)))
    .orderBy(asc(lookbookItems.sortOrder))
    .limit(limit);
}

export async function getLatestPublishedLooks(limit = 6) {
  return db
    .select()
    .from(lookbookItems)
    .where(eq(lookbookItems.isPublished, true))
    .orderBy(desc(lookbookItems.publishedAt), desc(lookbookItems.createdAt))
    .limit(limit);
}

export async function getLookbookItemMedia(itemId: string) {
  return db
    .select({ media, sortOrder: lookbookItemMedia.sortOrder, isCover: lookbookItemMedia.isCover })
    .from(lookbookItemMedia)
    .innerJoin(media, eq(media.id, lookbookItemMedia.mediaId))
    .where(eq(lookbookItemMedia.itemId, itemId))
    .orderBy(asc(lookbookItemMedia.sortOrder));
}

export async function getCoverMedia(itemIds: string[]) {
  if (itemIds.length === 0) return [];
  return db
    .select({ itemId: lookbookItemMedia.itemId, media })
    .from(lookbookItemMedia)
    .innerJoin(media, eq(media.id, lookbookItemMedia.mediaId))
    .where(and(inArray(lookbookItemMedia.itemId, itemIds), eq(lookbookItemMedia.isCover, true)));
}
