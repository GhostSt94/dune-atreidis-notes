import type { FactionId } from '@/types/faction';

export type GamePhase = 'early' | 'mid' | 'late';

export interface AllianceTraining {
  gameId: string;
  round: number;
  gamePhase: GamePhase;
  atreidesAlliance: FactionId; // allié du joueur Atreides
  enemyAlliance: FactionId[]; // duo adverse
  atreidesStrongholds: number;
  alliedStrongholds: number;
  enemyStrongholds: number;
  atreidesSpice: number;
  allySpice: number;
  enemySpice: number;
  atreidesTroops: number;
  allyTroops: number;
  enemyTroops: number;
  informationAdvantage: number; // 0..1
  militarySynergy: number;
  economicSynergy: number;
  mobilitySynergy: number;
  lateGameStrength: number;
  traitorRisk: number;
  momentum: number;
  /** ex: 'atreides_fremen' = alliance Atreides gagnante, sinon coalition adverse */
  winner: string;
}

export const ALLIANCE_TRAINING_DATASET: AllianceTraining[] = [
  { gameId: 'ALLIANCE_001', round: 3, gamePhase: 'early', atreidesAlliance: 'fremen', enemyAlliance: ['harkonnen', 'emperor'], atreidesStrongholds: 2, alliedStrongholds: 2, enemyStrongholds: 3, atreidesSpice: 9, allySpice: 3, enemySpice: 28, atreidesTroops: 12, allyTroops: 16, enemyTroops: 24, informationAdvantage: 0.91, militarySynergy: 0.94, economicSynergy: 0.52, mobilitySynergy: 0.95, lateGameStrength: 0.61, traitorRisk: 0.34, momentum: 0.81, winner: 'atreides_fremen' },
  { gameId: 'ALLIANCE_002', round: 6, gamePhase: 'mid', atreidesAlliance: 'emperor', enemyAlliance: ['guild', 'harkonnen'], atreidesStrongholds: 1, alliedStrongholds: 3, enemyStrongholds: 3, atreidesSpice: 5, allySpice: 26, enemySpice: 24, atreidesTroops: 8, allyTroops: 15, enemyTroops: 21, informationAdvantage: 0.84, militarySynergy: 0.71, economicSynergy: 0.97, mobilitySynergy: 0.43, lateGameStrength: 0.83, traitorRisk: 0.49, momentum: 0.63, winner: 'guild_harkonnen' },
  { gameId: 'ALLIANCE_003', round: 7, gamePhase: 'late', atreidesAlliance: 'guild', enemyAlliance: ['emperor', 'harkonnen'], atreidesStrongholds: 2, alliedStrongholds: 4, enemyStrongholds: 3, atreidesSpice: 4, allySpice: 31, enemySpice: 29, atreidesTroops: 10, allyTroops: 13, enemyTroops: 22, informationAdvantage: 0.87, militarySynergy: 0.64, economicSynergy: 0.88, mobilitySynergy: 0.92, lateGameStrength: 0.98, traitorRisk: 0.41, momentum: 0.77, winner: 'atreides_guild' },
  { gameId: 'ALLIANCE_004', round: 2, gamePhase: 'early', atreidesAlliance: 'bene_gesserit', enemyAlliance: ['fremen', 'guild'], atreidesStrongholds: 1, alliedStrongholds: 1, enemyStrongholds: 2, atreidesSpice: 7, allySpice: 12, enemySpice: 9, atreidesTroops: 9, allyTroops: 5, enemyTroops: 14, informationAdvantage: 0.96, militarySynergy: 0.39, economicSynergy: 0.51, mobilitySynergy: 0.42, lateGameStrength: 0.59, traitorRisk: 0.63, momentum: 0.44, winner: 'fremen_guild' },
  { gameId: 'ALLIANCE_005', round: 5, gamePhase: 'mid', atreidesAlliance: 'fremen', enemyAlliance: ['guild', 'emperor'], atreidesStrongholds: 3, alliedStrongholds: 2, enemyStrongholds: 2, atreidesSpice: 10, allySpice: 4, enemySpice: 35, atreidesTroops: 14, allyTroops: 18, enemyTroops: 19, informationAdvantage: 0.93, militarySynergy: 0.96, economicSynergy: 0.49, mobilitySynergy: 0.98, lateGameStrength: 0.74, traitorRisk: 0.27, momentum: 0.91, winner: 'atreides_fremen' },
  { gameId: 'ALLIANCE_006', round: 8, gamePhase: 'late', atreidesAlliance: 'emperor', enemyAlliance: ['fremen', 'guild'], atreidesStrongholds: 2, alliedStrongholds: 2, enemyStrongholds: 4, atreidesSpice: 3, allySpice: 21, enemySpice: 16, atreidesTroops: 6, allyTroops: 11, enemyTroops: 28, informationAdvantage: 0.81, militarySynergy: 0.66, economicSynergy: 0.95, mobilitySynergy: 0.46, lateGameStrength: 0.79, traitorRisk: 0.51, momentum: 0.39, winner: 'fremen_guild' },
  { gameId: 'ALLIANCE_007', round: 4, gamePhase: 'mid', atreidesAlliance: 'guild', enemyAlliance: ['fremen', 'harkonnen'], atreidesStrongholds: 2, alliedStrongholds: 1, enemyStrongholds: 3, atreidesSpice: 11, allySpice: 18, enemySpice: 13, atreidesTroops: 12, allyTroops: 8, enemyTroops: 22, informationAdvantage: 0.88, militarySynergy: 0.58, economicSynergy: 0.79, mobilitySynergy: 0.91, lateGameStrength: 0.95, traitorRisk: 0.37, momentum: 0.56, winner: 'fremen_harkonnen' },
  { gameId: 'ALLIANCE_008', round: 9, gamePhase: 'late', atreidesAlliance: 'fremen', enemyAlliance: ['guild', 'emperor'], atreidesStrongholds: 3, alliedStrongholds: 2, enemyStrongholds: 3, atreidesSpice: 6, allySpice: 2, enemySpice: 40, atreidesTroops: 15, allyTroops: 19, enemyTroops: 20, informationAdvantage: 0.95, militarySynergy: 0.97, economicSynergy: 0.43, mobilitySynergy: 0.99, lateGameStrength: 0.76, traitorRisk: 0.22, momentum: 0.89, winner: 'atreides_fremen' },
  { gameId: 'ALLIANCE_009', round: 5, gamePhase: 'mid', atreidesAlliance: 'bene_gesserit', enemyAlliance: ['emperor', 'guild'], atreidesStrongholds: 1, alliedStrongholds: 2, enemyStrongholds: 4, atreidesSpice: 8, allySpice: 17, enemySpice: 33, atreidesTroops: 10, allyTroops: 7, enemyTroops: 23, informationAdvantage: 0.99, militarySynergy: 0.41, economicSynergy: 0.57, mobilitySynergy: 0.48, lateGameStrength: 0.62, traitorRisk: 0.72, momentum: 0.35, winner: 'emperor_guild' },
  { gameId: 'ALLIANCE_010', round: 6, gamePhase: 'mid', atreidesAlliance: 'emperor', enemyAlliance: ['fremen', 'bene_gesserit'], atreidesStrongholds: 2, alliedStrongholds: 3, enemyStrongholds: 2, atreidesSpice: 9, allySpice: 28, enemySpice: 8, atreidesTroops: 11, allyTroops: 14, enemyTroops: 18, informationAdvantage: 0.83, militarySynergy: 0.74, economicSynergy: 0.98, mobilitySynergy: 0.51, lateGameStrength: 0.87, traitorRisk: 0.44, momentum: 0.82, winner: 'atreides_emperor' },
];

export const atreidesWon = (battle: AllianceTraining): boolean =>
  battle.winner.startsWith('atreides_');

export const phaseFromRound = (round: number): GamePhase => {
  if (round <= 3) return 'early';
  if (round <= 7) return 'mid';
  return 'late';
};
