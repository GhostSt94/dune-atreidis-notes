import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { now } from '@/lib/date';
import type { JournalEvent } from '@/types/event';

interface JournalStore {
  events: JournalEvent[];
  log: (event: Omit<JournalEvent, 'id' | 'timestamp'>) => void;
  remove: (id: string) => void;
  clearForGame: (gameId: string) => void;
  forGame: (gameId: string) => JournalEvent[];
}

export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
      events: [],

      log: (event) => {
        const created: JournalEvent = { ...event, id: newId(), timestamp: now() };
        set((s) => ({ events: [created, ...s.events] }));
      },

      remove: (id) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      },

      clearForGame: (gameId) => {
        set((s) => ({ events: s.events.filter((e) => e.gameId !== gameId) }));
      },

      forGame: (gameId) =>
        get()
          .events.filter((e) => e.gameId === gameId)
          .sort((a, b) => b.timestamp - a.timestamp),
    }),
    { name: 'dune.journal' },
  ),
);
