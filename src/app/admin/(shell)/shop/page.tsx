import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Shop — Claws by D Admin' };
export default function ShopPage() {
  return <div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Shop</h1><p style={{ color: 'var(--text-muted)' }}>Press-on products — coming in a later session.</p></div>;
}
