import 'server-only';
import { db } from '@/lib/db/client';
import { media } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getMediaById(id: string) {
  const [row] = await db.select().from(media).where(eq(media.id, id));
  return row ?? null;
}

export async function getMediaByPathname(pathname: string) {
  const [row] = await db.select().from(media).where(eq(media.pathname, pathname));
  return row ?? null;
}
