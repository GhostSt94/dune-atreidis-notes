import type { FactionState, FactionId } from '@/types/faction';
import type { TerritoryControl } from '@/types/territory';
import type { CardTrackerEntry } from '@/types/card';
import { STRONGHOLDS } from '@/data/territories';

export interface ThreatBreakdown {
  factionId: FactionId;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  factors: { label: string; value: number }[];
}

export const computeThreatScore = (
  faction: FactionState,
  controls: Record<string, TerritoryControl>,
  cards: CardTrackerEntry[],
): ThreatBreakdown => {
  const factors: { label: string; value: number }[] = [];

  const strongholdsHeld = STRONGHOLDS.filter(
    (s) => controls[s.id]?.controllingFaction === faction.id,
  ).length;
  const sScore = strongholdsHeld * 25;
  factors.push({ label: `Forteresses contrôlées (${strongholdsHeld})`, value: sScore });

  const troopScore = Math.min(faction.estimatedTroops * 1.5, 25);
  factors.push({ label: `Troupes estimées (${faction.estimatedTroops})`, value: troopScore });

  const spiceScore = Math.min(faction.estimatedSpice * 0.8, 15);
  factors.push({ label: `Épice (${faction.estimatedSpice})`, value: spiceScore });

  const allianceScore = faction.alliances.length * 8;
  factors.push({ label: `Alliances (${faction.alliances.length})`, value: allianceScore });

  const knownWeapons = cards.filter(
    (c) => c.knowledge === 'known' && c.heldBy === faction.id,
  ).length;
  const cardScore = knownWeapons * 4;
  factors.push({ label: `Cartes connues (${knownWeapons})`, value: cardScore });

  const aliveLeaders = faction.leaders.filter((l) => l.alive).length;
  const leaderScore = aliveLeaders * 2;
  factors.push({ label: `Leaders vivants (${aliveLeaders})`, value: leaderScore });

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
