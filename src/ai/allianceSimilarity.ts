import type { FactionId } from '@/types/faction';
import {
  ALLIANCE_TRAINING_DATASET,
  atreidesWon,
  type AllianceTraining,
  type GamePhase,
} from './allianceTrainingDataset';

export interface AllianceSimilarityQuery {
  atreidesAllianceCandidate: FactionId;
  gamePhase: GamePhase;
  atreidesStrongholds: number;
  alliedStrongholds: number;
  enemyStrongholds: number;
  atreidesSpice: number;
  allySpice: number;
  enemySpice: number;
  atreidesTroops: number;
  allyTroops: number;
  enemyTroops: number;
}

export interface SimilarAlliance {
  battle: AllianceTraining;
  distance: number;
  similarity: number; // 0..1
  weight: number;
  atreidesWon: boolean;
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const numericDiff = (a: number, b: number, scale: number): number =>
  clamp01(Math.abs(a - b) / scale);

const phaseValue = (p: GamePhase): number =>
  p === 'early' ? 0 : p === 'mid' ? 0.5 : 1;

const distance = (
  q: AllianceSimilarityQuery,
  b: AllianceTraining,
): number => {
  let d = 0;
  // Allié — facteur le plus discriminant
  d += q.atreidesAllianceCandidate === b.atreidesAlliance ? 0 : 3;
  // Phase
  d += numericDiff(phaseValue(q.gamePhase), phaseValue(b.gamePhase), 1) * 2;
  // Strongholds (combinés joueur+allié vs adverse, échelle 4)
  const qFriendlySH = q.atreidesStrongholds + q.alliedStrongholds;
  const bFriendlySH = b.atreidesStrongholds + b.alliedStrongholds;
  d += numericDiff(qFriendlySH, bFriendlySH, 4) * 1.5;
  d += numericDiff(q.enemyStrongholds, b.enemyStrongholds, 4) * 1;
  // Économie
  const qSpice = q.atreidesSpice + q.allySpice;
  const bSpice = b.atreidesSpice + b.allySpice;
  d += numericDiff(qSpice, bSpice, 40) * 1;
  d += numericDiff(q.enemySpice, b.enemySpice, 40) * 0.5;
  // Troupes
  const qTroops = q.atreidesTroops + q.allyTroops;
  const bTroops = b.atreidesTroops + b.allyTroops;
  d += numericDiff(qTroops, bTroops, 40) * 1;
  d += numericDiff(q.enemyTroops, b.enemyTroops, 40) * 0.5;
  return Math.max(0, d);
};

const MAX_DISTANCE = 3 + 2 + 1.5 + 1 + 1 + 0.5 + 1 + 0.5;

export const findSimilarAlliances = (
  query: AllianceSimilarityQuery,
  k = 3,
): SimilarAlliance[] => {
  const scored = ALLIANCE_TRAINING_DATASET.map((battle) => {
    const d = distance(query, battle);
    return {
      battle,
      distance: d,
      similarity: clamp01(1 - d / MAX_DISTANCE),
      weight: 0,
      atreidesWon: atreidesWon(battle),
    };
  });
  scored.sort((a, b) => a.distance - b.distance);
  const top = scored.slice(0, k);
  const weights = top.map((s) => 1 / (s.distance + 0.5));
  const total = weights.reduce((sum, w) => sum + w, 0);
  return top.map((s, i) => ({
    ...s,
    weight: total > 0 ? weights[i] / total : 1 / top.length,
  }));
};

export interface KnnAlliancePrediction {
  winRate: number; // 0..1 — taux de victoire Atreides pondéré
  confidence: number; // 0..1 — similarité moyenne pondérée
  sampleSize: number;
}

export const knnAllianceWinRate = (
  neighbors: SimilarAlliance[],
): KnnAlliancePrediction | null => {
  if (neighbors.length === 0) return null;
  const total = neighbors.reduce((s, x) => s + x.weight, 0);
  if (total === 0) return null;
  const winRate =
    neighbors.reduce((s, x) => s + (x.atreidesWon ? 1 : 0) * x.weight, 0) / total;
  const confidence =
    neighbors.reduce((s, x) => s + x.similarity * x.weight, 0) / total;
  return { winRate, confidence, sampleSize: neighbors.length };
};
