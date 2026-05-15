import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Handshake,
  ShieldAlert,
  Unlink,
  Sparkles,
  AlertTriangle,
  X,
  Check,
  Coins,
  Users as UsersIcon,
  Castle,
} from 'lucide-react';
import {
  useCardsStore,
  useCurrentGame,
  useFactionStore,
  useMapStore,
  useTraitorsStore,
} from '@/store';
import { useAnalysis } from '@/hooks/useAnalysis';
import { computePairBenefit } from '@/ai/allianceSuggestions';
import type { ThreatBreakdown } from '@/ai/threatScoring';
import { FACTIONS, factionTextColor } from '@/data/factions';
import type { FactionId, FactionState } from '@/types/faction';
import type { Game } from '@/types/game';
import type { TerritoryControl } from '@/types/territory';
import type { CardTrackerEntry } from '@/types/card';
import type { Traitor } from '@/types/traitor';
import { Card as UICard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FactionPill } from '@/components/ui/FactionPill';
import { FactionIcon } from '@/components/icons/FactionIcon';
import { AllianceWheel } from '@/components/widgets/AllianceWheel';
import { cn } from '@/lib/cn';

export const AlliancesPage = () => {
  const game = useCurrentGame();
  const byGame = useFactionStore((s) => s.byGame);
  const setAlliance = useFactionStore((s) => s.setAlliance);
  const mapByGame = useMapStore((s) => s.byGame);
  const allCards = useCardsStore((s) => s.entries);
  const allTraitors = useTraitorsStore((s) => s.traitors);
  const analysis = useAnalysis();
  const [selectedPair, setSelectedPair] = useState<[FactionId, FactionId] | null>(null);

  if (!game) return <Navigate to="/games" replace />;
  const factions = byGame[game.id];
  if (!factions || !analysis) return null;
  const controls = mapByGame[game.id] ?? {};
  const cards = allCards.filter((c) => c.gameId === game.id);
  const traitors = allTraitors.filter((t) => t.gameId === game.id);

  const player = game.playerFaction;
  const factionList = game.factionsInPlay;

  // Paires d'alliance actives (dédoublonnées)
  const activePairs: [FactionId, FactionId][] = [];
  const seenPairs = new Set<string>();
  factionList.forEach((a) => {
    factions[a]?.alliances.forEach((b) => {
      const key = [a, b].sort().join('|');
      if (!seenPairs.has(key) && factionList.includes(b)) {
        seenPairs.add(key);
        activePairs.push([a, b]);
      }
    });
  });

  const playerCurrentAlly = factions[player]?.alliances[0];
  const playerHasAlliance = !!playerCurrentAlly;

  // Si le joueur a déjà une alliance, on n'affiche plus de suggestions :
  // briser puis re-forger reste possible via la matrice et le bouton "Briser".
  const opportunities = playerHasAlliance
    ? []
    : analysis.allianceOpportunities.slice(0, 3);
  const dangers = analysis.potentialAllianceDangers.slice(0, 3);
  const playerOppKeys = new Set(
    opportunities.map((o) => [o.factions[0], o.factions[1]].sort().join('|')),
  );
  const dangerKeys = new Set(
    dangers.map((d) => [d.factions[0], d.factions[1]].sort().join('|')),
  );

  const isAllied = (a: FactionId, b: FactionId) =>
    factions[a]?.alliances.includes(b) ?? false;

  const toggle = (a: FactionId, b: FactionId) => {
    setAlliance(game.id, a, b, !isAllied(a, b));
  };

  return (
    <div className="px-4 lg:px-6 py-6 space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Handshake className="text-atreides-gold" size={22} />
        <div>
          <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold">
            Alliances
          </h1>
          <p className="text-xs text-atreides-silverMuted">
            Une faction ne peut avoir qu&apos;une seule alliance à la fois · forger en brise toute autre automatiquement.
          </p>
        </div>
      </div>

      {/* ─── Recommandations ─── */}
      <div className="grid lg:grid-cols-2 gap-4">
        <UICard
          title={
            <span className="flex items-center gap-2">
              <Sparkles size={14} /> Opportunités pour vous
            </span>
          }
          subtitle={`Top ${opportunities.length} alliances suggérées`}
          variant="highlight"
        >
          {opportunities.length === 0 ? (
            playerHasAlliance ? (
              <div className="text-center py-4 px-3">
                <Handshake size={28} className="mx-auto text-atreides-gold mb-2" />
                <p className="text-sm text-atreides-silver font-serif">
                  Pacte actif avec {FACTIONS[playerCurrentAlly].shortName}
                </p>
                <p className="text-[11px] text-atreides-silverMuted mt-1.5 max-w-xs mx-auto">
                  Brisez d&apos;abord votre alliance actuelle pour voir d&apos;autres
                  recommandations.
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<Unlink size={12} />}
                  onClick={() => setAlliance(game.id, player, playerCurrentAlly, false)}
                  className="mt-3"
                >
                  Briser l&apos;alliance
                </Button>
              </div>
            ) : (
              <EmptyState
                title="Aucune opportunité"
                description="Aucune faction disponible ne représente un gain stratégique pour l'instant."
              />
            )
          ) : (
            <ul className="space-y-2">
              {opportunities.map((opp, idx) => {
                const [, target] = opp.factions;
                const playerCurrentAlly = factions[player]?.alliances[0];
                const targetCurrentAlly = factions[target]?.alliances[0];
                const willBreakPlayerAlliance = !!playerCurrentAlly;
                const willBreakTargetAlliance = !!targetCurrentAlly;
                return (
                  <motion.li
                    key={target}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-3 rounded border border-atreides-gold/25 bg-atreides-deep/40"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <FactionIcon faction={target} size={28} />
                        <div>
                          <p
                            className="text-sm font-serif"
                            style={{ color: factionTextColor(target) }}
                          >
                            {FACTIONS[target].shortName}
                          </p>
                          <p className="text-[10px] font-mono text-atreides-silverMuted">
                            Score d&apos;opportunité {opp.score}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="gold"
                        leftIcon={<Handshake size={12} />}
                        onClick={() => toggle(player, target)}
                      >
                        Forger
                      </Button>
                    </div>
                    {opp.reasons.length > 0 && (
                      <ul className="space-y-0.5 mt-1">
                        {opp.reasons.map((r, i) => (
                          <li
                            key={i}
                            className="text-[11px] text-atreides-silver/90 flex items-start gap-1"
                          >
                            <span className="text-atreides-gold/70 shrink-0">•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                    {opp.historicalWinRate !== undefined && (
                      <div className="mt-2 pt-2 border-t border-atreides-gold/10 flex items-center gap-2">
                        <Badge
                          tone={
                            opp.historicalWinRate >= 0.6
                              ? 'gold'
                              : opp.historicalWinRate <= 0.4
                                ? 'red'
                                : 'neutral'
                          }
                        >
                          Hist. {Math.round(opp.historicalWinRate * 100)}%
                        </Badge>
                        <span className="text-[10px] text-atreides-silverMuted font-mono">
                          {opp.historicalSampleSize} précédent(s) similaire(s)
                        </span>
                      </div>
                    )}
                    {(willBreakPlayerAlliance || willBreakTargetAlliance) && (
                      <p className="mt-2 pt-2 border-t border-severity-warning/20 text-[10px] text-severity-warning font-mono flex items-start gap-1">
                        <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                        <span>
                          Brisera{' '}
                          {willBreakPlayerAlliance && (
                            <>
                              votre pacte avec{' '}
                              <span className="text-atreides-silver">
                                {FACTIONS[playerCurrentAlly!].shortName}
                              </span>
                            </>
                          )}
                          {willBreakPlayerAlliance && willBreakTargetAlliance && ' et '}
                          {willBreakTargetAlliance && (
                            <>
                              le pacte {FACTIONS[target].shortName} ↔{' '}
                              <span className="text-atreides-silver">
                                {FACTIONS[targetCurrentAlly!].shortName}
                              </span>
                            </>
                          )}
                        </span>
                      </p>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          )}
        </UICard>

        <UICard
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle size={14} /> Dangers potentiels
            </span>
          }
          subtitle="Coalitions adverses à anticiper"
        >
          {dangers.length === 0 ? (
            <EmptyState
              title="Pas de menace coalition"
              description="Aucune paire d'adversaires ne formerait une alliance critique pour vous."
            />
          ) : (
            <ul className="space-y-2">
              {dangers.map((d) => (
                <li
                  key={d.factions.join('-')}
                  className="p-2.5 rounded border border-severity-danger/30 bg-severity-danger/5"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <FactionPill id={d.factions[0]} />
                    <span className="text-atreides-silverMuted">⇌</span>
                    <FactionPill id={d.factions[1]} />
                  </div>
                  <p className="text-[11px] text-atreides-silver">{d.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </UICard>
      </div>

      {/* ─── Alliances actives ─── */}
      <UICard
        title={
          <span className="flex items-center gap-2">
            <Handshake size={14} /> Alliances actives
          </span>
        }
        subtitle={`${activePairs.length} pacte(s) en cours`}
      >
        {activePairs.length === 0 ? (
          <EmptyState
            title="Aucune alliance en cours"
            description="Les puissances de l'Imperium évoluent encore en solitaire."
          />
        ) : (
          <ul className="grid sm:grid-cols-2 gap-2">
            {activePairs.map(([a, b]) => {
              const involvesPlayer = a === player || b === player;
              return (
                <li
                  key={`${a}-${b}`}
                  className={cn(
                    'flex items-center justify-between gap-3 p-2.5 rounded border',
                    involvesPlayer
                      ? 'border-atreides-gold/40 bg-atreides-gold/5'
                      : 'border-atreides-gold/15 bg-atreides-deep/40',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <FactionPill id={a} />
                    <span className="text-atreides-silverMuted">↔</span>
                    <FactionPill id={b} />
                    {involvesPlayer && <Badge tone="gold">Vous</Badge>}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Unlink size={12} />}
                    onClick={() => setAlliance(game.id, a, b, false)}
                  >
                    Briser
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </UICard>

      {/* ─── Cercle des alliances ─── */}
      <UICard
        title={
          <span className="flex items-center gap-2">
            <ShieldAlert size={14} /> Cercle des alliances
          </span>
        }
        subtitle="Cliquez une faction puis une autre pour basculer l'alliance"
      >
        <AllianceWheel
          factionsInPlay={factionList}
          alliances={
            Object.fromEntries(
              factionList.map((f) => [f, factions[f]?.alliances ?? []]),
            ) as Record<FactionId, FactionId[]>
          }
          suggestedPairs={playerOppKeys}
          dangerPairs={dangerKeys}
          onToggleAlliance={toggle}
          onSelectPair={(a, b) => setSelectedPair([a, b])}
          selectedPair={selectedPair}
        />
        <div className="flex flex-wrap items-center justify-center gap-5 mt-4 pt-3 border-t border-atreides-gold/10 text-[10px] font-mono text-atreides-silverMuted">
          <span className="flex items-center gap-2">
            <span className="inline-block w-7 h-0.5 bg-atreides-gold" />
            allié
          </span>
          <span className="flex items-center gap-2">
            <span
              className="inline-block w-7"
              style={{ borderTop: '1.5px dashed #2c4d9e', height: 0 }}
            />
            suggéré
          </span>
          <span className="flex items-center gap-2">
            <span
              className="inline-block w-7"
              style={{ borderTop: '1.5px dashed #7f1d1d', height: 0 }}
            />
            danger
          </span>
          <span className="italic text-atreides-silverMuted/70">
            Clic sur une ligne pour inspecter
          </span>
        </div>

        {/* Panneau de détails de la paire sélectionnée */}
        {selectedPair && (
          <PairBenefitPanel
            pair={selectedPair}
            game={game}
            factions={factions}
            controls={controls}
            threats={analysis.threats}
            cards={cards}
            traitors={traitors}
            onClose={() => setSelectedPair(null)}
            onForge={() => {
              setAlliance(game.id, selectedPair[0], selectedPair[1], true);
            }}
            onBreak={() => {
              setAlliance(game.id, selectedPair[0], selectedPair[1], false);
            }}
          />
        )}
      </UICard>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// Sub-component : panneau de détails d'une paire d'alliance
// ──────────────────────────────────────────────────────────

interface PairBenefitPanelProps {
  pair: [FactionId, FactionId];
  game: Game;
  factions: Record<FactionId, FactionState>;
  controls: Record<string, TerritoryControl>;
  threats: Record<FactionId, ThreatBreakdown>;
  cards: CardTrackerEntry[];
  traitors: Traitor[];
  onClose: () => void;
  onForge: () => void;
  onBreak: () => void;
}

const PairBenefitPanel = ({
  pair,
  game,
  factions,
  controls,
  threats,
  cards,
  traitors,
  onClose,
  onForge,
  onBreak,
}: PairBenefitPanelProps) => {
  const benefit = computePairBenefit(
    pair[0],
    pair[1],
    game,
    factions,
    controls,
    threats,
    cards,
    traitors,
  );
  if (!benefit) return null;

  const [a, b] = benefit.factions;
  const metaA = FACTIONS[a];
  const metaB = FACTIONS[b];

  const actionLabel = benefit.isAllied ? 'Briser l\'alliance' : 'Forger l\'alliance';
  const actionVariant: 'gold' | 'danger' = benefit.isAllied ? 'danger' : 'gold';
  const actionIcon = benefit.isAllied ? <Unlink size={12} /> : <Handshake size={12} />;
  const actionHandler = benefit.isAllied ? onBreak : onForge;

  const recommendationBadge = (() => {
    switch (benefit.recommendedAction) {
      case 'forge':
        return <Badge tone="gold">Recommandé</Badge>;
      case 'break':
        return <Badge tone="neutral">Optionnel à briser</Badge>;
      case 'avoid':
        return <Badge tone="red">À éviter</Badge>;
      default:
        return null;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 rounded-lg border border-atreides-gold/30 bg-atreides-deep/60"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <FactionIcon faction={a} size={32} />
          <span className="text-atreides-gold text-xl font-display">↔</span>
          <FactionIcon faction={b} size={32} />
          <div className="ml-2">
            <p className="font-serif text-sm text-atreides-silver">
              <span style={{ color: factionTextColor(a) }}>{metaA.shortName}</span>
              {' & '}
              <span style={{ color: factionTextColor(b) }}>{metaB.shortName}</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              {benefit.isAllied ? (
                <Badge tone="gold">
                  <Check size={10} /> Alliance active
                </Badge>
              ) : (
                <Badge tone="neutral">Non alliés</Badge>
              )}
              {recommendationBadge}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
          title="Fermer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Statistiques combinées */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <StatBox
          icon={<Castle size={12} />}
          label="Forteresses"
          value={`${benefit.combinedStrongholds}/4`}
          highlight={benefit.combinedStrongholds >= 3}
          progress={benefit.victoryReach}
        />
        <StatBox
          icon={<UsersIcon size={12} />}
          label="Troupes"
          value={`${benefit.combinedTroops}`}
        />
        <StatBox
          icon={<Coins size={12} />}
          label="Épice"
          value={`${benefit.combinedSpice}`}
        />
        <StatBox
          icon={<ShieldAlert size={12} />}
          label="Menace combinée"
          value={`${benefit.combinedThreat}`}
        />
      </div>

      {/* Bénéfices */}
      {benefit.reasons.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted mb-1.5 flex items-center gap-1">
            <Sparkles size={11} /> Bénéfices
          </p>
          <ul className="space-y-0.5">
            {benefit.reasons.map((r, i) => (
              <li
                key={i}
                className="text-[11px] text-atreides-silver flex items-start gap-1"
              >
                <span className="text-atreides-gold/70 shrink-0">+</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Vigilance */}
      {benefit.warnings.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase font-display tracking-wider text-severity-warning mb-1.5 flex items-center gap-1">
            <AlertTriangle size={11} /> Vigilance
          </p>
          <ul className="space-y-0.5">
            {benefit.warnings.map((w, i) => (
              <li
                key={i}
                className="text-[11px] text-atreides-silver/90 flex items-start gap-1"
              >
                <span className="text-severity-warning shrink-0">!</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Précédents Atreides (kNN) */}
      {benefit.historicalContext && (
        <div className="mb-3 p-2.5 rounded border border-atreides-gold/20 bg-atreides-deep/40">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase font-display tracking-wider text-atreides-gold flex items-center gap-1">
              <Sparkles size={11} /> Précédents Atreides
            </p>
            <span className="text-[10px] font-mono text-atreides-silverMuted">
              Win rate {Math.round(benefit.historicalContext.prediction.winRate * 100)}% ·
              confiance {Math.round(benefit.historicalContext.prediction.confidence * 100)}%
            </span>
          </div>
          <ul className="space-y-1">
            {benefit.historicalContext.neighbors.map(({ battle, similarity, atreidesWon }) => (
              <li
                key={battle.gameId}
                className="flex items-center gap-2 p-1.5 rounded bg-atreides-deep/60 border border-atreides-gold/10 text-[11px]"
              >
                <span className="font-mono text-[10px] text-atreides-silverMuted shrink-0 w-12">
                  {battle.gameId.replace('ALLIANCE_', '#')}
                </span>
                <span className="text-[10px] text-atreides-silverMuted shrink-0 w-12 capitalize">
                  {battle.gamePhase}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <FactionIcon faction="atreides" size={14} />
                  <span className="text-atreides-silverMuted">+</span>
                  <FactionIcon faction={battle.atreidesAlliance} size={14} />
                </span>
                <span className="text-atreides-silverMuted text-[10px]">vs</span>
                <span className="flex items-center gap-0.5 shrink-0">
                  {battle.enemyAlliance.map((f) => (
                    <FactionIcon key={f} faction={f} size={14} />
                  ))}
                </span>
                <span className="flex-1 text-[10px] text-atreides-silverMuted truncate">
                  T{battle.round} · {battle.atreidesStrongholds + battle.alliedStrongholds}/
                  {battle.enemyStrongholds} SH
                </span>
                <Badge tone={atreidesWon ? 'gold' : 'red'}>
                  {atreidesWon ? 'Victoire' : 'Défaite'}
                </Badge>
                <span
                  className="font-mono text-[10px] text-atreides-gold/70 shrink-0 w-10 text-right"
                  title="Similarité"
                >
                  {Math.round(similarity * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end pt-2 border-t border-atreides-gold/10">
        <Button
          size="sm"
          variant={actionVariant}
          leftIcon={actionIcon}
          onClick={() => {
            actionHandler();
            onClose();
          }}
        >
          {actionLabel}
        </Button>
      </div>
    </motion.div>
  );
};

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
  progress?: number;
}

const StatBox = ({ icon, label, value, highlight, progress }: StatBoxProps) => (
  <div
    className={cn(
      'p-2 rounded border text-center',
      highlight
        ? 'border-atreides-gold/50 bg-atreides-gold/5'
        : 'border-atreides-gold/15 bg-atreides-deep/40',
    )}
  >
    <p className="text-[9px] uppercase font-mono tracking-wider text-atreides-silverMuted flex items-center justify-center gap-1">
      {icon} {label}
    </p>
    <p
      className={cn(
        'font-display text-lg tabular-nums leading-tight',
        highlight ? 'text-atreides-gold' : 'text-atreides-silver',
      )}
    >
      {value}
    </p>
    {progress !== undefined && (
      <div className="h-1 mt-1 bg-atreides-deep rounded-full overflow-hidden">
        <div
          className="h-full bg-atreides-gold transition-all"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    )}
  </div>
);
