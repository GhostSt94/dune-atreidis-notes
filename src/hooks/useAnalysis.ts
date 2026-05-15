import { useMemo } from 'react';
import {
  useCardsStore,
  useCurrentGame,
  useFactionStore,
  useMapStore,
  useTraitorsStore,
} from '@/store';
import { analyze, type AnalysisReport } from '@/ai/engine';

export const useAnalysis = (): AnalysisReport | null => {
  const game = useCurrentGame();
  const byGame = useFactionStore((s) => s.byGame);
  const mapByGame = useMapStore((s) => s.byGame);
  const entries = useCardsStore((s) => s.entries);
  const traitors = useTraitorsStore((s) => s.traitors);

  return useMemo(() => {
    if (!game) return null;
    const factions = byGame[game.id];
    if (!factions) return null;
    const controls = mapByGame[game.id] ?? {};
    const cards = entries.filter((e) => e.gameId === game.id);
    const gameTraitors = traitors.filter((t) => t.gameId === game.id);
    return analyze(game, factions, controls, cards, gameTraitors);
  }, [game, byGame, mapByGame, entries, traitors]);
};
