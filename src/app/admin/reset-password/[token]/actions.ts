'use server';
import { createHash } from 'crypto';
import { redirect } from 'next/navigation';
import { hash } from '@node-rs/argon2';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { owner, passwordResets, sessions } from '@/lib/db/schema';

export type ResetState = { error?: string; success?: boolean };

export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = (formData.get('token') as string | null) ?? '';
  const password = (formData.get('password') as string | null) ?? '';
  const confirm = (formData.get('confirm') as string | null) ?? '';

  if (!token) return { error: 'Invalid reset link.' };
  if (password.length < 12) return { error: 'Password must be at least 12 characters.' };
  if (password !== confirm) return { error: 'Passwords do not match.' };

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const now = new Date();

  const [resetRow] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, tokenHash),
        gt(passwordResets.expiresAt, now),
        isNull(passwordResets.usedAt),
      ),
    );

  if (!resetRow) return { error: 'This reset link is invalid or has expired.' };

  const passwordHash = await hash(password, {
    algorithm: 2, // argon2id
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  await db.transaction(async (tx) => {
    await tx
      .update(passwordResets)
      .set({ usedAt: now })
      .where(eq(passwordResets.tokenHash, tokenHash));

    await tx.update(owner).set({ passwordHash, updatedAt: now });

    // Invalidate all sessions so old sessions don't persist after a password reset.
    await tx.delete(sessions);
  });

  redirect('/admin/login?reset=1');
}
