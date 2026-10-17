import 'server-only';
import { db } from '@/lib/db/client';
import { products, productMedia, media } from '@/lib/db/schema';
import { eq, asc, and } from 'drizzle-orm';

export async function getProducts(activeOnly = true) {
  if (activeOnly) {
    return db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.sortOrder));
  }
  return db.select().from(products).orderBy(asc(products.sortOrder));
}

export async function getProductBySlug(slug: string) {
  const [product] = await db.select().from(products).where(eq(products.slug, slug));
  return product ?? null;
}

export async function getProductMedia(productId: string) {
  return db
    .select({ media, sortOrder: productMedia.sortOrder, isCover: productMedia.isCover })
    .from(productMedia)
    .innerJoin(media, eq(media.id, productMedia.mediaId))
    .where(eq(productMedia.productId, productId))
    .orderBy(asc(productMedia.sortOrder));
}

export async function getProductCoverMedia(productId: string) {
  const [row] = await db
    .select({ media })
    .from(productMedia)
    .innerJoin(media, eq(media.id, productMedia.mediaId))
    .where(and(eq(productMedia.productId, productId), eq(productMedia.isCover, true)));
  return row?.media ?? null;
}
