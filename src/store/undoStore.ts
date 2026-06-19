import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGameStore } from './gameStore';
import { useFactionStore } from './factionStore';
import { useCardsStore } from './cardsStore';
import { useTraitorsStore } from './traitorsStore';
import type { Game } from '@/types/game';
import type { FactionId, FactionState } from '@/types/faction';
import type { CardTrackerEntry } from '@/types/card';
import type { Traitor } from '@/types/traitor';

const MAX_HISTORY = 30;

interface Snapshot {
  at: number;
  label: string;
  stores: {
    games: Record<string, Game>;
    currentGameId: string | null;
    factions: Record<string, Record<FactionId, FactionState>>;
    cards: CardTrackerEntry[];
    traitors: Traitor[];
  };
}

interface UndoStoreState {
  past: Snapshot[];
}

interface UndoStoreActions {
  push: (label: string) => void;
  undo: () => string | null;
  clear: () => void;
}

const captureCurrentState = (): Snapshot['stores'] => {
  const game = useGameStore.getState();
  return {
    games: game.games,
    currentGameId: game.currentGameId,
    factions: useFactionStore.getState().byGame,
    cards: useCardsStore.getState().entries,
    traitors: useTraitorsStore.getState().traitors,
  };
};

const restoreState = (s: Snapshot['stores']): void => {
  useGameStore.setState({ games: s.games, currentGameId: s.currentGameId });
  useFactionStore.setState({ byGame: s.factions });
  useCardsStore.setState({ entries: s.cards });
  useTraitorsStore.setState({ traitors: s.traitors });
};

export const useUndoStore = create<UndoStoreState & UndoStoreActions>()(
  persist(
    (set, get) => ({
      past: [],

      push: (label) => {
        const snap: Snapshot = {
          at: Date.now(),
          label,
          stores: captureCurrentState(),
        };
        set((s) => {
          const next = [...s.past, snap];
          if (next.length > MAX_HISTORY) next.shift();
          return { past: next };
        });
      },

      undo: () => {
        const { past } = get();
        if (past.length === 0) return null;
        const last = past[past.length - 1];
        restoreState(last.stores);
        set({ past: past.slice(0, -1) });
        return last.label;
      },

      clear: () => set({ past: [] }),
    }),
    { name: 'dune.undo' },
  ),
);

export const withUndo = (label: string, action: () => void): void => {
  useUndoStore.getState().push(label);
  action();
};
