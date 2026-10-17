/**
 * Set the owner password interactively.
 * Usage: pnpm owner:set-password
 * Never accepts the password as a CLI argument — it is always prompted.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createInterface } from 'readline';
import { hash } from '@node-rs/argon2';
import { db } from '../src/lib/db/client';
import { owner } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) throw new Error('OWNER_EMAIL is not set');

  const password = await prompt('New password: ');
  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }

  const passwordHash = await hash(password, {
    algorithm: 2, // argon2id
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const [row] = await db.select().from(owner).where(eq(owner.email, ownerEmail));
  if (!row) {
    await db.insert(owner).values({ email: ownerEmail, passwordHash });
    console.log(`Owner row created for ${ownerEmail}.`);
  } else {
    await db.update(owner).set({ passwordHash }).where(eq(owner.email, ownerEmail));
    console.log(`Password updated for ${ownerEmail}.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
