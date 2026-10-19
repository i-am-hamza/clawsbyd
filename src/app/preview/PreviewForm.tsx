'use client';
import { useActionState } from 'react';
import { previewAuthAction } from './actions';

export default function PreviewForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(previewAuthAction, {});

  return (
    <form action={action} className="login-form">
      <div className="login-logo" aria-hidden="true">C</div>
      <h1 className="login-heading" style={{ marginBottom: '0.25rem' }}>Claws by D</h1>
      <p className="login-sub">Enter the preview password to continue.</p>

      {state.error && (
        <p role="alert" className="login-error">{state.error}</p>
      )}

      <input type="hidden" name="next" value={next} />

      {/* honeypot */}
      <input name="_hp" type="text" tabIndex={-1} aria-hidden="true" style={{ display: 'none' }} />

      <label className="login-label" htmlFor="pw">Password</label>
      <input
        id="pw"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="login-input"
      />

      <button type="submit" disabled={pending} className="login-btn">
        {pending ? 'Checking…' : 'Enter site'}
      </button>
    </form>
  );
}
