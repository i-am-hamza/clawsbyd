import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Calendar — Claws by D Admin' };
export default function CalendarPage() {
  return <div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Calendar</h1><p style={{ color: 'var(--text-muted)' }}>Calendar view — coming in a later session.</p></div>;
}
