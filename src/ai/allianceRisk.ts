import type { FactionState, FactionId } from '@/types/faction';
import type { ThreatBreakdown } from './threatScoring';

export interface AllianceRisk {
  factions: [FactionId, FactionId];
  combinedScore: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
}

export const detectDangerousAlliances = (
  factions: Record<FactionId, FactionState>,
  threats: Record<FactionId, ThreatBreakdown>,
  playerFaction: FactionId,
): AllianceRisk[] => {
  const seen = new Set<string>();
  const risks: AllianceRisk[] = [];

  for (const f of Object.values(factions)) {
    if (f.id === playerFaction) continue;
    for (const ally of f.alliances) {
      if (ally === playerFaction) continue;
      const key = [f.id, ally].sort().join('-');
      if (seen.has(key)) continue;
      seen.add(key);

      const combined = (threats[f.id]?.score ?? 0) + (threats[ally]?.score ?? 0);
      let level: AllianceRisk['level'] = 'low';
      if (combined >= 140) level = 'critical';
      else if (combined >= 100) level = 'high';
      else if (combined >= 60) level = 'medium';

      risks.push({
        factions: [f.id, ally],
        combinedScore: combined,
        level,
        reason: `Score combiné ${combined} — menace ${level}`,
      });
    }
  }

  return risks.sort((a, b) => b.combinedScore - a.combinedScore);
};
