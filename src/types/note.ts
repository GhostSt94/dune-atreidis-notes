import type { FactionId } from './faction';

export type NoteCategory =
  | 'traitor'
  | 'leader'
  | 'enemy_plan'
  | 'battle'
  | 'alliance'
  | 'revealed_info'
  | 'mentat'
  | 'spice_economy';

export type NotePriority = 'low' | 'medium' | 'high' | 'critical';

export interface Note {
  id: string;
  gameId: string;
  category: NoteCategory;
  title: string;
  body: string;
  priority: NotePriority;
  factionTags: FactionId[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}
