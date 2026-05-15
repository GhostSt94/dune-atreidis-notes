import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';

interface SettingsStore {
  fogOfWar: boolean;
  density: Density;
  mobileQuickAccess: boolean;
  autosaveToast: boolean;
  /**
   * Inclure les leaders valeur 10 (Paul, Baron Harkonnen, Shaddam IV,
   * Mohiam, Liet Kynes, Edric) dans le pool de leaders et le deck traîtrise.
   * Désactivé par défaut (jeu standard).
   */
  useValue10Leaders: boolean;
  toggleFog: () => void;
  setDensity: (d: Density) => void;
  toggleMobileQuickAccess: () => void;
  toggleAutosaveToast: () => void;
  toggleValue10Leaders: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      fogOfWar: false,
      density: 'comfortable',
      mobileQuickAccess: true,
      autosaveToast: true,
      useValue10Leaders: false,
      toggleFog: () => set((s) => ({ fogOfWar: !s.fogOfWar })),
      setDensity: (d) => set({ density: d }),
      toggleMobileQuickAccess: () => set((s) => ({ mobileQuickAccess: !s.mobileQuickAccess })),
      toggleAutosaveToast: () => set((s) => ({ autosaveToast: !s.autosaveToast })),
      toggleValue10Leaders: () =>
        set((s) => ({ useValue10Leaders: !s.useValue10Leaders })),
    }),
    { name: 'dune.settings' },
  ),
);
