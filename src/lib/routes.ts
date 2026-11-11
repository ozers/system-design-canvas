/** Project list. The site root is the landing page. */
export const DASHBOARD_PATH = '/projects';

/**
 * Query parameter that keeps the landing page open. Without it, `/` sends a browser that
 * already has saved projects to DASHBOARD_PATH (see ReturningVisitorRedirect).
 */
export const LANDING_OPT_OUT_PARAM = 'home';
/** The landing page, shown even to returning visitors. Brand links use this. */
export const LANDING_PATH = `/?${LANDING_OPT_OUT_PARAM}`;

/**
 * Whether the landing page at `/` should send the visitor to the dashboard.
 * `search` is `location.search`; `savedProjects` is the number of valid saved projects.
 */
export function shouldOpenDashboard(search: string, savedProjects: number): boolean {
  if (new URLSearchParams(search).has(LANDING_OPT_OUT_PARAM)) return false;
  return savedProjects > 0;
}

/**
 * App routes. The canvas takes the project id as a query parameter so the app can be
 * exported as static files (no dynamic segments) and served from any static host.
 */
export function canvasPath(projectId: string) {
  return `/canvas?id=${encodeURIComponent(projectId)}`;
}
