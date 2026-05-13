import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId } from '@/lib/id';
import { now } from '@/lib/date';
import type { BGPrediction } from '@/types/prediction';

interface PredictionsStore {
  predictions: BGPrediction[];
  addPrediction: (p: Omit<BGPrediction, 'id' | 'createdAt' | 'resolved'>) => BGPrediction;
  updatePrediction: (id: string, patch: Partial<BGPrediction>) => void;
  resolvePrediction: (id: string, correct: boolean) => void;
  removePrediction: (id: string) => void;
  clearForGame: (gameId: string) => void;
  forGame: (gameId: string) => BGPrediction[];
}

export const usePredictionsStore = create<PredictionsStore>()(
  persist(
    (set, get) => ({
      predictions: [],

      addPrediction: (p) => {
        const created: BGPrediction = {
          ...p,
          id: newId(),
          resolved: false,
          createdAt: now(),
        };
        set((s) => ({ predictions: [created, ...s.predictions] }));
        return created;
      },

      updatePrediction: (id, patch) => {
        set((s) => ({
          predictions: s.predictions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
      },

      resolvePrediction: (id, correct) => {
        set((s) => ({
          predictions: s.predictions.map((p) =>
            p.id === id ? { ...p, resolved: true, correct } : p,
          ),
        }));
      },

      removePrediction: (id) => {
        set((s) => ({ predictions: s.predictions.filter((p) => p.id !== id) }));
      },

      clearForGame: (gameId) => {
        set((s) => ({ predictions: s.predictions.filter((p) => p.gameId !== gameId) }));
      },

      forGame: (gameId) => get().predictions.filter((p) => p.gameId === gameId),
    }),
    { name: 'dune.predictions' },
  ),
);
