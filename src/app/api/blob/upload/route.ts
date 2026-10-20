import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse, type NextRequest } from 'next/server';
import { getSessionRow } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/rate-limit';
import { publicBlobToken, privateBlobToken } from '@/lib/images/storage';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (before compression)

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const kind = clientPayload as string | undefined;
        const isInspiration = kind === 'inspiration';

        if (isInspiration) {
          // Customer inspiration: rate limit, any visitor allowed
          const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
          const rl = await checkRateLimit({ key: `upload:${ip}`, windowMs: 3_600_000, max: 30 });
          if (!rl.allowed) {
            throw new Error('Rate limit exceeded — try again later');
          }
          return {
            allowedContentTypes: ALLOWED_IMAGE_TYPES,
            maximumSizeInBytes: MAX_SIZE_BYTES,
            addRandomSuffix: true,
            tokenPayload: 'inspiration',
            // Private store token
            token: privateBlobToken(),
          };
        }

        // Admin upload (portfolio, products, brand, reviews): require owner session
        const cookieHeader = request.headers.get('cookie') ?? '';
        const match = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
        const token = match?.[1];
        if (!token) throw new Error('Unauthenticated');
        const session = await getSessionRow(token);
        if (!session) throw new Error('Unauthenticated');

        return {
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          maximumSizeInBytes: MAX_SIZE_BYTES,
          addRandomSuffix: true,
          tokenPayload: kind ?? 'portfolio',
          token: publicBlobToken(),
        };
      },

      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Callers record the media row themselves after receiving the blob URL.
        // tokenPayload carries the kind so callers can use it if needed.
        void blob;
        void tokenPayload;
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
