import type { Game } from '@/types/game';
import type { FactionId, FactionState } from '@/types/faction';
import type { TerritoryControl } from '@/types/territory';
import type { CardTrackerEntry } from '@/types/card';
import { computeThreatScore, type ThreatBreakdown } from './threatScoring';
import { estimateHand, type HandEstimate } from './handEstimation';
import { detectDangerousAlliances, type AllianceRisk } from './allianceRisk';
import { computeWinProbabilities, type WinProbability } from './winProbability';
import {
  computeAllianceOpportunities,
  computePotentialDangers,
  type AllianceOpportunity,
  type AllianceDanger,
} from './allianceSuggestions';
import { FACTIONS } from '@/data/factions';

export interface Suggestion {
  id: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  message: string;
}

export interface AnalysisReport {
  threats: Record<FactionId, ThreatBreakdown>;
  hands: Record<FactionId, HandEstimate>;
  allianceRisks: AllianceRisk[];
  allianceOpportunities: AllianceOpportunity[];
  potentialAllianceDangers: AllianceDanger[];
  winProbs: WinProbability[];
  suggestions: Suggestion[];
}

export const analyze = (
  game: Game,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  cards: CardTrackerEntry[],
  traitors: import('@/types/traitor').Traitor[] = [],
): AnalysisReport => {
  const threats = {} as Record<FactionId, ThreatBreakdown>;
  const hands = {} as Record<FactionId, HandEstimate>;

  Object.values(factions).forEach((f) => {
    threats[f.id] = computeThreatScore(f, factions, controls, cards, traitors, game.id);
    hands[f.id] = estimateHand(f.id, cards);
  });

  const allianceRisks = detectDangerousAlliances(factions, threats, game.playerFaction);
  const allianceOpportunities = computeAllianceOpportunities(
    game,
    factions,
    controls,
    threats,
    cards,
    traitors,
  );
  const potentialAllianceDangers = computePotentialDangers(
    game,
    factions,
    controls,
    threats,
    cards,
    traitors,
  );
  const winProbs = computeWinProbabilities(factions, controls, game.currentTurn);

  const suggestions: Suggestion[] = [];

  const topThreat = Object.values(threats)
    .filter((t) => t.factionId !== game.playerFaction)
    .sort((a, b) => b.score - a.score)[0];
  if (topThreat && topThreat.score >= 60) {
    suggestions.push({
      id: 'top-threat',
      severity: topThreat.score >= 80 ? 'critical' : 'danger',
      title: `Menace majeure : ${FACTIONS[topThreat.factionId].shortName}`,
      message: `Score de menace ${topThreat.score}/100. Considérez une alliance défensive ou une attaque ciblée.`,
    });
  }

  allianceRisks
    .filter((r) => r.level === 'critical' || r.level === 'high')
    .forEach((r) => {
      suggestions.push({
        id: `alliance-${r.factions.join('-')}`,
        severity: r.level === 'critical' ? 'critical' : 'danger',
        title: `Alliance dangereuse : ${FACTIONS[r.factions[0]].shortName} + ${
          FACTIONS[r.factions[1]].shortName
        }`,
        message: r.reason,
      });
    });

  winProbs
    .filter((w) => w.factionId !== game.playerFaction && w.probability >= 0.55)
    .forEach((w) => {
      suggestions.push({
        id: `win-${w.factionId}`,
        severity: 'warning',
        title: `${FACTIONS[w.factionId].shortName} proche de la victoire`,
        message: `Probabilité estimée ${(w.probability * 100).toFixed(0)}%. ${w.rationale}`,
      });
    });

  const playerThreat = threats[game.playerFaction];
  if (playerThreat && playerThreat.score < 30) {
    suggestions.push({
      id: 'self-low',
      severity: 'info',
      title: 'Position Atreides faible',
      message:
        'Privilégiez la collecte d\'épice et exploitez votre avantage informationnel pour viser des cartes-clés.',
    });
  }

  const harkonnenAlive = factions.harkonnen?.leaders.filter((l) => l.alive).length ?? 0;
  if (harkonnenAlive >= 4) {
    suggestions.push({
      id: 'harkonnen-leaders',
      severity: 'warning',
      title: 'Pool Harkonnen intact',
      message: `${harkonnenAlive} leaders Harkonnen vivants — risque de combinaison de cartes.`,
    });
  }

  return {
    threats,
    hands,
    allianceRisks,
    allianceOpportunities,
    potentialAllianceDangers,
    winProbs,
    suggestions,
  };
};
