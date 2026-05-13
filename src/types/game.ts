import type { FactionId } from './faction';

export type GamePhase =
  | 'storm'
  | 'spice_blow'
  | 'choam'
  | 'bidding'
  | 'revival'
  | 'movement'
  | 'battle'
  | 'collection'
  | 'mentat';

export type GameStatus = 'active' | 'finished' | 'paused';

export interface Game {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  playerCount: number;
  factionsInPlay: FactionId[];
  currentTurn: number;
  currentPhase: GamePhase;
  stormSector: number;
  status: GameStatus;
  winner?: FactionId;
  playerFaction: FactionId;
}

export interface PhaseMeta {
  id: GamePhase;
  index: number;
  label: string;
  description: string;
}
