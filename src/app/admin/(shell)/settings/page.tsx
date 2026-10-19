import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Settings — Claws by D Admin' };
export default function SettingsPage() {
  return <div><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>Settings</h1><p style={{ color: 'var(--text-muted)' }}>Site settings — coming in a later session.</p></div>;
}
