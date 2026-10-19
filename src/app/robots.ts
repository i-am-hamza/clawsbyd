import type { MetadataRoute } from 'next';
import { getSettingsUncached } from '@/lib/settings/read';

export default async function robots(): Promise<MetadataRoute.Robots> {
  let live = false;
  try {
    const s = await getSettingsUncached();
    live = s['site.go_live'];
  } catch {
    // Fail closed.
  }

  if (!live) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/sitemap.xml`,
  };
}
