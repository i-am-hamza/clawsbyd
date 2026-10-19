/**
 * Sanitise the `next` redirect parameter used by the preview gate.
 * Accepts only a relative path that starts with a single "/".
 * Rejects anything that could cause an open redirect or a redirect loop.
 */
export function sanitizeNextPath(next: string | undefined | null): string {
  if (typeof next !== 'string') return '/';
  if (!next.startsWith('/')) return '/';
  if (next.startsWith('//')) return '/';
  if (next.startsWith('/preview')) return '/';
  if (next.includes('next=')) return '/';
  return next;
}
