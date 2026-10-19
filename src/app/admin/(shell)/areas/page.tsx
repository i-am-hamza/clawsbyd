import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Areas — Claws by D Admin' };
export default function AreasPage() {
  return <div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Areas</h1><p style={{ color: 'var(--text-muted)' }}>Home-visit areas — coming in a later session.</p></div>;
}
