import type { MetadataRoute } from 'next';
import { notFound } from 'next/navigation';
import { getSettingsUncached } from '@/lib/settings/read';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let live = false;
  try {
    const s = await getSettingsUncached();
    live = s['site.go_live'];
  } catch {
    // Fail closed.
  }

  if (!live) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/book`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/shop`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/looks`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ];
}
