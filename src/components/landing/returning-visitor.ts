import { LANDING_OPT_OUT_PARAM } from '@/lib/routes';
import { STORAGE_KEY } from '@/lib/storage';

/** Set on <html> by the pre-paint script while the redirect check is pending. */
export const RETURNING_PENDING_ATTR = 'data-returning';

/**
 * Inline script that runs before the landing paints. When the project key exists (and `?home`
 * is absent) it hides the landing (`.landing-root` in globals.css) until ReturningVisitorRedirect
 * decides, so returning visitors see no flash. New visitors and crawlers have no key and get the
 * prerendered page as is. A timeout un-hides it if the check never runs.
 */
export const returningVisitorScript = `
(function() {
  try {
    if (new URLSearchParams(location.search).has(${JSON.stringify(LANDING_OPT_OUT_PARAM)})) return;
    if (!localStorage.getItem(${JSON.stringify(STORAGE_KEY)})) return;
    var el = document.documentElement;
    el.setAttribute(${JSON.stringify(RETURNING_PENDING_ATTR)}, '');
    setTimeout(function() { el.removeAttribute(${JSON.stringify(RETURNING_PENDING_ATTR)}); }, 2000);
  } catch (e) {}
})();
`;
