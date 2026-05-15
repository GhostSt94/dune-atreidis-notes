import type { FactionId } from '@/types/faction';
import { BATTLE_TRAINING_DATASET, type TrainingBattle } from './battleTrainingDataset';

export interface SimilarityQuery {
  attackerFaction: FactionId;
  defenderFaction: FactionId;
  territoryName?: string;
  isStronghold?: boolean;
  attackerTroops: number;
  defenderTroops: number;
  attackerSpice: number;
  defenderSpice: number;
  attackerLeaderValue: number;
  defenderLeaderValue: number;
  knownTraitorRisk: boolean;
  attackerAllianceCount: number;
  defenderAllianceCount: number;
}

export interface SimilarBattle {
  battle: TrainingBattle;
  distance: number;
  similarity: number; // 0..1, plus haut = plus similaire
  weight: number; // pour pondération kNN
}

const KNOWN_STRONGHOLDS = new Set([
  'arrakeen',
  'carthag',
  'sietch tabr',
  'tueks sietch',
  "tuek's sietch",
  'habbanya',
  'habbanya sietch',
  'cielago sietch',
]);

const isStrongholdName = (name: string): boolean =>
  KNOWN_STRONGHOLDS.has(name.toLowerCase());

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

const numericDiff = (a: number, b: number, scale: number): number =>
  clamp01(Math.abs(a - b) / scale);

const computeDistance = (q: SimilarityQuery, b: TrainingBattle): number => {
  let d = 0;

  // Factions (poids fort, c'est le facteur le plus discriminant)
  d += q.attackerFaction === b.attackerFaction ? 0 : 3;
  d += q.defenderFaction === b.defenderFaction ? 0 : 3;

  // Match stronghold (territoire)
  const battleStronghold = isStrongholdName(b.territory);
  const queryStronghold =
    q.isStronghold ?? (q.territoryName ? isStrongholdName(q.territoryName) : false);
  d += queryStronghold === battleStronghold ? 0 : 1.5;

  // Match exact de territoire (bonus si identique)
  if (
    q.territoryName &&
    q.territoryName.toLowerCase() === b.territory.toLowerCase()
  ) {
    d -= 1;
  }

  // Troupes (échelle 20)
  d += numericDiff(q.attackerTroops, b.attackerTroops, 20) * 2;
  d += numericDiff(q.defenderTroops, b.defenderTroops, 20) * 2;

  // Épice (échelle 30)
  d += numericDiff(q.attackerSpice, b.attackerSpice, 30) * 1;
  d += numericDiff(q.defenderSpice, b.defenderSpice, 30) * 1;

  // Valeur leader (échelle 10)
  d += numericDiff(q.attackerLeaderValue, b.attackerLeaderValue, 10) * 1.5;
  d += numericDiff(q.defenderLeaderValue, b.defenderLeaderValue, 10) * 1.5;

  // Traitor risk match
  d += q.knownTraitorRisk === b.knownTraitorRisk ? 0 : 1;

  // Nombre d'alliés (échelle 2)
  d += numericDiff(q.attackerAllianceCount, b.attackerAlliance.length, 2) * 0.5;
  d += numericDiff(q.defenderAllianceCount, b.defenderAlliance.length, 2) * 0.5;

  return Math.max(0, d);
};

// Distance maximale théorique = somme des poids
const MAX_DISTANCE = 3 + 3 + 1.5 + 2 + 2 + 1 + 1 + 1.5 + 1.5 + 1 + 0.5 + 0.5;

export const findSimilarBattles = (
  query: SimilarityQuery,
  k = 3,
): SimilarBattle[] => {
  const scored = BATTLE_TRAINING_DATASET.map((battle) => {
    const distance = computeDistance(query, battle);
    const similarity = clamp01(1 - distance / MAX_DISTANCE);
    return { battle, distance, similarity, weight: 0 };
  });

  scored.sort((a, b) => a.distance - b.distance);
  const top = scored.slice(0, k);

  // Pondération inverse de la distance (avec epsilon pour éviter div/0)
  const weights = top.map((s) => 1 / (s.distance + 0.5));
  const totalW = weights.reduce((sum, w) => sum + w, 0);
  return top.map((s, i) => ({
    ...s,
    weight: totalW > 0 ? weights[i] / totalW : 1 / top.length,
  }));
};

// Prédiction kNN pondérée du battleValue (probabilité attaquant gagne)
export const knnVictoryProbability = (
  similar: SimilarBattle[],
): { value: number; confidence: number } | null => {
  if (similar.length === 0) return null;
  const totalW = similar.reduce((s, x) => s + x.weight, 0);
  if (totalW === 0) return null;
  const value =
    similar.reduce((s, x) => s + x.battle.battleValue * x.weight, 0) / totalW;
  // Confiance = similarité moyenne pondérée (0..1)
  const confidence =
    similar.reduce((s, x) => s + x.similarity * x.weight, 0) / totalW;
  return { value, confidence };
};
