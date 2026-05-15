import type { FactionState, FactionId } from '@/types/faction';
import type { TerritoryControl } from '@/types/territory';
import type { CardTrackerEntry } from '@/types/card';
import type { Traitor } from '@/types/traitor';
import { zonesOf, troopsOnMapOf, cardStatsFor, activeTraitorsHeld } from './factionStats';

export interface ThreatBreakdown {
  factionId: FactionId;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  factors: { label: string; value: number }[];
}

export const computeThreatScore = (
  faction: FactionState,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  cards: CardTrackerEntry[],
  traitors: Traitor[],
  gameId: string,
): ThreatBreakdown => {
  const factors: { label: string; value: number }[] = [];

  // Zones contrôlées (carte de faction — manuel ou fallback map)
  const zones = zonesOf(faction.id, factions, controls);
  const zonesScore = zones * 22;
  factors.push({ label: `Zones contrôlées (${zones}/4)`, value: zonesScore });

  // Troupes vivantes
  const troopScore = Math.min(faction.estimatedTroops * 1.2, 22);
  factors.push({
    label: `Troupes vivantes (${faction.estimatedTroops})`,
    value: troopScore,
  });

  // Troupes déployées sur le plateau (pression effective)
  const onMap = troopsOnMapOf(faction.id, factions);
  const onMapScore = Math.min(onMap * 0.8, 12);
  factors.push({ label: `Sur le plateau (${onMap})`, value: onMapScore });

  // Épice
  const spiceScore = Math.min(faction.estimatedSpice * 0.6, 12);
  factors.push({
    label: `Épice (${faction.estimatedSpice})`,
    value: spiceScore,
  });

  // Alliances
  const allianceScore = faction.alliances.length * 6;
  factors.push({
    label: `Alliances (${faction.alliances.length})`,
    value: allianceScore,
  });

  // Cartes connues + armes spécifiquement
  const cardStats = cardStatsFor(faction.id, cards, gameId);
  const cardScore = cardStats.weapons * 4 + cardStats.defenses * 2 + cardStats.specials * 3 + cardStats.unknowns * 1.5;
  if (cardScore > 0) {
    factors.push({
      label: `Cartes (${cardStats.weapons}A·${cardStats.defenses}D·${cardStats.specials}S·${cardStats.unknowns}?)`,
      value: cardScore,
    });
  }

  // Traîtres actifs sur des leaders d'autres factions
  const traitorCount = activeTraitorsHeld(faction.id, traitors, gameId);
  const traitorScore = traitorCount * 6;
  if (traitorScore > 0) {
    factors.push({
      label: `Traîtres actifs ennemis (${traitorCount})`,
      value: traitorScore,
    });
  }

  // Leaders vivants
  const aliveLeaders = faction.leaders.filter((l) => l.alive).length;
  const leaderScore = aliveLeaders * 1.5;
  factors.push({
    label: `Leaders vivants (${aliveLeaders}/${faction.leaders.length})`,
    value: leaderScore,
  });

  const total = Math.min(
    100,
    Math.round(factors.reduce((sum, f) => sum + f.value, 0)),
  );

  let level: 0 | 1 | 2 | 3 | 4 = 0;
  if (total >= 80) level = 4;
  else if (total >= 60) level = 3;
  else if (total >= 40) level = 2;
  else if (total >= 20) level = 1;

  return { factionId: faction.id, score: total, level, factors };
};
