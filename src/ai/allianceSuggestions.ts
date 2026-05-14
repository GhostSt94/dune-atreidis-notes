import type { Game } from '@/types/game';
import type { FactionId, FactionState } from '@/types/faction';
import type { TerritoryControl } from '@/types/territory';
import type { ThreatBreakdown } from './threatScoring';
import { STRONGHOLDS } from '@/data/territories';
import { FACTIONS } from '@/data/factions';

export interface AllianceOpportunity {
  factions: [FactionId, FactionId]; // [player, target]
  score: number;
  reasons: string[];
}

export interface AllianceDanger {
  factions: [FactionId, FactionId];
  combinedScore: number;
  combinedStrongholds: number;
  reason: string;
}

// Synergies thématiques entre factions (inspirées du lore Dune).
// Valeur = bonus appliqué au score de la paire ; négatif = conflit thématique.
const SYNERGY: Record<FactionId, Partial<Record<FactionId, number>>> = {
  atreides: {
    fremen: 12,
    bene_gesserit: 8,
    guild: 4,
    emperor: -5,
    harkonnen: -15,
  },
  harkonnen: {
    emperor: 10,
    guild: 4,
    bene_gesserit: 0,
    fremen: -10,
    atreides: -15,
  },
  emperor: {
    harkonnen: 10,
    guild: 6,
    bene_gesserit: 4,
    atreides: -5,
    fremen: -8,
  },
  fremen: {
    atreides: 12,
    bene_gesserit: 6,
    guild: 2,
    emperor: -8,
    harkonnen: -10,
  },
  guild: {
    emperor: 6,
    bene_gesserit: 4,
    atreides: 4,
    harkonnen: 4,
    fremen: 2,
  },
  bene_gesserit: {
    atreides: 8,
    fremen: 6,
    emperor: 4,
    guild: 4,
    harkonnen: 0,
  },
};

export const getSynergy = (a: FactionId, b: FactionId): number =>
  SYNERGY[a]?.[b] ?? 0;

const strongholdsOf = (
  factionId: FactionId,
  controls: Record<string, TerritoryControl>,
): number =>
  STRONGHOLDS.filter((s) => controls[s.id]?.controllingFaction === factionId).length;

// Opportunités d'alliance pour le joueur : factions disponibles classées par utilité.
export const computeAllianceOpportunities = (
  game: Game,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  threats: Record<FactionId, ThreatBreakdown>,
): AllianceOpportunity[] => {
  const player = game.playerFaction;
  const playerState = factions[player];
  if (!playerState) return [];

  const playerStrongholds = strongholdsOf(player, controls);
  const opportunities: AllianceOpportunity[] = [];

  for (const targetId of game.factionsInPlay) {
    if (targetId === player) continue;
    if (playerState.alliances.includes(targetId)) continue;
    const target = factions[targetId];
    if (!target) continue;

    const reasons: string[] = [];
    let score = 0;

    // Force martiale (menace cible = poids militaire ; bon allié = fort)
    const theirThreat = threats[targetId]?.score ?? 0;
    score += theirThreat * 0.4;
    if (theirThreat >= 60) reasons.push(`Menace ${theirThreat}/100 — allié fort`);

    // Synergie thématique
    const syn = getSynergy(player, targetId);
    score += syn;
    if (syn >= 10) reasons.push(`Synergie historique forte`);
    else if (syn <= -10) reasons.push(`Conflit thématique de longue date`);

    // Forteresses combinées (4 = victoire alliée)
    const theirStrongholds = strongholdsOf(targetId, controls);
    const combined = playerStrongholds + theirStrongholds;
    if (combined >= 4) {
      score += 30;
      reasons.push(`Victoire alliée possible (${combined} forteresses combinées)`);
    } else if (combined >= 3) {
      score += 15;
      reasons.push(`${combined} forteresses combinées — proche du seuil de victoire`);
    } else if (theirStrongholds >= 2) {
      score += 8;
      reasons.push(`${theirStrongholds} forteresses détenues`);
    }

    // Épice (allié riche peut surenchérir)
    const theirSpice = target.estimatedSpice ?? 0;
    score += theirSpice * 0.5;
    if (theirSpice >= 12) reasons.push(`${theirSpice} épice — capable de surenchérir`);

    // Troupes (poids militaire)
    score += (target.estimatedTroops ?? 0) * 0.3;

    // Pénalité si déjà engagé ailleurs
    const theirOtherAlliances = target.alliances.filter((a) => a !== player).length;
    if (theirOtherAlliances > 0) {
      score -= 20;
      reasons.push(`Déjà engagé dans une autre alliance`);
    }

    opportunities.push({
      factions: [player, targetId],
      score: Math.round(score),
      reasons,
    });
  }

  return opportunities.sort((a, b) => b.score - a.score);
};

// Dangers potentiels : paires d'adversaires non encore alliés qui formeraient
// une coalition menaçante. Ne réinclut PAS les alliances déjà conclues
// (déjà couvertes par allianceRisk).
export const computePotentialDangers = (
  game: Game,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  threats: Record<FactionId, ThreatBreakdown>,
): AllianceDanger[] => {
  const player = game.playerFaction;
  const dangers: AllianceDanger[] = [];
  const seen = new Set<string>();

  for (const a of game.factionsInPlay) {
    if (a === player) continue;
    for (const b of game.factionsInPlay) {
      if (b === player || a === b) continue;
      const key = [a, b].sort().join('-');
      if (seen.has(key)) continue;
      seen.add(key);

      // Ignorer alliances déjà conclues
      if (factions[a]?.alliances.includes(b)) continue;

      const combinedScore =
        (threats[a]?.score ?? 0) + (threats[b]?.score ?? 0);
      const combinedStrongholds =
        strongholdsOf(a, controls) + strongholdsOf(b, controls);
      const synergy = getSynergy(a, b);

      // Critères de danger : puissance combinée OU proche victoire combinée,
      // ET synergie non négative (sinon peu probable qu'ils s'allient).
      const isPowerful = combinedScore >= 100;
      const isNearWin = combinedStrongholds >= 3;
      const willingToAlly = synergy >= 0;

      if ((isPowerful || isNearWin) && willingToAlly) {
        const parts: string[] = [];
        parts.push(`Score combiné ${combinedScore}/200`);
        if (combinedStrongholds >= 3) {
          parts.push(`${combinedStrongholds} forteresses combinées`);
        }
        if (synergy >= 8) {
          parts.push(`forte synergie ${FACTIONS[a].shortName}/${FACTIONS[b].shortName}`);
        }
        dangers.push({
          factions: [a, b],
          combinedScore,
          combinedStrongholds,
          reason: parts.join(' · '),
        });
      }
    }
  }

  return dangers.sort((a, b) => {
    // Prioriser les paires les plus dangereuses
    const va = a.combinedScore + a.combinedStrongholds * 30;
    const vb = b.combinedScore + b.combinedStrongholds * 30;
    return vb - va;
  });
};

// Détail d'une paire d'alliance — utilisé pour l'inspection au clic sur une ligne du diagramme.
export interface PairBenefit {
  factions: [FactionId, FactionId];
  isAllied: boolean;
  involvesPlayer: boolean;
  synergy: number;
  combinedThreat: number;
  combinedStrongholds: number;
  combinedSpice: number;
  combinedTroops: number;
  combinedAliveLeaders: number;
  victoryReach: number; // 0..1 — proximité de la victoire alliée (4 forteresses)
  reasons: string[]; // points forts / bénéfices
  warnings: string[]; // points faibles / risques
  recommendedAction: 'forge' | 'break' | 'avoid' | 'neutral';
}

export const computePairBenefit = (
  a: FactionId,
  b: FactionId,
  game: Game,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  threats: Record<FactionId, ThreatBreakdown>,
): PairBenefit | null => {
  const fa = factions[a];
  const fb = factions[b];
  if (!fa || !fb) return null;

  const player = game.playerFaction;
  const involvesPlayer = a === player || b === player;
  const isAllied = fa.alliances.includes(b);
  const synergy = getSynergy(a, b);

  const combinedThreat = (threats[a]?.score ?? 0) + (threats[b]?.score ?? 0);
  const combinedStrongholds = strongholdsOf(a, controls) + strongholdsOf(b, controls);
  const combinedSpice = (fa.estimatedSpice ?? 0) + (fb.estimatedSpice ?? 0);
  const combinedTroops = (fa.estimatedTroops ?? 0) + (fb.estimatedTroops ?? 0);
  const combinedAliveLeaders =
    fa.leaders.filter((l) => l.alive).length +
    fb.leaders.filter((l) => l.alive).length;
  const victoryReach = Math.min(combinedStrongholds / 4, 1);

  const reasons: string[] = [];
  const warnings: string[] = [];

  // Synergie thématique
  if (synergy >= 10) reasons.push(`Synergie thématique forte (+${synergy})`);
  else if (synergy >= 4) reasons.push(`Synergie thématique positive (+${synergy})`);
  else if (synergy <= -10) warnings.push(`Conflit thématique sévère (${synergy})`);
  else if (synergy <= -4) warnings.push(`Frictions thématiques (${synergy})`);

  // Forteresses combinées
  if (combinedStrongholds >= 4) {
    reasons.push(`Victoire alliée immédiate possible (${combinedStrongholds} forteresses)`);
  } else if (combinedStrongholds === 3) {
    reasons.push(`3 forteresses combinées — il en manque 1 pour la victoire alliée`);
  } else if (combinedStrongholds === 2) {
    reasons.push(`2 forteresses combinées`);
  }

  // Troupes
  if (combinedTroops >= 30) {
    reasons.push(`${combinedTroops} troupes alliées — poids militaire majeur`);
  } else if (combinedTroops >= 18) {
    reasons.push(`${combinedTroops} troupes combinées`);
  }

  // Épice
  if (combinedSpice >= 25) {
    reasons.push(`${combinedSpice} épice combinés — domination des enchères`);
  } else if (combinedSpice >= 15) {
    reasons.push(`${combinedSpice} épice combinés`);
  }

  // Leaders vivants (pool de combat)
  if (combinedAliveLeaders >= 8) {
    reasons.push(`${combinedAliveLeaders} leaders vivants disponibles`);
  } else if (combinedAliveLeaders <= 4) {
    warnings.push(`Seulement ${combinedAliveLeaders} leaders vivants combinés`);
  }

  // Vigilance : ce que la formation casserait
  const playerAlly = factions[player]?.alliances[0];
  if (
    !isAllied &&
    involvesPlayer &&
    playerAlly &&
    playerAlly !== a &&
    playerAlly !== b
  ) {
    warnings.push(
      `Brisera votre pacte actuel avec ${FACTIONS[playerAlly].shortName}`,
    );
  }
  if (!isAllied && !involvesPlayer) {
    const aOther = fa.alliances.find((x) => x !== b);
    const bOther = fb.alliances.find((x) => x !== a);
    if (aOther) warnings.push(`Brisera ${FACTIONS[a].shortName} ↔ ${FACTIONS[aOther].shortName}`);
    if (bOther) warnings.push(`Brisera ${FACTIONS[b].shortName} ↔ ${FACTIONS[bOther].shortName}`);
  }

  // Menace combinée si paire adverse
  if (!involvesPlayer) {
    if (combinedThreat >= 120) {
      warnings.push(`Coalition très puissante — menace ${combinedThreat}/200`);
    } else if (combinedThreat >= 80) {
      warnings.push(`Coalition notable — menace ${combinedThreat}/200`);
    }
  }

  // Recommandation
  let recommendedAction: PairBenefit['recommendedAction'] = 'neutral';
  if (isAllied) {
    recommendedAction = combinedStrongholds >= 3 || synergy >= 6 ? 'neutral' : 'break';
  } else if (involvesPlayer) {
    const score =
      synergy + combinedStrongholds * 8 + combinedTroops * 0.4 + combinedSpice * 0.4;
    if (score >= 40) recommendedAction = 'forge';
    else if (synergy <= -10) recommendedAction = 'avoid';
  } else {
    // paire adverse
    if (combinedThreat >= 120 || combinedStrongholds >= 3) recommendedAction = 'avoid';
  }

  return {
    factions: [a, b],
    isAllied,
    involvesPlayer,
    synergy,
    combinedThreat,
    combinedStrongholds,
    combinedSpice,
    combinedTroops,
    combinedAliveLeaders,
    victoryReach,
    reasons,
    warnings,
    recommendedAction,
  };
};
