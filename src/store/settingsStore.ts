import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';
export type Lang = 'en' | 'fr';

interface SettingsStore {
  fogOfWar: boolean;
  density: Density;
  mobileQuickAccess: boolean;
  autosaveToast: boolean;
  useValue10Leaders: boolean;
  language: Lang;
  toggleFog: () => void;
  setDensity: (d: Density) => void;
  toggleMobileQuickAccess: () => void;
  toggleAutosaveToast: () => void;
  toggleValue10Leaders: () => void;
  setLanguage: (l: Lang) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      fogOfWar: false,
      density: 'comfortable',
      mobileQuickAccess: true,
      autosaveToast: true,
      useValue10Leaders: false,
      language: 'en',
      toggleFog: () => set((s) => ({ fogOfWar: !s.fogOfWar })),
      setDensity: (d) => set({ density: d }),
      toggleMobileQuickAccess: () => set((s) => ({ mobileQuickAccess: !s.mobileQuickAccess })),
      toggleAutosaveToast: () => set((s) => ({ autosaveToast: !s.autosaveToast })),
      toggleValue10Leaders: () =>
        set((s) => ({ useValue10Leaders: !s.useValue10Leaders })),
      setLanguage: (language) => set({ language }),
    }),
    { name: 'dune.settings' },
  ),
);
