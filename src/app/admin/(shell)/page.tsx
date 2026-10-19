import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard — Claws by D Admin' };

export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>
        Home
      </h1>
      <p style={{ color: 'var(--text-muted)' }}>Dashboard — coming in a later session.</p>
    </div>
  );
}
