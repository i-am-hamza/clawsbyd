import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'More — Claws by D Admin' };

const LINKS = [
  { href: '/admin/payments',     label: 'Payments' },
  { href: '/admin/calendar',     label: 'Calendar' },
  { href: '/admin/availability', label: 'Availability' },
  { href: '/admin/areas',        label: 'Areas' },
  { href: '/admin/services',     label: 'Services' },
  { href: '/admin/shop',         label: 'Shop' },
  { href: '/admin/reviews',      label: 'Reviews' },
  { href: '/admin/content',      label: 'Content' },
  { href: '/admin/settings',     label: 'Settings' },
];

export default function MorePage() {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '1rem' }}>More</h1>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 'var(--tap-target)',
                color: 'var(--text)',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '0 0.25rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
