/**
 * Reset welcome_seen_at to null so the welcome note shows again on next login.
 * Run on reveal day: pnpm welcome:arm
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../src/lib/db/client';
import { owner } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) throw new Error('OWNER_EMAIL is not set');

  await db
    .update(owner)
    .set({ welcomeSeenAt: sql`NULL` })
    .where(eq(owner.email, ownerEmail));

  console.log(`welcome_seen_at reset to null for ${ownerEmail}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
