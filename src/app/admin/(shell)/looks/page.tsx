import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Looks — Claws by D Admin' };

export default function LooksPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Looks</h1>
      <p style={{ color: 'var(--text-muted)' }}>Lookbook management — coming in a later session.</p>
    </div>
  );
}
