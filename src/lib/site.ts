/** Canonical public URL (Cloudflare Workers static assets). Used for metadata, sitemap and robots. */
export const SITE_URL = 'https://system-design-canvas.ozersubasi-dev.workers.dev';

/**
 * Cloudflare Web Analytics site token, inlined at build time. Unset (the default)
 * means no beacon script and no analytics request of any kind.
 */
export const CF_BEACON_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN?.trim() || null;

/** What the beacon collects and what it doesn't (linked from the landing privacy copy). */
export const CF_WEB_ANALYTICS_DOCS_URL = 'https://developers.cloudflare.com/web-analytics/about/';
