import type { Game } from '@/types/game';
import type { FactionId, FactionState } from '@/types/faction';
import type { TerritoryControl } from '@/types/territory';
import type { CardTrackerEntry } from '@/types/card';
import type { Traitor } from '@/types/traitor';
import type { ThreatBreakdown } from './threatScoring';
import { STRONGHOLDS } from '@/data/territories';
import { FACTIONS } from '@/data/factions';
import { TREACHERY_CARDS } from '@/data/cards';
import {
  findSimilarAlliances,
  knnAllianceWinRate,
  type SimilarAlliance,
  type KnnAlliancePrediction,
} from './allianceSimilarity';
import { phaseFromRound } from './allianceTrainingDataset';

// ──────────────────────────────────────────────────────────
// Helpers tracker (cartes + traîtres)
// ──────────────────────────────────────────────────────────

interface TrackerStats {
  cardsHeld: number;
  weapons: number;
  defenses: number;
  specials: number;
  unknowns: number;
  activeEnemyTraitors: number;
  zonesControlled: number;
}

const trackerStatsFor = (
  factionId: FactionId,
  factionState: FactionState | undefined,
  cards: CardTrackerEntry[],
  traitors: Traitor[],
  game: Game,
): TrackerStats => {
  const inHand = cards.filter(
    (c) => c.gameId === game.id && c.knowledge === 'known' && c.heldBy === factionId,
  );
  let weapons = 0,
    defenses = 0,
    specials = 0,
    unknowns = 0;
  inHand.forEach((entry) => {
    if (!entry.cardId) {
      unknowns += 1;
      return;
    }
    const card = TREACHERY_CARDS.find((c) => c.id === entry.cardId);
    if (!card) return;
    if (card.type === 'weapon') weapons += 1;
    else if (card.type === 'defense') defenses += 1;
    else if (card.type === 'special') specials += 1;
  });

  // Traîtres actifs détenus par cette faction, ciblant des leaders d'autres factions
  const activeEnemyTraitors = traitors.filter(
    (t) =>
      t.gameId === game.id &&
      t.factionId === factionId &&
      t.active &&
      t.leaderFactionId &&
      t.leaderFactionId !== factionId,
  ).length;

  // zonesControlled = override manuel saisi sur la CardsPage (peut différer du contrôle réel)
  const zonesControlled = factionState?.zonesControlled ?? 0;

  return {
    cardsHeld: inHand.length,
    weapons,
    defenses,
    specials,
    unknowns,
    activeEnemyTraitors,
    zonesControlled,
  };
};

export interface AllianceOpportunity {
  factions: [FactionId, FactionId]; // [player, target]
  score: number;
  reasons: string[];
  historicalWinRate?: number; // 0..1, prédiction kNN
  historicalSampleSize?: number;
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

// Source de vérité pour le nombre de zones contrôlées : le compteur 0..4
// saisi par l'utilisateur sur la carte de faction (CardsPage). En fallback
// on retombe sur le contrôle réel des strongholds sur la map.
const zonesOf = (
  factionId: FactionId,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
): number => {
  const z = factions[factionId]?.zonesControlled;
  if (typeof z === 'number') return z;
  return strongholdsOf(factionId, controls);
};

// Troupes déployées sur le plateau (depuis la carte de faction CardsPage)
const troopsOnMapOf = (
  factionId: FactionId,
  factions: Record<FactionId, FactionState>,
): number => factions[factionId]?.troopsOnMap ?? 0;

// Construit une requête de similarité historique pour une candidate alliée.
const buildHistoricalQuery = (
  game: Game,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  candidate: FactionId,
) => {
  const atreides = factions[game.playerFaction];
  const ally = factions[candidate];
  // Enemis = factions en jeu hors joueur et hors candidat allié
  const enemies = game.factionsInPlay.filter(
    (f) => f !== game.playerFaction && f !== candidate,
  );
  const enemyAgg = enemies.reduce(
    (acc, id) => {
      const f = factions[id];
      if (!f) return acc;
      acc.strongholds += zonesOf(id, factions, controls);
      acc.spice += f.estimatedSpice ?? 0;
      acc.troops += f.estimatedTroops ?? 0;
      return acc;
    },
    { strongholds: 0, spice: 0, troops: 0 },
  );
  return {
    atreidesAllianceCandidate: candidate,
    gamePhase: phaseFromRound(game.currentTurn),
    atreidesStrongholds: zonesOf(game.playerFaction, factions, controls),
    alliedStrongholds: zonesOf(candidate, factions, controls),
    enemyStrongholds: enemyAgg.strongholds,
    atreidesSpice: atreides?.estimatedSpice ?? 0,
    allySpice: ally?.estimatedSpice ?? 0,
    enemySpice: enemyAgg.spice,
    atreidesTroops: atreides?.estimatedTroops ?? 0,
    allyTroops: ally?.estimatedTroops ?? 0,
    enemyTroops: enemyAgg.troops,
  };
};

// Opportunités d'alliance pour le joueur : factions disponibles classées par utilité.
export const computeAllianceOpportunities = (
  game: Game,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  threats: Record<FactionId, ThreatBreakdown>,
  cards: CardTrackerEntry[] = [],
  traitors: Traitor[] = [],
): AllianceOpportunity[] => {
  const player = game.playerFaction;
  const playerState = factions[player];
  if (!playerState) return [];

  const playerStrongholds = zonesOf(player, factions, controls);
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

    // Zones contrôlées combinées (4 = victoire alliée) — source : carte de faction
    const theirStrongholds = zonesOf(targetId, factions, controls);
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

    // ─── Données du tracker ───
    const stats = trackerStatsFor(targetId, target, cards, traitors, game);
    // Cartes en main connues → potentiel tactique
    if (stats.weapons > 0) {
      score += stats.weapons * 5;
      reasons.push(
        `${stats.weapons} arme${stats.weapons > 1 ? 's' : ''} en main connue${stats.weapons > 1 ? 's' : ''}`,
      );
    }
    if (stats.defenses > 0) {
      score += stats.defenses * 3;
    }
    if (stats.specials > 0) {
      score += stats.specials * 4;
    }
    if (stats.unknowns > 0) {
      score += stats.unknowns * 1.5;
    }
    if (stats.cardsHeld >= 3) {
      reasons.push(
        `${stats.cardsHeld} cartes en main (${stats.weapons}A·${stats.defenses}D·${stats.specials}S·${stats.unknowns}?)`,
      );
    }
    // Traîtres actifs sur des leaders ennemis = avantage info décisif
    if (stats.activeEnemyTraitors > 0) {
      score += stats.activeEnemyTraitors * 8;
      reasons.push(
        `Détient ${stats.activeEnemyTraitors} traître${stats.activeEnemyTraitors > 1 ? 's' : ''} actif${stats.activeEnemyTraitors > 1 ? 's' : ''} contre des leaders ennemis`,
      );
    }
    // Troupes déployées (sur le plateau) — pression militaire concrète
    const theirOnMap = troopsOnMapOf(targetId, factions);
    if (theirOnMap >= 6) {
      score += theirOnMap * 0.5;
      reasons.push(`${theirOnMap} troupes déjà sur le plateau`);
    }

    // Contexte historique (dataset Atreides uniquement)
    let historicalWinRate: number | undefined;
    let historicalSampleSize: number | undefined;
    if (player === 'atreides') {
      const query = buildHistoricalQuery(game, factions, controls, targetId);
      const similar = findSimilarAlliances(query, 3);
      const pred = knnAllianceWinRate(similar);
      if (pred) {
        historicalWinRate = pred.winRate;
        historicalSampleSize = pred.sampleSize;
        // Bonus / malus modéré sur le score (pondéré par la confiance, plafond 30%)
        const bias = (pred.winRate - 0.5) * 60 * pred.confidence;
        score += bias;
        if (pred.confidence >= 0.6) {
          if (pred.winRate >= 0.7) {
            reasons.push(
              `Précédents historiques très favorables (${Math.round(pred.winRate * 100)}%)`,
            );
          } else if (pred.winRate <= 0.3) {
            reasons.push(
              `Précédents historiques défavorables (${Math.round(pred.winRate * 100)}%)`,
            );
          }
        }
      }
    }

    opportunities.push({
      factions: [player, targetId],
      score: Math.round(score),
      reasons,
      historicalWinRate,
      historicalSampleSize,
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
  cards: CardTrackerEntry[] = [],
  traitors: Traitor[] = [],
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
        zonesOf(a, factions, controls) + zonesOf(b, factions, controls);
      const synergy = getSynergy(a, b);

      // Stats tracker — cartes + traîtres détenus côté adversaire
      const statsA = trackerStatsFor(a, factions[a], cards, traitors, game);
      const statsB = trackerStatsFor(b, factions[b], cards, traitors, game);
      const combinedWeapons = statsA.weapons + statsB.weapons;
      const combinedTraitors = statsA.activeEnemyTraitors + statsB.activeEnemyTraitors;

      // Critères de danger : puissance combinée OU proche victoire combinée,
      // ET synergie non négative (sinon peu probable qu'ils s'allient).
      const isPowerful = combinedScore >= 100;
      const isNearWin = combinedStrongholds >= 3;
      const armedCoalition = combinedWeapons >= 2 || combinedTraitors >= 2;
      const willingToAlly = synergy >= 0;

      if ((isPowerful || isNearWin || armedCoalition) && willingToAlly) {
        const parts: string[] = [];
        parts.push(`Score combiné ${combinedScore}/200`);
        if (combinedStrongholds >= 3) {
          parts.push(`${combinedStrongholds} forteresses combinées`);
        }
        if (combinedWeapons > 0) {
          parts.push(`${combinedWeapons} arme${combinedWeapons > 1 ? 's' : ''} en main`);
        }
        if (combinedTraitors > 0) {
          parts.push(
            `${combinedTraitors} traître${combinedTraitors > 1 ? 's' : ''} actif${combinedTraitors > 1 ? 's' : ''}`,
          );
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
  combinedTroopsOnMap: number; // troupes déployées (carte de faction)
  combinedWeapons: number; // armes connues détenues par la paire (tracker)
  combinedTraitors: number; // traîtres actifs ciblant d'autres factions (tracker)
  victoryReach: number; // 0..1 — proximité de la victoire alliée (4 forteresses)
  reasons: string[]; // points forts / bénéfices
  warnings: string[]; // points faibles / risques
  recommendedAction: 'forge' | 'break' | 'avoid' | 'neutral';
  historicalContext?: {
    prediction: KnnAlliancePrediction;
    neighbors: SimilarAlliance[];
  };
}

export const computePairBenefit = (
  a: FactionId,
  b: FactionId,
  game: Game,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  threats: Record<FactionId, ThreatBreakdown>,
  cards: CardTrackerEntry[] = [],
  traitors: Traitor[] = [],
): PairBenefit | null => {
  const fa = factions[a];
  const fb = factions[b];
  if (!fa || !fb) return null;

  const player = game.playerFaction;
  const involvesPlayer = a === player || b === player;
  const isAllied = fa.alliances.includes(b);
  const synergy = getSynergy(a, b);

  const combinedThreat = (threats[a]?.score ?? 0) + (threats[b]?.score ?? 0);
  const combinedStrongholds = zonesOf(a, factions, controls) + zonesOf(b, factions, controls);
  const combinedSpice = (fa.estimatedSpice ?? 0) + (fb.estimatedSpice ?? 0);
  const combinedTroops = (fa.estimatedTroops ?? 0) + (fb.estimatedTroops ?? 0);
  const combinedTroopsOnMap = troopsOnMapOf(a, factions) + troopsOnMapOf(b, factions);
  const combinedAliveLeaders =
    fa.leaders.filter((l) => l.alive).length +
    fb.leaders.filter((l) => l.alive).length;
  const victoryReach = Math.min(combinedStrongholds / 4, 1);

  // ─── Stats tracker (cartes + traîtres détenus par les deux factions) ───
  const statsA = trackerStatsFor(a, fa, cards, traitors, game);
  const statsB = trackerStatsFor(b, fb, cards, traitors, game);
  const combinedWeapons = statsA.weapons + statsB.weapons;
  const combinedDefenses = statsA.defenses + statsB.defenses;
  const combinedSpecials = statsA.specials + statsB.specials;
  const combinedTraitors = statsA.activeEnemyTraitors + statsB.activeEnemyTraitors;
  const combinedKnownCards =
    statsA.cardsHeld + statsB.cardsHeld - statsA.unknowns - statsB.unknowns;

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

  // Troupes (vivantes au total ET déployées)
  if (combinedTroops >= 30) {
    reasons.push(`${combinedTroops} troupes vivantes — poids militaire majeur`);
  } else if (combinedTroops >= 18) {
    reasons.push(`${combinedTroops} troupes vivantes combinées`);
  }
  if (combinedTroopsOnMap >= 12) {
    reasons.push(
      `${combinedTroopsOnMap} troupes déployées sur le plateau (forte présence)`,
    );
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

  // ─── Tracker (cartes + traîtres) ───
  if (combinedWeapons >= 2) {
    reasons.push(
      `${combinedWeapons} armes connues combinées · ${combinedDefenses} défense${combinedDefenses > 1 ? 's' : ''}`,
    );
  } else if (combinedWeapons === 1) {
    reasons.push(`1 arme connue dans la paire`);
  }
  if (combinedSpecials >= 2) {
    reasons.push(`${combinedSpecials} cartes spéciales combinées`);
  }
  if (combinedTraitors > 0) {
    reasons.push(
      `${combinedTraitors} traître${combinedTraitors > 1 ? 's' : ''} actif${combinedTraitors > 1 ? 's' : ''} contre autres factions`,
    );
  }
  if (combinedKnownCards === 0 && statsA.unknowns + statsB.unknowns >= 3) {
    warnings.push(
      `Inconnu : ${statsA.unknowns + statsB.unknowns} cartes mystères, pas d'avantage info confirmé`,
    );
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

  // Contexte historique si Atreides est dans la paire
  let historicalContext: PairBenefit['historicalContext'] | undefined;
  if (game.playerFaction === 'atreides' && involvesPlayer) {
    const candidate: FactionId = a === 'atreides' ? b : a;
    const query = buildHistoricalQuery(game, factions, controls, candidate);
    const neighbors = findSimilarAlliances(query, 3);
    const prediction = knnAllianceWinRate(neighbors);
    if (prediction) {
      historicalContext = { prediction, neighbors };
    }
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
    combinedTroopsOnMap,
    combinedWeapons,
    combinedTraitors,
    victoryReach,
    reasons,
    warnings,
    recommendedAction,
    historicalContext,
  };
};
