'use client';
import { useActionState } from 'react';
import { forgotPasswordAction } from './actions';

export default function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {});

  if (state.sent) {
    return (
      <div className="login-form" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--text)', marginBottom: '1rem' }}>
          If that email is registered, a reset link has been sent. Check your inbox.
        </p>
        <a href="/admin/login" className="login-link">Back to sign in</a>
      </div>
    );
  }

  return (
    <form action={action} className="login-form">
      <h1 className="login-heading">Forgot password</h1>
      <p className="login-sub" style={{ marginBottom: '0.5rem' }}>
        Enter your email and we'll send a reset link.
      </p>

      {state.error && (
        <p role="alert" className="login-error">{state.error}</p>
      )}

      <label className="login-label" htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="login-input"
      />

      <button type="submit" disabled={pending} className="login-btn">
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
      <a href="/admin/login" className="login-link">Back to sign in</a>
    </form>
  );
}
