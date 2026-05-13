import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { now } from '@/lib/date';
import type { Traitor } from '@/types/traitor';
import type { FactionId } from '@/types/faction';

export const MAX_TRAITORS_PER_FACTION = 4;

interface TraitorsStore {
  traitors: Traitor[];
  addSlot: (gameId: string, factionId: FactionId) => Traitor | null;
  assignLeader: (
    id: string,
    leaderFactionId: FactionId,
    leaderName: string,
  ) => void;
  clearLeader: (id: string) => void;
  toggleActive: (id: string) => void;
  removeSlot: (id: string) => void;
  clearForGame: (gameId: string) => void;
  forFaction: (gameId: string, factionId: FactionId) => Traitor[];
  forGame: (gameId: string) => Traitor[];
}

export const useTraitorsStore = create<TraitorsStore>()(
  persist(
    (set, get) => ({
      traitors: [],

      addSlot: (gameId, factionId) => {
        const existing = get().traitors.filter(
          (t) => t.gameId === gameId && t.factionId === factionId,
        );
        if (existing.length >= MAX_TRAITORS_PER_FACTION) return null;

        // Harkonnen : tous les traîtres sont actifs.
        // Autres factions : 1 seul actif. Le premier slot l'est par défaut.
        const isHarkonnen = factionId === 'harkonnen';
        const defaultActive = isHarkonnen || existing.length === 0;

        const created: Traitor = {
          id: newId(),
          gameId,
          factionId,
          leaderFactionId: undefined,
          leaderName: undefined,
          active: defaultActive,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ traitors: [...s.traitors, created] }));
        return created;
      },

      assignLeader: (id, leaderFactionId, leaderName) => {
        set((s) => ({
          traitors: s.traitors.map((t) =>
            t.id === id ? { ...t, leaderFactionId, leaderName, updatedAt: now() } : t,
          ),
        }));
      },

      clearLeader: (id) => {
        set((s) => ({
          traitors: s.traitors.map((t) =>
            t.id === id
              ? { ...t, leaderFactionId: undefined, leaderName: undefined, updatedAt: now() }
              : t,
          ),
        }));
      },

      toggleActive: (id) => {
        const target = get().traitors.find((t) => t.id === id);
        if (!target) return;

        // Harkonnen : tous les traîtres sont actifs en permanence — on bloque le toggle.
        if (target.factionId === 'harkonnen') return;

        // Autres factions : un seul actif à la fois.
        const becomingActive = !target.active;
        set((s) => ({
          traitors: s.traitors.map((t) => {
            if (t.id === id) return { ...t, active: becomingActive, updatedAt: now() };
            if (
              becomingActive &&
              t.gameId === target.gameId &&
              t.factionId === target.factionId
            ) {
              return { ...t, active: false, updatedAt: now() };
            }
            return t;
          }),
        }));
      },

      removeSlot: (id) => {
        set((s) => ({ traitors: s.traitors.filter((t) => t.id !== id) }));
      },

      clearForGame: (gameId) => {
        set((s) => ({ traitors: s.traitors.filter((t) => t.gameId !== gameId) }));
      },

      forFaction: (gameId, factionId) =>
        get()
          .traitors.filter((t) => t.gameId === gameId && t.factionId === factionId)
          .sort((a, b) => a.createdAt - b.createdAt),

      forGame: (gameId) => get().traitors.filter((t) => t.gameId === gameId),
    }),
    { name: 'dune.traitors' },
  ),
);
