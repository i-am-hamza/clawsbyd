import 'server-only';
import { db } from '@/lib/db/client';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateSetting } from '@/lib/settings/registry';

export async function getSettingRow(key: string) {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return row ?? null;
}

export async function getAllSettingRows() {
  return db.select().from(settings);
}

export async function upsertSetting(key: string, value: unknown): Promise<void> {
  const validated = validateSetting(key, value);
  await db
    .insert(settings)
    .values({ key, value: validated as Record<string, unknown> })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: validated as Record<string, unknown>, updatedAt: new Date() },
    });
  // Cache tag invalidation is called by the server action after upsert
}
