import { CF_BEACON_TOKEN } from '@/lib/site';

/**
 * Cloudflare Web Analytics beacon, rendered only when NEXT_PUBLIC_CF_BEACON_TOKEN was set
 * at build time. Snippet as documented for manual setup:
 * https://developers.cloudflare.com/web-analytics/faq/ ("Can I add Web Analytics to my site
 * using a tag manager…"). It reports to cloudflareinsights.com; a CSP would need
 * static.cloudflareinsights.com in script-src and cloudflareinsights.com in connect-src.
 */
export function AnalyticsBeacon() {
  if (!CF_BEACON_TOKEN) return null;
  return (
    <script
      type="module"
      // Module scripts are deferred anyway; `defer` changes nothing but satisfies no-sync-scripts.
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
    />
  );
}
