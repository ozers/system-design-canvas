'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useSettingsStore, type ThemePreference } from '@/stores/useSettingsStore';

export type ResolvedTheme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function subscribeSystem(listener: () => void) {
  const mq = window.matchMedia(DARK_QUERY);
  mq.addEventListener('change', listener);
  return () => mq.removeEventListener('change', listener);
}

function getSystemSnapshot(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function getServerSnapshot(): ResolvedTheme {
  return 'light';
}

function resolve(preference: ThemePreference, system: ResolvedTheme): ResolvedTheme {
  return preference === 'system' ? system : preference;
}

/** Current theme preference plus the resolved light/dark value. */
export function useTheme() {
  const preference = useSettingsStore((s) => s.theme);
  const setPreference = useSettingsStore((s) => s.setTheme);
  const system = useSyncExternalStore(subscribeSystem, getSystemSnapshot, getServerSnapshot);
  const theme = resolve(preference, system);

  const toggleTheme = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setPreference]);

  return { theme, preference, setPreference, toggleTheme };
}

/** Mount once (in Providers): keeps <html data-theme> in sync with settings. */
export function useApplyTheme() {
  const hydrated = useSettingsStore((s) => s.hydrated);
  const { theme } = useTheme();

  useEffect(() => {
    // Before rehydration the store holds defaults; the inline head script already set the right value.
    if (!hydrated) return;
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme, hydrated]);
}
