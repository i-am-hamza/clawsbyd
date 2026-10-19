'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin',          label: 'Home',     icon: '⌂' },
  { href: '/admin/bookings', label: 'Bookings', icon: '▦' },
  { href: '/admin/orders',   label: 'Orders',   icon: '□' },
  { href: '/admin/looks',    label: 'Looks',    icon: '◆' },
  { href: '/admin/more',     label: 'More',     icon: '…' },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="admin-tabbar" aria-label="Admin navigation">
      {TABS.map(({ href, label, icon }) => {
        const active =
          href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="admin-tab"
            aria-current={active ? 'page' : undefined}
          >
            <span className="admin-tab-icon" aria-hidden="true">{icon}</span>
            <span className="admin-tab-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
