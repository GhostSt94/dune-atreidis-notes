import type { FactionId } from './faction';

export type BattleOutcome = 'attacker_win' | 'defender_win' | 'pending';

export interface Battle {
  id: string;
  gameId: string;
  turn: number;
  territory: string;
  attacker: FactionId;
  defender: FactionId;
  attackerLeader?: string;
  defenderLeader?: string;
  attackerTroops: number;
  defenderTroops: number;
  attackerCardsPlayed: string[];
  defenderCardsPlayed: string[];
  outcome: BattleOutcome;
  attackerLosses: number;
  defenderLosses: number;
  notes: string;
  createdAt: number;
}
