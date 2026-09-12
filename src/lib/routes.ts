/**
 * App routes. The canvas takes the project id as a query parameter so the app can be
 * exported as static files (no dynamic segments) and served from any static host.
 */
export function canvasPath(projectId: string) {
  return `/canvas?id=${encodeURIComponent(projectId)}`;
}
