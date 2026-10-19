import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Orders — Claws by D Admin' };

export default function OrdersPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Orders</h1>
      <p style={{ color: 'var(--text-muted)' }}>Order management — coming in a later session.</p>
    </div>
  );
}
