import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Payments — Claws by D Admin' };
export default function PaymentsPage() {
  return <div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Payments</h1><p style={{ color: 'var(--text-muted)' }}>Payment log — coming in a later session.</p></div>;
}
