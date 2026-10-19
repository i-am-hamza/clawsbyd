import type { Metadata } from 'next';
import ForgotForm from './ForgotForm';
import '../login/login.css';

export const metadata: Metadata = {
  title: 'Forgot password — Claws by D Admin',
  robots: 'noindex',
};

export default function ForgotPasswordPage() {
  return (
    <main className="login-page">
      <ForgotForm />
    </main>
  );
}
