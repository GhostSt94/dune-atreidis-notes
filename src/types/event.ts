import type { FactionId } from './faction';
import type { GamePhase } from './game';

export type EventType =
  | 'turn_start'
  | 'phase_change'
  | 'battle'
  | 'alliance_formed'
  | 'alliance_broken'
  | 'betrayal'
  | 'nexus'
  | 'storm_move'
  | 'spice_blow'
  | 'leader_killed'
  | 'note_added'
  | 'card_revealed'
  | 'prediction_made';

export interface JournalEvent {
  id: string;
  gameId: string;
  turn: number;
  phase: GamePhase;
  type: EventType;
  title: string;
  description?: string;
  factionsInvolved: FactionId[];
  timestamp: number;
}
