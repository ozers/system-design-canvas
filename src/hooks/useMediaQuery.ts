'use client';

import { useCallback, useSyncExternalStore } from 'react';

/** Subscribe to a CSS media query. Server render assumes no match. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

/** Below 900px: library becomes a bottom sheet, editors become drawers. */
export function useIsNarrow() {
  return useMediaQuery('(max-width: 899px)');
}
