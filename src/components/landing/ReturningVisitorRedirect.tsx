'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DASHBOARD_PATH, shouldOpenDashboard } from '@/lib/routes';
import { countStoredProjects } from '@/lib/storage';
import { RETURNING_PENDING_ATTR } from './returning-visitor';

/**
 * Sends a browser that already has saved projects from `/` to the dashboard.
 * Opt-out: `/?home` (LANDING_PATH) keeps the landing open; the brand links use it.
 * Empty, missing or corrupt storage keeps the landing.
 */
export function ReturningVisitorRedirect() {
  const router = useRouter();
  useEffect(() => {
    const root = document.documentElement;
    if (shouldOpenDashboard(window.location.search, countStoredProjects())) {
      router.replace(DASHBOARD_PATH);
    } else {
      root.removeAttribute(RETURNING_PENDING_ATTR);
    }
    return () => root.removeAttribute(RETURNING_PENDING_ATTR);
  }, [router]);
  return null;
}
