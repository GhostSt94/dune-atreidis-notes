import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { now } from '@/lib/date';
import { nextPhase } from '@/data/phases';
import type { Game, GamePhase } from '@/types/game';
import type { FactionId } from '@/types/faction';
import { useJournalStore } from './journalStore';

interface GameStoreState {
  currentGameId: string | null;
  games: Record<string, Game>;
}

interface GameStoreActions {
  createGame: (input: {
    name: string;
    playerCount: number;
    factionsInPlay: FactionId[];
    playerFaction: FactionId;
  }) => string;
  loadGame: (id: string) => void;
  closeGame: () => void;
  advancePhase: () => void;
  nextTurn: () => void;
  previousTurn: () => void;
  setPhase: (phase: GamePhase) => void;
  setStormSector: (sector: number) => void;
  finishGame: (winner: FactionId) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  renameGame: (id: string, name: string) => void;
  deleteGame: (id: string) => void;
  duplicateGame: (id: string) => string | null;
}

type GameStore = GameStoreState & GameStoreActions;

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      currentGameId: null,
      games: {},

      createGame: ({ name, playerCount, factionsInPlay, playerFaction }) => {
        const id = newId();
        const game: Game = {
          id,
          name,
          createdAt: now(),
          updatedAt: now(),
          playerCount,
          factionsInPlay,
          currentTurn: 1,
          currentPhase: 'storm',
          stormSector: 1,
          status: 'active',
          playerFaction,
        };
        set((s) => ({
          games: { ...s.games, [id]: game },
          currentGameId: id,
        }));
        useJournalStore.getState().log({
          gameId: id,
          turn: 1,
          phase: 'storm',
          type: 'turn_start',
          title: `Partie « ${name} » initiée`,
          factionsInvolved: factionsInPlay,
        });
        return id;
      },

      loadGame: (id) => set({ currentGameId: id }),

      closeGame: () => set({ currentGameId: null }),

      advancePhase: () => {
        const { currentGameId, games } = get();
        if (!currentGameId) return;
        const game = games[currentGameId];
        if (!game) return;
        const { phase, turnIncrement } = nextPhase(game.currentPhase);
        const updated: Game = {
          ...game,
          currentPhase: phase,
          currentTurn: turnIncrement ? game.currentTurn + 1 : game.currentTurn,
          updatedAt: now(),
        };
        set({ games: { ...games, [currentGameId]: updated } });
        useJournalStore.getState().log({
          gameId: currentGameId,
          turn: updated.currentTurn,
          phase: updated.currentPhase,
          type: turnIncrement ? 'turn_start' : 'phase_change',
          title: turnIncrement ? `Tour ${updated.currentTurn} commence` : `Phase : ${phase}`,
          factionsInvolved: [],
        });
      },

      nextTurn: () => {
        const { currentGameId, games } = get();
        if (!currentGameId) return;
        const game = games[currentGameId];
        if (!game) return;
        const updated: Game = {
          ...game,
          currentPhase: 'storm',
          currentTurn: game.currentTurn + 1,
          updatedAt: now(),
        };
        set({ games: { ...games, [currentGameId]: updated } });
        useJournalStore.getState().log({
          gameId: currentGameId,
          turn: updated.currentTurn,
          phase: 'storm',
          type: 'turn_start',
          title: `Tour ${updated.currentTurn} commence`,
          factionsInvolved: [],
        });
      },

      previousTurn: () => {
        const { currentGameId, games } = get();
        if (!currentGameId) return;
        const game = games[currentGameId];
        if (!game) return;
        if (game.currentTurn <= 1) return; // garde-fou : pas de tour < 1
        const updated: Game = {
          ...game,
          currentPhase: 'storm',
          currentTurn: game.currentTurn - 1,
          updatedAt: now(),
        };
        set({ games: { ...games, [currentGameId]: updated } });
        useJournalStore.getState().log({
          gameId: currentGameId,
          turn: updated.currentTurn,
          phase: 'storm',
          type: 'turn_start',
          title: `Retour au tour ${updated.currentTurn}`,
          factionsInvolved: [],
        });
      },

      setPhase: (phase) => {
        const { currentGameId, games } = get();
        if (!currentGameId) return;
        const game = games[currentGameId];
        if (!game) return;
        set({
          games: {
            ...games,
            [currentGameId]: { ...game, currentPhase: phase, updatedAt: now() },
          },
        });
      },

      setStormSector: (sector) => {
        const { currentGameId, games } = get();
        if (!currentGameId) return;
        const game = games[currentGameId];
        if (!game) return;
        set({
          games: {
            ...games,
            [currentGameId]: { ...game, stormSector: sector, updatedAt: now() },
          },
        });
        useJournalStore.getState().log({
          gameId: currentGameId,
          turn: game.currentTurn,
          phase: game.currentPhase,
          type: 'storm_move',
          title: `Tempête → secteur ${sector}`,
          factionsInvolved: [],
        });
      },

      finishGame: (winner) => {
        const { currentGameId, games } = get();
        if (!currentGameId) return;
        const game = games[currentGameId];
        if (!game) return;
        set({
          games: {
            ...games,
            [currentGameId]: { ...game, status: 'finished', winner, updatedAt: now() },
          },
        });
      },

      pauseGame: () => {
        const { currentGameId, games } = get();
        if (!currentGameId) return;
        const game = games[currentGameId];
        if (!game) return;
        set({
          games: {
            ...games,
            [currentGameId]: { ...game, status: 'paused', updatedAt: now() },
          },
        });
      },

      resumeGame: () => {
        const { currentGameId, games } = get();
        if (!currentGameId) return;
        const game = games[currentGameId];
        if (!game) return;
        set({
          games: {
            ...games,
            [currentGameId]: { ...game, status: 'active', updatedAt: now() },
          },
        });
      },

      renameGame: (id, name) => {
        const { games } = get();
        const game = games[id];
        if (!game) return;
        set({ games: { ...games, [id]: { ...game, name, updatedAt: now() } } });
      },

      deleteGame: (id) => {
        set((s) => {
          const next = { ...s.games };
          delete next[id];
          return {
            games: next,
            currentGameId: s.currentGameId === id ? null : s.currentGameId,
          };
        });
      },

      duplicateGame: (id) => {
        const { games } = get();
        const original = games[id];
        if (!original) return null;
        const newGameId = newId();
        const copy: Game = {
          ...original,
          id: newGameId,
          name: `${original.name} (copie)`,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ games: { ...s.games, [newGameId]: copy } }));
        return newGameId;
      },
    }),
    { name: 'dune.game' },
  ),
);

export const useCurrentGame = (): Game | null => {
  const id = useGameStore((s) => s.currentGameId);
  const games = useGameStore((s) => s.games);
  return id ? games[id] ?? null : null;
};
