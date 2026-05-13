import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TerritoryControl } from '@/types/territory';
import type { FactionId } from '@/types/faction';

type MapByGame = Record<string, Record<string, TerritoryControl>>;

interface MapStore {
  byGame: MapByGame;
  initForGame: (gameId: string) => void;
  removeGame: (gameId: string) => void;
  setControl: (gameId: string, territoryId: string, faction: FactionId | undefined) => void;
  setPresence: (gameId: string, territoryId: string, faction: FactionId, troops: number) => void;
  setSpice: (gameId: string, territoryId: string, hasSpice: boolean, amount?: number) => void;
  setConflict: (gameId: string, territoryId: string, inConflict: boolean) => void;
  forGame: (gameId: string) => Record<string, TerritoryControl>;
}

const empty = (territoryId: string): TerritoryControl => ({
  territoryId,
  presence: {},
  hasSpice: false,
  inConflict: false,
});

const ensure = (
  map: Record<string, TerritoryControl>,
  territoryId: string,
): TerritoryControl => map[territoryId] ?? empty(territoryId);

export const useMapStore = create<MapStore>()(
  persist(
    (set, get) => ({
      byGame: {},

      initForGame: (gameId) => {
        set((s) => ({ byGame: { ...s.byGame, [gameId]: s.byGame[gameId] ?? {} } }));
      },

      removeGame: (gameId) => {
        set((s) => {
          const next = { ...s.byGame };
          delete next[gameId];
          return { byGame: next };
        });
      },

      setControl: (gameId, territoryId, faction) => {
        const map = { ...(get().byGame[gameId] ?? {}) };
        const t = ensure(map, territoryId);
        map[territoryId] = { ...t, controllingFaction: faction };
        set((s) => ({ byGame: { ...s.byGame, [gameId]: map } }));
      },

      setPresence: (gameId, territoryId, faction, troops) => {
        const map = { ...(get().byGame[gameId] ?? {}) };
        const t = ensure(map, territoryId);
        const presence = { ...t.presence, [faction]: troops };
        if (troops <= 0) delete presence[faction];
        map[territoryId] = { ...t, presence };
        set((s) => ({ byGame: { ...s.byGame, [gameId]: map } }));
      },

      setSpice: (gameId, territoryId, hasSpice, amount) => {
        const map = { ...(get().byGame[gameId] ?? {}) };
        const t = ensure(map, territoryId);
        map[territoryId] = { ...t, hasSpice, spiceAmount: amount };
        set((s) => ({ byGame: { ...s.byGame, [gameId]: map } }));
      },

      setConflict: (gameId, territoryId, inConflict) => {
        const map = { ...(get().byGame[gameId] ?? {}) };
        const t = ensure(map, territoryId);
        map[territoryId] = { ...t, inConflict };
        set((s) => ({ byGame: { ...s.byGame, [gameId]: map } }));
      },

      forGame: (gameId) => get().byGame[gameId] ?? {},
    }),
    { name: 'dune.map' },
  ),
);
