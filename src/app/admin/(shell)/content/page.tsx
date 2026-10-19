import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Content — Claws by D Admin' };
export default function ContentPage() {
  return <div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Content</h1><p style={{ color: 'var(--text-muted)' }}>Content editor — coming in a later session.</p></div>;
}
