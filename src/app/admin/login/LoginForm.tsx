'use client';
import { useActionState } from 'react';
import { loginAction } from './actions';

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="login-form">
      <div className="login-logo" aria-hidden="true">C</div>
      <h1 className="login-heading">Claws by D</h1>
      <p className="login-sub">Admin</p>

      {state.error && (
        <p role="alert" className="login-error">
          {state.error}
        </p>
      )}

      <label className="login-label" htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className="login-input"
        aria-describedby={state.error ? 'login-err' : undefined}
      />

      <label className="login-label" htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="login-input"
      />

      {/* honeypot */}
      <input name="_hp" type="text" tabIndex={-1} aria-hidden="true" style={{ display: 'none' }} />

      <button type="submit" disabled={pending} className="login-btn">
        {pending ? 'Signing in…' : 'Sign in'}
      </button>

      <a href="/admin/forgot-password" className="login-link">
        Forgot password?
      </a>
    </form>
  );
}
