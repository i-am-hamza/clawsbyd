import type { Metadata } from 'next';
import { bodoniModa, instrumentSans } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Claws by D', template: '%s | Claws by D' },
  description: 'Nail art & extensions in Ranchi. Custom press-ons shipped across India.',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  manifest: '/manifest.webmanifest',
  robots: 'noindex, nofollow', // overridden when go_live=true
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-direction="a"
      className={[
        bodoniModa.variable,
        instrumentSans.variable,
      ].join(' ')}
    >
      <body>{children}</body>
    </html>
  );
}
