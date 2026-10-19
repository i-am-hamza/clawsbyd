'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin',              label: 'Home' },
  { href: '/admin/bookings',     label: 'Bookings' },
  { href: '/admin/orders',       label: 'Orders' },
  { href: '/admin/looks',        label: 'Looks' },
  { section: 'More' },
  { href: '/admin/payments',     label: 'Payments' },
  { href: '/admin/calendar',     label: 'Calendar' },
  { href: '/admin/availability', label: 'Availability' },
  { href: '/admin/areas',        label: 'Areas' },
  { href: '/admin/services',     label: 'Services' },
  { href: '/admin/shop',         label: 'Shop' },
  { href: '/admin/reviews',      label: 'Reviews' },
  { href: '/admin/content',      label: 'Content' },
  { href: '/admin/settings',     label: 'Settings' },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar" aria-label="Admin navigation">
      {NAV.map((item) => {
        if ('section' in item) {
          return (
            <p key={item.section} className="admin-sidebar-section">
              {item.section}
            </p>
          );
        }
        const active =
          (item as { href: string }).href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith((item as { href: string }).href);
        return (
          <Link
            key={(item as { href: string }).href}
            href={(item as { href: string }).href}
            className="admin-sidebar-link"
            aria-current={active ? 'page' : undefined}
          >
            {(item as { label: string }).label}
          </Link>
        );
      })}
    </nav>
  );
}
