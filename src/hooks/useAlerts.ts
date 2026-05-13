import { useMemo } from 'react';
import { useAnalysis } from './useAnalysis';
import type { Alert } from '@/types/alert';
import { useCurrentGame } from '@/store';

export const useAlerts = (): Alert[] => {
  const game = useCurrentGame();
  const analysis = useAnalysis();

  return useMemo(() => {
    if (!game || !analysis) return [];
    return analysis.suggestions.map((s) => ({
      id: s.id,
      gameId: game.id,
      severity: s.severity,
      title: s.title,
      message: s.message,
      source: 'ai' as const,
      factionsInvolved: [],
      dismissed: false,
      createdAt: Date.now(),
    }));
  }, [game, analysis]);
};
