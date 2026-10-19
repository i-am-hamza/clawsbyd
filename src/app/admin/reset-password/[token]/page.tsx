import type { Metadata } from 'next';
import { createHash } from 'crypto';
import { and, gt, isNull, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { passwordResets } from '@/lib/db/schema';
import ResetForm from './ResetForm';
import '../../login/login.css';

export const metadata: Metadata = {
  title: 'Reset password — Claws by D Admin',
  robots: 'noindex',
};

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const now = new Date();

  const [row] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, tokenHash),
        gt(passwordResets.expiresAt, now),
        isNull(passwordResets.usedAt),
      ),
    );

  if (!row) {
    return (
      <main className="login-page">
        <div className="login-form" style={{ textAlign: 'center' }}>
          <p className="login-error">This reset link is invalid or has expired.</p>
          <a href="/admin/forgot-password" className="login-link">
            Request a new link
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <ResetForm token={token} />
    </main>
  );
}
