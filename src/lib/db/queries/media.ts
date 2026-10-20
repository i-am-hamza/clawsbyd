import 'server-only';
import { db } from '@/lib/db/client';
import { media, lookbookItems, lookbookItemMedia } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function getMediaById(id: string) {
  const [row] = await db.select().from(media).where(eq(media.id, id));
  return row ?? null;
}

export async function getMediaByPathname(pathname: string) {
  const [row] = await db.select().from(media).where(eq(media.pathname, pathname));
  return row ?? null;
}

export async function insertMedia(values: typeof media.$inferInsert) {
  const [row] = await db.insert(media).values(values).returning();
  return row!;
}

export async function deleteMedia(id: string) {
  await db.delete(media).where(eq(media.id, id));
}

export async function deleteMediaBatch(ids: string[]) {
  if (ids.length === 0) return;
  await db.delete(media).where(inArray(media.id, ids));
}

// ---------------------------------------------------------------------------
// Lookbook item mutations
// ---------------------------------------------------------------------------

export async function insertLookbookItem(
  item: typeof lookbookItems.$inferInsert,
  mediaItems: Array<{ mediaId: string; sortOrder: number; isCover: boolean }>,
) {
  return db.transaction(async (tx) => {
    const [look] = await tx.insert(lookbookItems).values(item).returning();
    if (mediaItems.length > 0) {
      await tx.insert(lookbookItemMedia).values(
        mediaItems.map((m) => ({ itemId: look!.id, ...m })),
      );
    }
    return look!;
  });
}

export async function updateLookbookItem(
  id: string,
  patch: Partial<typeof lookbookItems.$inferInsert>,
) {
  const [row] = await db
    .update(lookbookItems)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(lookbookItems.id, id))
    .returning();
  return row ?? null;
}

export async function deleteLookbookItem(id: string) {
  // Get all media IDs for this look
  const itemMedia = await db
    .select({ mediaId: lookbookItemMedia.mediaId })
    .from(lookbookItemMedia)
    .where(eq(lookbookItemMedia.itemId, id));

  await db.transaction(async (tx) => {
    await tx.delete(lookbookItemMedia).where(eq(lookbookItemMedia.itemId, id));
    await tx.delete(lookbookItems).where(eq(lookbookItems.id, id));
    if (itemMedia.length > 0) {
      await tx.delete(media).where(inArray(media.id, itemMedia.map((m) => m.mediaId)));
    }
  });

  return itemMedia.map((m) => m.mediaId);
}

export async function reorderLookbookItems(ids: string[]) {
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx
        .update(lookbookItems)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(lookbookItems.id, ids[i]!));
    }
  });
}

export async function addMediaToLookbookItem(
  itemId: string,
  mediaId: string,
  sortOrder: number,
  isCover: boolean,
) {
  await db
    .insert(lookbookItemMedia)
    .values({ itemId, mediaId, sortOrder, isCover })
    .onConflictDoUpdate({
      target: [lookbookItemMedia.itemId, lookbookItemMedia.mediaId],
      set: { sortOrder, isCover },
    });
}

export async function removeMediaFromLookbookItem(itemId: string, mediaId: string) {
  await db
    .delete(lookbookItemMedia)
    .where(and(eq(lookbookItemMedia.itemId, itemId), eq(lookbookItemMedia.mediaId, mediaId)));
}

export async function getLookbookItemCount() {
  const [row] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(lookbookItems);
  return row?.count ?? 0;
}
