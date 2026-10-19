import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bookings — Claws by D Admin' };

export default function BookingsPage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Bookings</h1>
      <p style={{ color: 'var(--text-muted)' }}>Booking management — coming in a later session.</p>
    </div>
  );
}
