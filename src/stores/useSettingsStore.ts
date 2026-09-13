import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';

const LEGACY_THEME_KEY = 'system-design-canvas-theme';

interface SettingsStore {
  theme: ThemePreference;
  snap: boolean;
  minimap: boolean;
  validation: boolean;
  animatedEdges: boolean;
  /** True once persisted values have been read (client only). */
  hydrated: boolean;

  setTheme: (theme: ThemePreference) => void;
  setSnap: (value: boolean) => void;
  setMinimap: (value: boolean) => void;
  setValidation: (value: boolean) => void;
  setAnimatedEdges: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: 'system',
      snap: false,
      minimap: true,
      validation: true,
      animatedEdges: true,
      hydrated: false,

      setTheme: (theme) => set({ theme }),
      setSnap: (snap) => set({ snap }),
      setMinimap: (minimap) => set({ minimap }),
      setValidation: (validation) => set({ validation }),
      setAnimatedEdges: (animatedEdges) => set({ animatedEdges }),
    }),
    {
      name: 'sdc.settings',
      storage: createJSONStorage(() => localStorage),
      // Rehydrated manually in Providers so server and first client render match.
      skipHydration: true,
      partialize: ({ theme, snap, minimap, validation, animatedEdges }) => ({
        theme,
        snap,
        minimap,
        validation,
        animatedEdges,
      }),
    }
  )
);

/** Read persisted settings once on the client, migrating the legacy theme key. */
export async function hydrateSettings() {
  const hadSettings = localStorage.getItem('sdc.settings') !== null;
  await useSettingsStore.persist.rehydrate();
  if (!hadSettings) {
    const legacy = localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy === 'dark' || legacy === 'light') {
      useSettingsStore.getState().setTheme(legacy);
    }
  }
  useSettingsStore.setState({ hydrated: true });
}
