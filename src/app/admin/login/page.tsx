import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, getSessionRow } from '@/lib/auth/session';
import LoginForm from './LoginForm';
import './login.css';

export const metadata: Metadata = { title: 'Sign in — Claws by D Admin', robots: 'noindex' };

export default async function LoginPage() {
  // Already logged in → go to dashboard.
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    const session = await getSessionRow(token).catch(() => null);
    if (session) redirect('/admin');
  }

  return (
    <main className="login-page">
      <LoginForm />
    </main>
  );
}
