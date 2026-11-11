import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Static export: generated once at build time into out/sitemap.xml.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/projects`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
