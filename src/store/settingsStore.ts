import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Density = 'comfortable' | 'compact';
export type Lang = 'en' | 'fr';

// Par défaut, seule la section « cartes » est visible sur chaque panneau de faction.
const DEFAULT_HIDDEN_TRACKER_SECTIONS = ['spice', 'leaders', 'traitors'];

interface SettingsStore {
  fogOfWar: boolean;
  density: Density;
  mobileQuickAccess: boolean;
  autosaveToast: boolean;
  useValue10Leaders: boolean;
  language: Lang;
  hiddenTrackerSections: string[];
  toggleFog: () => void;
  setDensity: (d: Density) => void;
  toggleMobileQuickAccess: () => void;
  toggleAutosaveToast: () => void;
  toggleValue10Leaders: () => void;
  setLanguage: (l: Lang) => void;
  toggleTrackerSection: (section: string) => void;
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
      hiddenTrackerSections: [...DEFAULT_HIDDEN_TRACKER_SECTIONS],
      toggleFog: () => set((s) => ({ fogOfWar: !s.fogOfWar })),
      setDensity: (d) => set({ density: d }),
      toggleMobileQuickAccess: () => set((s) => ({ mobileQuickAccess: !s.mobileQuickAccess })),
      toggleAutosaveToast: () => set((s) => ({ autosaveToast: !s.autosaveToast })),
      toggleValue10Leaders: () =>
        set((s) => ({ useValue10Leaders: !s.useValue10Leaders })),
      setLanguage: (language) => set({ language }),
      toggleTrackerSection: (section) =>
        set((s) => ({
          hiddenTrackerSections: s.hiddenTrackerSections.includes(section)
            ? s.hiddenTrackerSections.filter((x) => x !== section)
            : [...s.hiddenTrackerSections, section],
        })),
    }),
    {
      name: 'dune.settings',
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as Partial<SettingsStore>;
        if (version < 1) {
          state.hiddenTrackerSections = [...DEFAULT_HIDDEN_TRACKER_SECTIONS];
        }
        return state as SettingsStore;
      },
    },
  ),
);
