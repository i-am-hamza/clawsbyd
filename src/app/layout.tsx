import type { Metadata } from 'next';
import { bodoniModa, instrumentSans } from './fonts';
import './globals.css';

// Default robots: always noindex until go_live=true (gate sets X-Robots-Tag header;
// metadata provides the HTML fallback).  Per-page overrides happen in page.tsx files
// when the site is live.
export const metadata: Metadata = {
  title: { default: 'Claws by D', template: '%s | Claws by D' },
  description: 'Nail art & extensions in Ranchi. Custom press-ons shipped across India.',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  manifest: '/manifest.webmanifest',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-direction="a"
      className={[bodoniModa.variable, instrumentSans.variable].join(' ')}
    >
      <body>{children}</body>
    </html>
  );
}
