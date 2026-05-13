import type { FactionId } from './faction';

export type PredictionConfidence = 'low' | 'medium' | 'high';

export interface BGPrediction {
  id: string;
  gameId: string;
  predictedFaction: FactionId;
  predictedTurn: number;
  confidence: PredictionConfidence;
  reasoning: string;
  resolved: boolean;
  correct?: boolean;
  createdAt: number;
}
