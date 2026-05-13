import type { FactionState, FactionId } from '@/types/faction';
import type { TerritoryControl } from '@/types/territory';
import { STRONGHOLDS } from '@/data/territories';

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
  const strongholdsByFaction: Partial<Record<FactionId, number>> = {};
  STRONGHOLDS.forEach((s) => {
    const owner = controls[s.id]?.controllingFaction;
    if (owner) strongholdsByFaction[owner] = (strongholdsByFaction[owner] ?? 0) + 1;
  });

  const turnPressure = Math.min(currentTurn / 10, 1);

  const list: WinProbability[] = Object.values(factions).map((f) => {
    const own = strongholdsByFaction[f.id] ?? 0;
    const allyMax = f.alliances.reduce(
      (max, a) => Math.max(max, strongholdsByFaction[a] ?? 0),
      0,
    );

    let raw = (own / 3) * 0.55 + (allyMax / 3) * 0.2;
    raw += (f.estimatedTroops / 50) * 0.1;
    raw += (f.estimatedSpice / 30) * 0.05;
    raw += turnPressure * 0.1;

    const probability = Math.max(0, Math.min(1, raw));

    let rationale = `${own} forteresse(s)`;
    if (allyMax > 0) rationale += ` + allié à ${allyMax}`;
    rationale += ` · ${f.estimatedTroops} troupes, ${f.estimatedSpice} épice`;

    return { factionId: f.id, probability, rationale };
  });

  return list.sort((a, b) => b.probability - a.probability);
};
