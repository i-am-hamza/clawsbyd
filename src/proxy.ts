/**
 * proxy.ts — request interception (Next.js 16 renamed middleware to proxy).
 * Full gate implementation in session 3 (§14.1).
 *
 * Gate rules (TODO session 3):
 * - /admin/* → require session cookie
 * - go_live=false + no preview cookie → redirect to /preview
 * - X-Robots-Tag: noindex while not live
 * - Fail closed: unreadable flag → treat as not live
 */

import { type NextRequest, NextResponse } from 'next/server';

export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|apple-touch|manifest|api/blob|api/cron).*)',
  ],
};
