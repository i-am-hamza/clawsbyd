'use client';
import { useActionState } from 'react';
import { resetPasswordAction } from './actions';

export default function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {});

  return (
    <form action={action} className="login-form">
      <h1 className="login-heading">Reset password</h1>

      {state.error && (
        <p role="alert" className="login-error">{state.error}</p>
      )}

      <input type="hidden" name="token" value={token} />

      <label className="login-label" htmlFor="password">New password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        className="login-input"
      />

      <label className="login-label" htmlFor="confirm">Confirm password</label>
      <input
        id="confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        className="login-input"
      />

      <button type="submit" disabled={pending} className="login-btn">
        {pending ? 'Saving…' : 'Set new password'}
      </button>
    </form>
  );
}
