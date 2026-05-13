import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { now } from '@/lib/date';
import type { CardTrackerEntry } from '@/types/card';

interface CardsStore {
  entries: CardTrackerEntry[];
  addEntry: (entry: Omit<CardTrackerEntry, 'id' | 'createdAt' | 'updatedAt'>) => CardTrackerEntry;
  updateEntry: (id: string, patch: Partial<CardTrackerEntry>) => void;
  removeEntry: (id: string) => void;
  clearForGame: (gameId: string) => void;
  entriesForGame: (gameId: string) => CardTrackerEntry[];
}

export const useCardsStore = create<CardsStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const created: CardTrackerEntry = {
          ...entry,
          id: newId(),
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ entries: [created, ...s.entries] }));
        return created;
      },

      updateEntry: (id, patch) => {
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: now() } : e,
          ),
        }));
      },

      removeEntry: (id) => {
        set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }));
      },

      clearForGame: (gameId) => {
        set((s) => ({ entries: s.entries.filter((e) => e.gameId !== gameId) }));
      },

      entriesForGame: (gameId) => get().entries.filter((e) => e.gameId === gameId),
    }),
    { name: 'dune.cards' },
  ),
);
