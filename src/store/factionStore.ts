import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { now } from '@/lib/date';
import { FACTIONS } from '@/data/factions';
import { buildLeadersFor } from '@/data/leaders';
import type { FactionId, FactionState, FactionAction } from '@/types/faction';
import type { GamePhase } from '@/types/game';

type FactionsByGame = Record<string, Record<FactionId, FactionState>>;

interface FactionStore {
  byGame: FactionsByGame;
  initForGame: (gameId: string, factions: FactionId[]) => void;
  removeGame: (gameId: string) => void;
  updateFaction: (gameId: string, id: FactionId, patch: Partial<FactionState>) => void;
  setAlliance: (gameId: string, a: FactionId, b: FactionId, allied: boolean) => void;
  killLeader: (gameId: string, factionId: FactionId, leaderId: string) => void;
  reviveLeader: (gameId: string, factionId: FactionId, leaderId: string) => void;
  addAction: (
    gameId: string,
    factionId: FactionId,
    description: string,
    turn: number,
    phase: GamePhase,
  ) => void;
}

const makeFactionState = (id: FactionId): FactionState => {
  const meta = FACTIONS[id];
  return {
    id,
    name: meta.name,
    color: meta.color,
    estimatedTroops: meta.startingTroops,
    estimatedSpice: meta.startingSpice,
    alliances: [],
    threatLevel: 1,
    privateNotes: '',
    leaders: buildLeadersFor(id, newId),
    actionsHistory: [],
  };
};

export const useFactionStore = create<FactionStore>()(
  persist(
    (set, get) => ({
      byGame: {},

      initForGame: (gameId, factions) => {
        const map = {} as Record<FactionId, FactionState>;
        factions.forEach((id) => {
          map[id] = makeFactionState(id);
        });
        set((s) => ({ byGame: { ...s.byGame, [gameId]: map } }));
      },

      removeGame: (gameId) => {
        set((s) => {
          const next = { ...s.byGame };
          delete next[gameId];
          return { byGame: next };
        });
      },

      updateFaction: (gameId, id, patch) => {
        const { byGame } = get();
        const game = byGame[gameId];
        if (!game) return;
        const current = game[id];
        if (!current) return;
        set({
          byGame: {
            ...byGame,
            [gameId]: { ...game, [id]: { ...current, ...patch } },
          },
        });
      },

      setAlliance: (gameId, a, b, allied) => {
        const { byGame } = get();
        const game = byGame[gameId];
        if (!game) return;
        const fa = game[a];
        const fb = game[b];
        if (!fa || !fb) return;
        const updateList = (current: FactionId[], target: FactionId): FactionId[] =>
          allied
            ? Array.from(new Set([...current, target]))
            : current.filter((x) => x !== target);
        set({
          byGame: {
            ...byGame,
            [gameId]: {
              ...game,
              [a]: { ...fa, alliances: updateList(fa.alliances, b) },
              [b]: { ...fb, alliances: updateList(fb.alliances, a) },
            },
          },
        });
      },

      killLeader: (gameId, factionId, leaderId) => {
        const { byGame } = get();
        const game = byGame[gameId];
        const f = game?.[factionId];
        if (!game || !f) return;
        set({
          byGame: {
            ...byGame,
            [gameId]: {
              ...game,
              [factionId]: {
                ...f,
                leaders: f.leaders.map((l) =>
                  l.id === leaderId ? { ...l, alive: false } : l,
                ),
              },
            },
          },
        });
      },

      reviveLeader: (gameId, factionId, leaderId) => {
        const { byGame } = get();
        const game = byGame[gameId];
        const f = game?.[factionId];
        if (!game || !f) return;
        set({
          byGame: {
            ...byGame,
            [gameId]: {
              ...game,
              [factionId]: {
                ...f,
                leaders: f.leaders.map((l) => (l.id === leaderId ? { ...l, alive: true } : l)),
              },
            },
          },
        });
      },

      addAction: (gameId, factionId, description, turn, phase) => {
        const { byGame } = get();
        const game = byGame[gameId];
        const f = game?.[factionId];
        if (!game || !f) return;
        const action: FactionAction = {
          id: newId(),
          turn,
          phase,
          description,
          timestamp: now(),
        };
        set({
          byGame: {
            ...byGame,
            [gameId]: {
              ...game,
              [factionId]: { ...f, actionsHistory: [action, ...f.actionsHistory] },
            },
          },
        });
      },
    }),
    { name: 'dune.factions' },
  ),
);
