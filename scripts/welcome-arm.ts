/**
 * Reset welcome_seen_at to null so the welcome note re-shows on next login.
 * Run on reveal day: pnpm welcome:arm
 * Asks for confirmation and prints which database it is about to touch.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createInterface } from 'readline';
import { isNull } from 'drizzle-orm';
import { db } from '../src/lib/db/client';
import { owner } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

/** Return a safe printable version of the DATABASE_URL (hides credentials). */
function safeDbUrl(url: string): string {
  try {
    const u = new URL(url);
    u.password = '***';
    u.username = u.username ? '***' : '';
    return u.toString();
  } catch {
    return '(unparseable URL)';
  }
}

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL?.trim();
  if (!ownerEmail) throw new Error('OWNER_EMAIL is not set');

  const dbUrl = process.env.DATABASE_URL ?? '';
  console.log(`\nDatabase : ${safeDbUrl(dbUrl)}`);
  console.log(`Owner    : ${ownerEmail}`);
  console.log('');
  console.log('This will reset welcome_seen_at to NULL so the welcome note');
  console.log('shows again on the next login.\n');

  const answer = await ask('Type "yes" to confirm: ');
  if (answer.toLowerCase() !== 'yes') {
    console.log('Aborted.');
    process.exit(0);
  }

  const [row] = await db.select().from(owner).where(eq(owner.email, ownerEmail));
  if (!row) {
    console.error(`No owner found for ${ownerEmail}.`);
    process.exit(1);
  }

  await db
    .update(owner)
    .set({ welcomeSeenAt: null })
    .where(eq(owner.email, ownerEmail));

  console.log(`\nDone. welcome_seen_at reset to NULL for ${ownerEmail}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
