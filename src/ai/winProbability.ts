import type { FactionState, FactionId } from '@/types/faction';
import type { TerritoryControl } from '@/types/territory';
import { zonesOf, troopsOnMapOf } from './factionStats';

export interface WinProbability {
  factionId: FactionId;
  probability: number;
  rationale: string;
}

export const computeWinProbabilities = (
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  currentTurn: number,
): WinProbability[] => {
  const turnPressure = Math.min(currentTurn / 10, 1);

  const list: WinProbability[] = Object.values(factions).map((f) => {
    const ownZones = zonesOf(f.id, factions, controls);
    const allyMaxZones = f.alliances.reduce(
      (max, a) => Math.max(max, zonesOf(a, factions, controls)),
      0,
    );
    const onMap = troopsOnMapOf(f.id, factions);

    // Le seuil de victoire dans Dune : 3 forteresses (solo) OU 4 avec allié.
    // On scale chaque dimension par rapport à son seuil.
    let raw = 0;
    // Zones propres → poids majeur (3 = victoire solo)
    raw += Math.min(ownZones / 3, 1) * 0.6;
    // Allié → poids secondaire (4 combinés = victoire alliée)
    if (allyMaxZones > 0) {
      const combined = Math.min((ownZones + allyMaxZones) / 4, 1);
      raw += combined * 0.2;
    }
    // Présence militaire sur le plateau
    raw += Math.min(onMap / 12, 1) * 0.1;
    // Épice (capacité d'enchère + force combat)
    raw += Math.min((f.estimatedSpice ?? 0) / 25, 1) * 0.07;
    // Pression de tour (le late game est crucial)
    raw += turnPressure * 0.05;

    const probability = Math.max(0, Math.min(1, raw));

    const rationaleParts: string[] = [`${ownZones} zone${ownZones > 1 ? 's' : ''}`];
    if (allyMaxZones > 0) rationaleParts.push(`+ allié à ${allyMaxZones}`);
    rationaleParts.push(`${f.estimatedTroops} troupes`);
    if (onMap > 0) rationaleParts.push(`${onMap} sur carte`);
    rationaleParts.push(`${f.estimatedSpice} épice`);

    return { factionId: f.id, probability, rationale: rationaleParts.join(' · ') };
  });

  return list.sort((a, b) => b.probability - a.probability);
};
