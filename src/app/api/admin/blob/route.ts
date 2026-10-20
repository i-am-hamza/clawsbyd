/**
 * Authenticated proxy for private Blob store.
 * Admin views inspiration photos through this route — never via next/image or a public URL.
 *
 * Usage: GET /api/admin/blob?url=<encoded-blob-url>
 */
import { type NextRequest, NextResponse } from 'next/server';
import { getSessionRow, COOKIE_NAME } from '@/lib/auth/session';
import { fetchPrivateBlob } from '@/lib/images/storage';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Manual session check: requireOwner uses redirect() which is meant for RSC/layouts,
  // not Route Handlers. Here we return 401 JSON instead of redirecting.
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  const token = match?.[1];
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const session = await getSessionRow(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = request.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url param' }, { status: 400 });

  let decoded: string;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  // Only allow URLs from Vercel Blob storage
  if (!decoded.includes('vercel-storage.com')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const blobResponse = await fetchPrivateBlob(decoded);
    const contentType = blobResponse.headers.get('Content-Type') ?? 'application/octet-stream';

    return new NextResponse(blobResponse.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Blob not found' }, { status: 404 });
  }
}
