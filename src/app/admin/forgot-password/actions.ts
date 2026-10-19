'use server';
import { randomBytes, createHash } from 'crypto';
import { headers } from 'next/headers';
import { db } from '@/lib/db/client';
import { owner, passwordResets } from '@/lib/db/schema';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email/send';

export type ForgotState = { sent?: boolean; error?: string };

export async function forgotPasswordAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  if (!email) return { error: 'Email is required.' };

  const hdrs = await headers();
  const ip =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    hdrs.get('x-real-ip') ??
    'unknown';

  const limit = await checkRateLimit({
    key: `forgot:ip:${ip}`,
    windowMs: 60 * 60 * 1000,
    max: 5,
  });
  if (!limit.allowed) {
    return { error: 'Too many requests. Try again later.' };
  }

  const [ownerRow] = await db.select().from(owner);
  const ownerEmail = process.env.OWNER_EMAIL?.trim() ?? '';

  // Always respond the same way to avoid revealing whether the email exists.
  if (!ownerRow || email.toLowerCase() !== ownerEmail.toLowerCase()) {
    return { sent: true };
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  await db.insert(passwordResets).values({ tokenHash, expiresAt }).onConflictDoUpdate({
    target: passwordResets.tokenHash,
    set: { expiresAt },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const resetUrl = `${siteUrl}/admin/reset-password/${token}`;

  await sendEmail({
    to: ownerEmail,
    subject: 'Reset your Claws by D admin password',
    html: `<p>Click the link below to reset your password. The link expires in 30 minutes.</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you did not request this, ignore this email.</p>`,
    text: `Reset your password: ${resetUrl}\n\nExpires in 30 minutes. Ignore if you did not request this.`,
  });

  return { sent: true };
}
