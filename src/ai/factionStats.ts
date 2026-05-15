/**
 * Helpers partagés pour lire les données de la carte de faction (CardsPage)
 * et les exposer aux modules d'analyse (threat, win, alliance, battle).
 *
 * Source de vérité = `FactionState` (zonesControlled, troopsOnMap, troopsDead,
 * leaders, estimatedSpice, alliances) qui est édité par l'utilisateur depuis
 * la page CardsPage. Fallback éventuel sur `mapStore.controls` quand pertinent.
 */

import type { FactionId, FactionState } from '@/types/faction';
import type { TerritoryControl } from '@/types/territory';
import type { CardTrackerEntry } from '@/types/card';
import type { Traitor } from '@/types/traitor';
import { STRONGHOLDS } from '@/data/territories';
import { TREACHERY_CARDS } from '@/data/cards';

export const TOTAL_TROOPS = 20;

export const strongholdsControlledBy = (
  factionId: FactionId,
  controls: Record<string, TerritoryControl>,
): number =>
  STRONGHOLDS.filter((s) => controls[s.id]?.controllingFaction === factionId).length;

/**
 * Nombre de zones contrôlées : valeur saisie sur la carte de faction
 * (compteur segmenté 0..4) ; fallback sur le contrôle réel des strongholds.
 */
export const zonesOf = (
  factionId: FactionId,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
): number => {
  const z = factions[factionId]?.zonesControlled;
  if (typeof z === 'number') return z;
  return strongholdsControlledBy(factionId, controls);
};

export const troopsOnMapOf = (
  factionId: FactionId,
  factions: Record<FactionId, FactionState>,
): number => factions[factionId]?.troopsOnMap ?? 0;

export const troopsDeadOf = (
  factionId: FactionId,
  factions: Record<FactionId, FactionState>,
): number => factions[factionId]?.troopsDead ?? 0;

/** Troupes vivantes = TOTAL_TROOPS - mort (cohérent avec estimatedTroops). */
export const troopsAliveOf = (
  factionId: FactionId,
  factions: Record<FactionId, FactionState>,
): number => {
  const f = factions[factionId];
  if (!f) return TOTAL_TROOPS;
  const dead = f.troopsDead ?? 0;
  return Math.max(0, TOTAL_TROOPS - dead);
};

/** Troupes en réserve = vivantes - sur carte. */
export const troopsReserveOf = (
  factionId: FactionId,
  factions: Record<FactionId, FactionState>,
): number => Math.max(0, troopsAliveOf(factionId, factions) - troopsOnMapOf(factionId, factions));

export const aliveLeadersCount = (
  factionId: FactionId,
  factions: Record<FactionId, FactionState>,
): number => factions[factionId]?.leaders.filter((l) => l.alive).length ?? 0;

export interface TrackerCardStats {
  total: number;
  weapons: number;
  defenses: number;
  specials: number;
  worthless: number;
  unknowns: number;
}

export const cardStatsFor = (
  factionId: FactionId,
  cards: CardTrackerEntry[],
  gameId: string,
): TrackerCardStats => {
  const inHand = cards.filter(
    (c) => c.gameId === gameId && c.knowledge === 'known' && c.heldBy === factionId,
  );
  const stats: TrackerCardStats = {
    total: inHand.length,
    weapons: 0,
    defenses: 0,
    specials: 0,
    worthless: 0,
    unknowns: 0,
  };
  inHand.forEach((entry) => {
    if (!entry.cardId) {
      stats.unknowns += 1;
      return;
    }
    const card = TREACHERY_CARDS.find((c) => c.id === entry.cardId);
    if (!card) return;
    if (card.type === 'weapon') stats.weapons += 1;
    else if (card.type === 'defense') stats.defenses += 1;
    else if (card.type === 'special') stats.specials += 1;
    else if (card.type === 'worthless') stats.worthless += 1;
  });
  return stats;
};

export const activeTraitorsHeld = (
  factionId: FactionId,
  traitors: Traitor[],
  gameId: string,
): number =>
  traitors.filter(
    (t) =>
      t.gameId === gameId &&
      t.factionId === factionId &&
      t.active &&
      t.leaderFactionId &&
      t.leaderFactionId !== factionId,
  ).length;
