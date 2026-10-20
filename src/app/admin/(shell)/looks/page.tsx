import type { Metadata } from 'next';
import { getLookbookItems, getLookbookItemMedia } from '@/lib/db/queries/lookbook';
import LooksClient from './LooksClient';

export const metadata: Metadata = { title: 'Looks — Claws by D Admin' };

export default async function LooksPage() {
  const items = await getLookbookItems();

  const looks = await Promise.all(
    items.map(async (item) => {
      const mediaItems = await getLookbookItemMedia(item.id);
      return {
        id: item.id,
        slug: item.slug,
        title: item.title,
        caption: item.caption,
        glamLevel: item.glamLevel,
        shape: item.shape,
        length: item.length,
        occasions: item.occasions as string[],
        colours: item.colours as string[],
        isFeatured: item.isFeatured,
        isPublished: item.isPublished,
        isPlaceholder: item.isPlaceholder,
        sortOrder: item.sortOrder,
        mediaItems: mediaItems.map((m) => ({
          media: {
            id: m.media.id,
            url: m.media.url,
            pathname: m.media.pathname,
            width: m.media.width,
            height: m.media.height,
            blurDataUrl: m.media.blurDataUrl,
            alt: m.media.alt,
          },
          sortOrder: m.sortOrder,
          isCover: m.isCover,
        })),
      };
    }),
  );

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', padding: '12px 16px 0' }}>
        Looks
      </h1>
      <LooksClient initialLooks={looks} />
    </div>
  );
}
