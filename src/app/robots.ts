import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Static export: generated once at build time into out/robots.txt.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    // Canvas, share links, import and settings only make sense with local data.
    rules: { userAgent: '*', allow: '/', disallow: ['/canvas', '/import', '/settings'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
