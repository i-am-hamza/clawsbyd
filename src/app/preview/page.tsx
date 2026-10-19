import type { Metadata } from 'next';
import PreviewForm from './PreviewForm';
import { sanitizeNextPath } from '@/lib/gate/sanitize-next';
import '../admin/login/login.css';

export const metadata: Metadata = {
  title: 'Preview — Claws by D',
  robots: 'noindex, nofollow',
};

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safePath = sanitizeNextPath(next);
  return (
    <main className="login-page">
      <PreviewForm next={safePath} />
    </main>
  );
}
