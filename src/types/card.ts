import type { FactionId } from './faction';

export type CardType = 'weapon' | 'defense' | 'special' | 'worthless';
export type CardKnowledge = 'known' | 'eliminated';

export interface TreacheryCard {
  id: string;
  name: string;
  type: CardType;
  description: string;
}

export interface CardTrackerEntry {
  id: string;
  gameId: string;
  cardId?: string; // undefined = carte inconnue
  knowledge: CardKnowledge;
  heldBy?: FactionId; // undefined quand éliminée
  notedAtTurn: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
