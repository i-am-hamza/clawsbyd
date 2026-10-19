import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Reviews — Claws by D Admin' };
export default function ReviewsPage() {
  return <div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Reviews</h1><p style={{ color: 'var(--text-muted)' }}>Review moderation — coming in a later session.</p></div>;
}
