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
  initForGame: (gameId: string, factions: FactionId[], includeValue10?: boolean) => void;
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

const makeFactionState = (id: FactionId, includeValue10 = false): FactionState => {
  const meta = FACTIONS[id];
  return {
    id,
    name: meta.name,
    color: meta.color,
    estimatedTroops: 20, // total vivant = 20 - mort
    troopsDead: 0,
    troopsOnMap: 0,
    estimatedSpice: meta.startingSpice,
    zonesControlled: 0,
    alliances: [],
    threatLevel: 1,
    privateNotes: '',
    leaders: buildLeadersFor(id, newId, includeValue10),
    actionsHistory: [],
  };
};

export const useFactionStore = create<FactionStore>()(
  persist(
    (set, get) => ({
      byGame: {},

      initForGame: (gameId, factions, includeValue10 = false) => {
        const map = {} as Record<FactionId, FactionState>;
        factions.forEach((id) => {
          map[id] = makeFactionState(id, includeValue10);
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

        if (!allied) {
          // Briser l'alliance entre a et b : retirer mutuellement
          set({
            byGame: {
              ...byGame,
              [gameId]: {
                ...game,
                [a]: { ...fa, alliances: fa.alliances.filter((x) => x !== b) },
                [b]: { ...fb, alliances: fb.alliances.filter((x) => x !== a) },
              },
            },
          });
          return;
        }

        // Forger l'alliance a↔b : règles Dune — chaque faction ne peut avoir
        // qu'UNE alliance à la fois. Casser toute alliance précédente de a et b
        // (et nettoyer côté ex-partenaires) avant d'établir la nouvelle.
        const nextGame = { ...game } as typeof game;
        const factionsToClean = new Set<FactionId>([a, b]);
        // Repérer les ex-partenaires (factions qui avaient a ou b dans leurs alliances)
        fa.alliances.forEach((p) => factionsToClean.add(p));
        fb.alliances.forEach((p) => factionsToClean.add(p));

        // Retirer toute trace de a et b dans la liste d'alliances de chaque faction concernée
        factionsToClean.forEach((id) => {
          const f = nextGame[id];
          if (!f) return;
          nextGame[id] = {
            ...f,
            alliances: f.alliances.filter((x) => x !== a && x !== b),
          };
        });

        // Établir la nouvelle alliance bidirectionnelle
        nextGame[a] = { ...nextGame[a]!, alliances: [b] };
        nextGame[b] = { ...nextGame[b]!, alliances: [a] };

        set({
          byGame: {
            ...byGame,
            [gameId]: nextGame,
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
