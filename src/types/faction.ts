import type { GamePhase } from './game';

export type FactionId =
  | 'atreides'
  | 'harkonnen'
  | 'emperor'
  | 'fremen'
  | 'guild'
  | 'bene_gesserit';

export interface Leader {
  id: string;
  name: string;
  factionId: FactionId;
  value: number;
  alive: boolean;
  portrait?: string;
  suspectedTraitor?: FactionId;
  notes?: string;
}

export interface FactionAction {
  id: string;
  turn: number;
  phase: GamePhase;
  description: string;
  timestamp: number;
}

export interface FactionState {
  id: FactionId;
  name: string;
  color: string;
  estimatedTroops: number;
  estimatedSpice: number;
  alliances: FactionId[];
  threatLevel: 0 | 1 | 2 | 3 | 4;
  privateNotes: string;
  leaders: Leader[];
  actionsHistory: FactionAction[];
}

export interface FactionMeta {
  id: FactionId;
  name: string;
  shortName: string;
  motto: string;
  color: string;
  startingTroops: number;
  startingSpice: number;
  homeWorld: string;
  specialAbility: string;
}
