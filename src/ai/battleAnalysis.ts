import type { Game } from '@/types/game';
import type { FactionId, FactionState, Leader } from '@/types/faction';
import type { TerritoryControl, TerritoryMeta } from '@/types/territory';
import type { CardTrackerEntry } from '@/types/card';
import type { Traitor } from '@/types/traitor';
import { TERRITORIES } from '@/data/territories';
import { FACTIONS } from '@/data/factions';
import { TREACHERY_CARDS } from '@/data/cards';
import {
  findSimilarBattles,
  knnVictoryProbability,
  type SimilarBattle,
} from './battleSimilarity';

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

export interface SimulatorInput {
  attackerId: FactionId;
  defenderId: FactionId;
  territoryId: string;
  troopsEngaged: number;
  maxDial: number;
}

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface Metric {
  score: number; // 0..100
  level: RiskLevel | 'positive' | 'negative' | 'neutral';
  label: string;
  reason: string;
}

export interface LeaderRecommendation {
  leaderName: string;
  leaderValue: number;
  rationale: string;
  isTraitor: boolean;
}

export interface BattleAnalysis {
  // Méta
  attackerId: FactionId;
  defenderId: FactionId;
  territory: TerritoryMeta | null;
  isPlayerAttacker: boolean;
  isPlayerInvolved: boolean;

  // 14 métriques
  victoryProbability: number; // 0..1 — probabilité hybride (heuristique + kNN)
  heuristicProbability: number; // version brute de l'heuristique
  knnProbability: number | null; // prédiction du kNN sur le dataset
  knnConfidence: number; // 0..1 — confiance dans la prédiction kNN
  similarBattles: SimilarBattle[]; // top 3 batailles historiques similaires
  traitorRisk: Metric;
  enemyWeaponRisk: Metric;
  poisonProjectileRisk: Metric;
  fullDialProbability: Metric;
  economicAdvantage: Metric;
  spiceCost: Metric;
  troopSpiceTrade: Metric;
  leaderDanger: Metric;
  territoryAdvantage: Metric;
  allianceSynergy: Metric;
  counterAttackDanger: Metric;
  longTermImpact: Metric;
  strategicValue: Metric;

  // Recommandations
  recommendedLeader: LeaderRecommendation | null;
  recommendedDial: { dial: number; rationale: string };
  dangerousCards: { name: string; type: string; reason: string }[];

  // Synthèse
  verdict: string;
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

const clamp = (v: number, min = 0, max = 100): number => Math.max(min, Math.min(max, v));

const strongholdsOf = (
  factionId: FactionId,
  controls: Record<string, TerritoryControl>,
): number =>
  TERRITORIES.filter(
    (t) => t.isStronghold && controls[t.id]?.controllingFaction === factionId,
  ).length;

// Bonus de combat lié à la capacité spéciale de chaque faction
const factionDialBonus = (factionId: FactionId, territory: TerritoryMeta | null): number => {
  switch (factionId) {
    case 'atreides':
      return 1; // Prescience : voit une carte adverse
    case 'fremen':
      return territory?.kind === 'sand' ? 2 : 0; // Mobilité désertique
    case 'emperor':
      return 1.5; // Sardaukar (doublage premiers troops abstrait)
    case 'harkonnen':
      return 0.5; // 2 cartes piochées → poids martial
    case 'bene_gesserit':
      return 0.5; // Voice = neutralise 1 carte
    default:
      return 0;
  }
};

const dialFromFaction = (
  troops: number,
  bestLeaderValue: number,
  territoryBonus: number,
): number => troops + bestLeaderValue + territoryBonus;

const aliveLeaders = (f: FactionState): Leader[] => f.leaders.filter((l) => l.alive);

const bestAliveLeader = (f: FactionState): Leader | null => {
  const alive = aliveLeaders(f);
  if (alive.length === 0) return null;
  return alive.reduce((best, l) => (l.value > best.value ? l : best), alive[0]);
};

const cardsHeldBy = (
  cards: CardTrackerEntry[],
  factionId: FactionId,
): CardTrackerEntry[] =>
  cards.filter((c) => c.knowledge === 'known' && c.heldBy === factionId);

const POISON_CARD_IDS = new Set([
  'chaumas',
  'chaumurky',
  'ellaca_drug',
  'gom_jabbar',
]);
const PROJECTILE_CARD_IDS = new Set([
  'crysknife',
  'maula_pistol',
  'slip_tip',
  'stunner',
  'hunter_seeker',
]);

const isPoison = (cardId: string): boolean => POISON_CARD_IDS.has(cardId);
const isProjectile = (cardId: string): boolean => PROJECTILE_CARD_IDS.has(cardId);

// ──────────────────────────────────────────────────────────
// Fonction principale
// ──────────────────────────────────────────────────────────

export const computeBattleAnalysis = (
  input: SimulatorInput,
  game: Game,
  factions: Record<FactionId, FactionState>,
  controls: Record<string, TerritoryControl>,
  cards: CardTrackerEntry[],
  traitors: Traitor[],
): BattleAnalysis | null => {
  const attacker = factions[input.attackerId];
  const defender = factions[input.defenderId];
  if (!attacker || !defender) return null;

  const territory =
    TERRITORIES.find((t) => t.id === input.territoryId) ?? null;
  const player = game.playerFaction;
  const isPlayerAttacker = input.attackerId === player;
  const isPlayerInvolved = isPlayerAttacker || input.defenderId === player;
  const playerSide = isPlayerAttacker ? attacker : defender;
  const enemySide = isPlayerAttacker ? defender : attacker;
  const enemyId = isPlayerAttacker ? input.defenderId : input.attackerId;

  // ─── Leaders et calcul de dial ───
  const playerBestLeader = bestAliveLeader(playerSide);
  const enemyBestLeader = bestAliveLeader(enemySide);

  const playerTerritoryBonus = factionDialBonus(playerSide.id, territory);
  const enemyTerritoryBonus = factionDialBonus(enemySide.id, territory);

  // Defender stronghold bonus (+1)
  const defenderBonus =
    territory?.isStronghold && input.defenderId === enemySide.id ? 1 : 0;

  const playerDial = Math.min(
    input.maxDial,
    dialFromFaction(
      input.troopsEngaged,
      playerBestLeader?.value ?? 0,
      playerTerritoryBonus,
    ),
  );

  const enemyEstimatedTroops = Math.min(enemySide.troopsOnMap ?? 10, 10);
  const enemyDialEstimate = dialFromFaction(
    enemyEstimatedTroops,
    enemyBestLeader?.value ?? 0,
    enemyTerritoryBonus + (isPlayerAttacker ? defenderBonus : 0),
  );

  // ─── 1. Probabilité de victoire (heuristique + kNN) ───
  const dialDelta = playerDial - enemyDialEstimate;
  const heuristicProb = sigmoid(dialDelta / 5);

  // kNN sur le dataset historique
  const knownTraitorRiskFlag =
    traitors.some(
      (t) =>
        t.gameId === game.id &&
        t.active &&
        (t.factionId === input.attackerId || t.factionId === input.defenderId),
    );
  const similarBattles = findSimilarBattles(
    {
      attackerFaction: input.attackerId,
      defenderFaction: input.defenderId,
      territoryName: territory?.name,
      isStronghold: territory?.isStronghold ?? false,
      attackerTroops: input.troopsEngaged,
      defenderTroops: defender.troopsOnMap ?? 0,
      attackerSpice: attacker.estimatedSpice ?? 0,
      defenderSpice: defender.estimatedSpice ?? 0,
      attackerLeaderValue:
        (isPlayerAttacker ? playerBestLeader : enemyBestLeader)?.value ?? 0,
      defenderLeaderValue:
        (isPlayerAttacker ? enemyBestLeader : playerBestLeader)?.value ?? 0,
      knownTraitorRisk: knownTraitorRiskFlag,
      attackerAllianceCount: attacker.alliances.length,
      defenderAllianceCount: defender.alliances.length,
    },
    3,
  );
  const knn = knnVictoryProbability(similarBattles);
  const knnProbability = knn ? knn.value : null;
  const knnConfidence = knn ? knn.confidence : 0;

  // Probabilité attaquant gagne, hybride
  const attackerProb =
    knnProbability !== null
      ? // Plus la confiance kNN est haute, plus on lui donne de poids (max 0.5)
        heuristicProb * (1 - 0.5 * knnConfidence) +
        knnProbability * (0.5 * knnConfidence)
      : heuristicProb;

  // L'utilisateur peut être le défenseur : la probabilité affichée est celle du joueur
  const victoryProbability = isPlayerAttacker ? attackerProb : 1 - attackerProb;
  const heuristicProbability = isPlayerAttacker
    ? heuristicProb
    : 1 - heuristicProb;

  // ─── 2. Risque de traître ───
  // Le joueur recommande son meilleur leader. Si l'ennemi le détient comme traître → critique
  const enemyTraitors = traitors.filter(
    (t) =>
      t.gameId === game.id &&
      t.factionId === enemyId &&
      t.leaderFactionId === playerSide.id &&
      t.active,
  );
  const enemyTraitorNames = new Set(
    enemyTraitors.map((t) => t.leaderName).filter(Boolean) as string[],
  );
  // Identifier les leaders "safe" (non traîtres)
  const safeLeaders = aliveLeaders(playerSide).filter(
    (l) => !enemyTraitorNames.has(l.name),
  );
  const knownTraitorLeaders = aliveLeaders(playerSide).filter((l) =>
    enemyTraitorNames.has(l.name),
  );
  let traitorRisk: Metric;
  if (knownTraitorLeaders.length > 0) {
    traitorRisk = {
      score: 90,
      level: 'critical',
      label: 'Critique',
      reason: `Trahisons connues : ${knownTraitorLeaders.map((l) => l.name).join(', ')}. Évitez ces leaders.`,
    };
  } else if (enemyTraitors.length > 0) {
    // L'ennemi a un traître mais on ne le connaît pas
    const aliveCount = aliveLeaders(playerSide).length;
    const denom = Math.max(aliveCount, 1);
    traitorRisk = {
      score: Math.round((enemyTraitors.length / denom) * 100),
      level: 'moderate',
      label: 'Modéré',
      reason: `Ennemi détient ${enemyTraitors.length} traître(s). Risque ${denom > 0 ? Math.round((enemyTraitors.length / denom) * 100) : 0}% par leader engagé.`,
    };
  } else {
    traitorRisk = {
      score: 15,
      level: 'low',
      label: 'Faible',
      reason: 'Aucun traître adverse identifié à ce jour.',
    };
  }

  // ─── 3. Risque arme ennemie ───
  const enemyCards = cardsHeldBy(cards, enemyId);
  const enemyWeapons = enemyCards.filter((c) => {
    const card = TREACHERY_CARDS.find((t) => t.id === c.cardId);
    return card?.type === 'weapon';
  });
  const enemyUnknownCount = cards.filter(
    (c) =>
      c.heldBy === enemyId &&
      c.knowledge === 'known' &&
      !c.cardId,
  ).length;
  const weaponRiskScore = clamp(
    enemyWeapons.length * 35 + enemyUnknownCount * 12,
  );
  const enemyWeaponRisk: Metric = {
    score: weaponRiskScore,
    level:
      weaponRiskScore >= 70
        ? 'critical'
        : weaponRiskScore >= 45
          ? 'high'
          : weaponRiskScore >= 20
            ? 'moderate'
            : 'low',
    label:
      weaponRiskScore >= 70
        ? 'Critique'
        : weaponRiskScore >= 45
          ? 'Élevé'
          : weaponRiskScore >= 20
            ? 'Modéré'
            : 'Faible',
    reason: `${enemyWeapons.length} arme(s) connue(s) en main · ${enemyUnknownCount} carte(s) inconnue(s).`,
  };

  // ─── 4. Risque poison/projectile ───
  const enemyPoison = enemyWeapons.filter((c) => c.cardId && isPoison(c.cardId));
  const enemyProjectile = enemyWeapons.filter(
    (c) => c.cardId && isProjectile(c.cardId),
  );
  const ppScore = clamp(enemyPoison.length * 40 + enemyProjectile.length * 30);
  const poisonProjectileRisk: Metric = {
    score: ppScore,
    level:
      ppScore >= 60 ? 'high' : ppScore >= 30 ? 'moderate' : 'low',
    label:
      ppScore >= 60 ? 'Élevé' : ppScore >= 30 ? 'Modéré' : 'Faible',
    reason: `${enemyPoison.length} poison · ${enemyProjectile.length} projectile. Considérez Snooper/Shield si disponible.`,
  };

  // ─── 5. Probabilité full dial ennemi ───
  const enemySpice = enemySide.estimatedSpice ?? 0;
  const enemyTroopsOnMap = enemySide.troopsOnMap ?? 0;
  const canFullDial =
    enemySpice >= input.troopsEngaged && enemyTroopsOnMap >= input.troopsEngaged;
  const fullDialScore = canFullDial ? 75 : 30;
  const fullDialProbability: Metric = {
    score: fullDialScore,
    level: canFullDial ? 'high' : 'moderate',
    label: canFullDial ? 'Élevée' : 'Modérée',
    reason: canFullDial
      ? `L'adversaire a ${enemySpice} épice et ${enemyTroopsOnMap} troupes en zone — full dial possible.`
      : `Limitations économiques : ${enemySpice} épice, ${enemyTroopsOnMap} troupes en zone.`,
  };

  // ─── 6. Avantage économique ───
  const spiceDelta = (playerSide.estimatedSpice ?? 0) - enemySpice;
  const economicAdvantage: Metric = {
    score: clamp(50 + spiceDelta * 3, 0, 100),
    level: spiceDelta >= 5 ? 'positive' : spiceDelta <= -5 ? 'negative' : 'neutral',
    label:
      spiceDelta >= 5
        ? 'Favorable'
        : spiceDelta <= -5
          ? 'Défavorable'
          : 'Équilibré',
    reason: `Vous : ${playerSide.estimatedSpice ?? 0} épice · Ennemi : ${enemySpice} épice (delta ${spiceDelta > 0 ? '+' : ''}${spiceDelta}).`,
  };

  // ─── 7. Coût en épice du dial ───
  // Chaque point de dial au-delà du leader coûte 1 épice par troupe engagée
  const leaderValue = playerBestLeader?.value ?? 0;
  const dialPointsAboveLeader = Math.max(0, input.maxDial - leaderValue);
  const estimatedSpiceCost = Math.min(dialPointsAboveLeader, input.troopsEngaged);
  const spiceCost: Metric = {
    score: clamp(estimatedSpiceCost * 12),
    level:
      estimatedSpiceCost >= 8
        ? 'high'
        : estimatedSpiceCost >= 4
          ? 'moderate'
          : 'low',
    label: `${estimatedSpiceCost} épice`,
    reason: `Dial ${input.maxDial} − valeur leader ${leaderValue} = ${dialPointsAboveLeader} pts × troupes ${input.troopsEngaged}.`,
  };

  // ─── 8. Trade troupe/spice ───
  const expectedKills = Math.min(input.troopsEngaged, enemyTroopsOnMap);
  const tradeRatio =
    estimatedSpiceCost > 0 ? expectedKills / estimatedSpiceCost : expectedKills;
  const troopSpiceTrade: Metric = {
    score: clamp(50 + tradeRatio * 15),
    level: tradeRatio >= 1.5 ? 'positive' : tradeRatio <= 0.5 ? 'negative' : 'neutral',
    label:
      tradeRatio >= 1.5
        ? 'Rentable'
        : tradeRatio <= 0.5
          ? 'Coûteux'
          : 'Équilibré',
    reason: `${expectedKills} pertes attendues pour ${estimatedSpiceCost} épice (ratio ${tradeRatio.toFixed(2)}).`,
  };

  // ─── 9. Danger leader ───
  const leaderAtRisk = playerBestLeader?.value ?? 0;
  const lossProb = 1 - victoryProbability + (knownTraitorLeaders.length > 0 ? 0.5 : 0);
  const expectedLoss = leaderAtRisk * Math.min(lossProb, 1);
  const leaderDanger: Metric = {
    score: clamp(expectedLoss * 8),
    level:
      expectedLoss >= 5 ? 'critical' : expectedLoss >= 3 ? 'high' : 'low',
    label:
      expectedLoss >= 5
        ? 'Critique'
        : expectedLoss >= 3
          ? 'Élevé'
          : 'Faible',
    reason: `Leader recommandé (val ${leaderAtRisk}) × proba perte ${(lossProb * 100).toFixed(0)}%.`,
  };

  // ─── 10. Avantage territoire ───
  const isHome = territory?.homeOf === playerSide.id;
  const isEnemyHome = territory?.homeOf === enemySide.id;
  const isStronghold = territory?.isStronghold ?? false;
  let territoryScore = 50;
  let territoryReason = territory?.name ?? 'Territoire inconnu';
  if (isHome) {
    territoryScore = 80;
    territoryReason += ' — votre maison (avantage défensif si attaquée)';
  } else if (isEnemyHome) {
    territoryScore = 30;
    territoryReason += ` — maison ${FACTIONS[enemySide.id].shortName} (défense renforcée)`;
  }
  if (isStronghold && isPlayerAttacker) {
    territoryScore -= 10;
    territoryReason += ' · stronghold (+1 défenseur)';
  }
  const territoryAdvantage: Metric = {
    score: clamp(territoryScore),
    level:
      territoryScore >= 65
        ? 'positive'
        : territoryScore <= 35
          ? 'negative'
          : 'neutral',
    label:
      territoryScore >= 65
        ? 'Favorable'
        : territoryScore <= 35
          ? 'Défavorable'
          : 'Neutre',
    reason: territoryReason,
  };

  // ─── 11. Synergie alliance ───
  const playerAlly = playerSide.alliances[0];
  let allianceSynergy: Metric;
  if (playerAlly) {
    const ally = factions[playerAlly];
    const allyHelp =
      (ally?.estimatedSpice ?? 0) * 0.3 + (ally?.troopsOnMap ?? 0) * 0.5;
    allianceSynergy = {
      score: clamp(40 + allyHelp),
      level: allyHelp >= 6 ? 'positive' : 'neutral',
      label: allyHelp >= 6 ? 'Forte' : 'Légère',
      reason: `Allié ${FACTIONS[playerAlly].shortName} — peut partager épice/leaders (${(ally?.estimatedSpice ?? 0)} épice).`,
    };
  } else {
    allianceSynergy = {
      score: 30,
      level: 'neutral',
      label: 'Aucune',
      reason: 'Vous combattez seul, sans renfort allié.',
    };
  }

  // ─── 12. Danger contre-attaque ───
  const remainingEnemyTroops = Math.max(0, enemyTroopsOnMap - expectedKills);
  const counterScore = clamp(remainingEnemyTroops * 8 + enemySpice * 1.5);
  const counterAttackDanger: Metric = {
    score: counterScore,
    level:
      counterScore >= 60 ? 'high' : counterScore >= 30 ? 'moderate' : 'low',
    label:
      counterScore >= 60 ? 'Élevé' : counterScore >= 30 ? 'Modéré' : 'Faible',
    reason: `${remainingEnemyTroops} troupes ennemies résiduelles + ${enemySpice} épice pour répliquer.`,
  };

  // ─── 13. Impact long terme ───
  const playerStrongholds = strongholdsOf(playerSide.id, controls);
  let impactScore = 50;
  let impactReason = '';
  if (isStronghold && isPlayerAttacker) {
    impactScore += 25;
    impactReason = `Conquête stronghold → +1 (${playerStrongholds + 1}/4 vers victoire alliée).`;
  } else if (isStronghold && !isPlayerAttacker) {
    impactScore += 15;
    impactReason = `Défense d'un stronghold acquis (préservation forteresse).`;
  } else {
    impactScore -= 5;
    impactReason = `Territoire non-stronghold — impact victoire limité.`;
  }
  if (leaderAtRisk >= 8) {
    impactScore -= 15;
    impactReason += ` Perte potentielle de leader val ${leaderAtRisk}.`;
  }
  const longTermImpact: Metric = {
    score: clamp(impactScore),
    level: impactScore >= 65 ? 'positive' : impactScore <= 40 ? 'negative' : 'neutral',
    label:
      impactScore >= 65
        ? 'Stratégique'
        : impactScore <= 40
          ? 'Marginal'
          : 'Modéré',
    reason: impactReason,
  };

  // ─── 14. Valeur stratégique ───
  const turnPressure = Math.min(game.currentTurn / 10, 1);
  const territorySpice = controls[territory?.id ?? '']?.hasSpice ? 8 : 0;
  const strategicScore = clamp(
    (isStronghold ? 60 : 30) + territorySpice + turnPressure * 20,
  );
  const strategicValue: Metric = {
    score: strategicScore,
    level:
      strategicScore >= 70
        ? 'positive'
        : strategicScore >= 45
          ? 'neutral'
          : 'negative',
    label:
      strategicScore >= 70
        ? 'Élevée'
        : strategicScore >= 45
          ? 'Modérée'
          : 'Faible',
    reason: `${isStronghold ? 'Stronghold ' : ''}${territorySpice > 0 ? '· épice présente ' : ''}· tour ${game.currentTurn}.`,
  };

  // ─── Recommandation leader ───
  let recommendedLeader: LeaderRecommendation | null = null;
  if (knownTraitorLeaders.length > 0) {
    // Risque traître : recommander un leader safe sacrifiable (valeur moyenne)
    const safeSorted = [...safeLeaders].sort((a, b) => a.value - b.value);
    const sacrificial =
      safeSorted.find((l) => l.value <= 3) || safeSorted[0] || null;
    if (sacrificial) {
      recommendedLeader = {
        leaderName: sacrificial.name,
        leaderValue: sacrificial.value,
        rationale: `Leader sacrifiable (val ${sacrificial.value}) — évite vos leaders connus comme traîtres.`,
        isTraitor: false,
      };
    }
  } else {
    // Sinon : équilibre entre valeur et risque
    const candidate = playerBestLeader;
    if (candidate) {
      recommendedLeader = {
        leaderName: candidate.name,
        leaderValue: candidate.value,
        rationale: `Meilleur leader vivant (val ${candidate.value}), pas de risque traître identifié.`,
        isTraitor: false,
      };
    }
  }

  // ─── Recommandation dial ───
  const recommendedDialValue = Math.min(
    input.maxDial,
    Math.max(1, Math.ceil(enemyDialEstimate + 2)),
  );
  const dialDeltaRec = recommendedDialValue - (recommendedLeader?.leaderValue ?? 0);
  const recommendedDial = {
    dial: recommendedDialValue,
    rationale: `Estimation ennemie ${enemyDialEstimate.toFixed(1)} + marge 2. Coût ≈ ${Math.max(0, dialDeltaRec)} épice.`,
  };

  // ─── Cartes dangereuses probables ───
  const dangerousCards: { name: string; type: string; reason: string }[] = [];
  for (const entry of enemyWeapons) {
    const card = TREACHERY_CARDS.find((c) => c.id === entry.cardId);
    if (!card) continue;
    let reason = `${card.type} en main connue`;
    if (isPoison(card.id)) reason = 'Poison — annulé par Snooper';
    else if (isProjectile(card.id)) reason = 'Projectile — annulé par Shield';
    dangerousCards.push({ name: card.name, type: card.type, reason });
    if (dangerousCards.length >= 3) break;
  }

  // ─── Verdict synthétique ───
  let verdict: string;
  if (knownTraitorLeaders.length > 0 && safeLeaders.length === 0) {
    verdict = '⚠ Engagement extrêmement risqué : tous vos leaders disponibles sont des traîtres connus de l\'ennemi. Évitez la bataille ou utilisez une troupe sans leader.';
  } else if (victoryProbability >= 0.7) {
    verdict = `Bataille favorable (${(victoryProbability * 100).toFixed(0)}%). ${strategicScore >= 60 ? 'Engagement stratégique recommandé.' : 'Évaluez le rapport coût/bénéfice.'}`;
  } else if (victoryProbability >= 0.45) {
    verdict = `Issue incertaine (${(victoryProbability * 100).toFixed(0)}%). ${counterScore >= 60 ? 'Attention à la contre-attaque.' : 'Bataille acceptable si gain stratégique.'}`;
  } else {
    verdict = `Risque élevé (${(victoryProbability * 100).toFixed(0)}% de victoire). ${strategicScore < 50 ? 'Considérez une retraite ou un détour.' : 'À engager uniquement si l\'objectif est majeur.'}`;
  }

  return {
    attackerId: input.attackerId,
    defenderId: input.defenderId,
    territory,
    isPlayerAttacker,
    isPlayerInvolved,
    victoryProbability,
    heuristicProbability,
    knnProbability,
    knnConfidence,
    similarBattles,
    traitorRisk,
    enemyWeaponRisk,
    poisonProjectileRisk,
    fullDialProbability,
    economicAdvantage,
    spiceCost,
    troopSpiceTrade,
    leaderDanger,
    territoryAdvantage,
    allianceSynergy,
    counterAttackDanger,
    longTermImpact,
    strategicValue,
    recommendedLeader,
    recommendedDial,
    dangerousCards,
    verdict,
  };
};
