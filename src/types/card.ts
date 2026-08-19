import type { FactionId } from './faction';

export type CardType = 'weapon' | 'defense' | 'special' | 'worthless';
export type WeaponSubtype = 'projectile' | 'poison';
export type CardKnowledge = 'known' | 'eliminated';

export interface TreacheryCard {
  id: string;
  /** Card slug shared across copies (e.g. shield_1..shield_5 share slug "shield"). */
  slug: string;
  type: CardType;
  subtype?: WeaponSubtype;
  /** Slug of the card that counters this one (e.g. "shield", "snooper"). */
  counteredBy?: string;
  /** Approximate combat-impact heuristic, 0..1. */
  battleImpact: number;
  /** Only in the deck when the value-10 leaders advanced rule is enabled. */
  expansion?: boolean;
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
