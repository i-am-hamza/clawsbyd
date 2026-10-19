import type { Metadata } from 'next';
import { requireOwner } from '@/lib/auth/require-owner';
import { WELCOME_NOTE } from '@/content/welcome-note';
import { markWelcomeSeenAction } from './actions';
import WelcomeButton from './WelcomeButton';
import './welcome.css';

export const metadata: Metadata = { title: 'Welcome — Claws by D', robots: 'noindex' };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ again?: string; preview?: string }>;
}) {
  await requireOwner();
  const { again, preview } = await searchParams;
  const isReadOnly = again === '1' || preview === '1';

  return (
    <main className="welcome-page">
      <div className="welcome-inner">
        <p className="welcome-note-body">{WELCOME_NOTE}</p>
        <WelcomeButton
          back={isReadOnly}
          action={isReadOnly ? undefined : markWelcomeSeenAction}
        />
      </div>
    </main>
  );
}
