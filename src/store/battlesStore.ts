import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { now } from '@/lib/date';
import type { Battle } from '@/types/battle';
import { useJournalStore } from './journalStore';
import type { GamePhase } from '@/types/game';

interface BattlesStore {
  battles: Battle[];
  addBattle: (battle: Omit<Battle, 'id' | 'createdAt'>, phase: GamePhase) => Battle;
  updateBattle: (id: string, patch: Partial<Battle>) => void;
  deleteBattle: (id: string) => void;
  clearForGame: (gameId: string) => void;
  battlesForGame: (gameId: string) => Battle[];
}

export const useBattlesStore = create<BattlesStore>()(
  persist(
    (set, get) => ({
      battles: [],

      addBattle: (battle, phase) => {
        const created: Battle = { ...battle, id: newId(), createdAt: now() };
        set((s) => ({ battles: [created, ...s.battles] }));
        useJournalStore.getState().log({
          gameId: battle.gameId,
          turn: battle.turn,
          phase,
          type: 'battle',
          title: `Bataille à ${battle.territory}`,
          description: `${battle.attacker} → ${battle.defender}`,
          factionsInvolved: [battle.attacker, battle.defender],
        });
        return created;
      },

      updateBattle: (id, patch) => {
        set((s) => ({
          battles: s.battles.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        }));
      },

      deleteBattle: (id) => {
        set((s) => ({ battles: s.battles.filter((b) => b.id !== id) }));
      },

      clearForGame: (gameId) => {
        set((s) => ({ battles: s.battles.filter((b) => b.gameId !== gameId) }));
      },

      battlesForGame: (gameId) => get().battles.filter((b) => b.gameId === gameId),
    }),
    { name: 'dune.battles' },
  ),
);
