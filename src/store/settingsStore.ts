import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';

interface SettingsStore {
  fogOfWar: boolean;
  density: Density;
  mobileQuickAccess: boolean;
  autosaveToast: boolean;
  toggleFog: () => void;
  setDensity: (d: Density) => void;
  toggleMobileQuickAccess: () => void;
  toggleAutosaveToast: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      fogOfWar: false,
      density: 'comfortable',
      mobileQuickAccess: true,
      autosaveToast: true,
      toggleFog: () => set((s) => ({ fogOfWar: !s.fogOfWar })),
      setDensity: (d) => set({ density: d }),
      toggleMobileQuickAccess: () => set((s) => ({ mobileQuickAccess: !s.mobileQuickAccess })),
      toggleAutosaveToast: () => set((s) => ({ autosaveToast: !s.autosaveToast })),
    }),
    { name: 'dune.settings' },
  ),
);
