import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  HelpCircle,
  Skull,
  Trash2,
  Eye,
  RotateCcw,
  X,
  Coins,
  RotateCw,
  Filter,
  Layers,
  ChevronDown,
  Crown,
  UserX,
  Crosshair,
  Droplet,
  Zap,
  Shield as ShieldIcon,
  Hand,
  Asterisk,
  Gavel,
  Info,
  type LucideIcon,
} from 'lucide-react';
import {
  useCardsStore,
  useCurrentGame,
  useTraitorsStore,
  useFactionStore,
  useSettingsStore,
  MAX_TRAITORS_PER_FACTION,
} from '@/store';
import { TREACHERY_CARDS, getCard, cardNameKey, cardDescKey, cardSubtitleKey } from '@/data/cards';
import { FACTIONS, FACTION_IDS, factionTextColor } from '@/data/factions';
import { LEADER_SEED, findLeaderSeed } from '@/data/leaders';
import type { CardType, TreacheryCard, CardTrackerEntry } from '@/types/card';
import type { Traitor } from '@/types/traitor';
import type { FactionId } from '@/types/faction';
import { Card as UICard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { FactionIcon } from '@/components/icons/FactionIcon';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';

const TYPE_KEY: Record<CardType, string> = {
  weapon: 'cards.type.weapon',
  defense: 'cards.type.defense',
  special: 'cards.type.special',
  worthless: 'cards.type.worthless',
};

const TYPE_TONE: Record<CardType, 'red' | 'blue' | 'gold' | 'neutral'> = {
  weapon: 'red',
  defense: 'blue',
  special: 'gold',
  worthless: 'neutral',
};

// Themed background per card type — matches the playing-card mockup.
const CARD_THEME: Record<CardType, { bg: string; border: string; medallion: string; ring: string; icon: string }> = {
  weapon: {
    bg: 'bg-[#5a1c1c]', border: 'border-[#7a2828]',
    medallion: 'bg-gradient-to-br from-red-700 via-red-900 to-red-950',
    ring: 'ring-red-400/70', icon: 'text-red-50',
  },
  defense: {
    bg: 'bg-[#0e1a3a]', border: 'border-[#1e3160]',
    medallion: 'bg-gradient-to-br from-blue-700 via-blue-900 to-blue-950',
    ring: 'ring-blue-400/70', icon: 'text-blue-50',
  },
  special: {
    bg: 'bg-[#2a3a1c]', border: 'border-[#3d5028]',
    medallion: 'bg-gradient-to-br from-green-700 via-green-900 to-green-950',
    ring: 'ring-green-400/70', icon: 'text-green-50',
  },
  worthless: {
    bg: 'bg-[#3d2d1a]', border: 'border-[#5a4527]',
    medallion: 'bg-gradient-to-br from-amber-700 via-amber-900 to-amber-950',
    ring: 'ring-amber-400/70', icon: 'text-amber-50',
  },
};

const UNKNOWN_THEME = {
  bg: 'bg-atreides-deep/70', border: 'border-atreides-gold/20',
  medallion: 'bg-gradient-to-br from-atreides-navy to-atreides-deep',
  ring: 'ring-atreides-gold/40', icon: 'text-atreides-silverMuted',
};

const getCardIcon = (card: TreacheryCard): LucideIcon => {
  if (card.type === 'weapon') {
    if (card.subtype === 'projectile') return Crosshair;
    if (card.subtype === 'poison') return Droplet;
    return Zap; // special weapons (lasgun, stone burner)
  }
  if (card.type === 'defense') return ShieldIcon;
  if (card.type === 'special') return Hand;
  return Asterisk;
};

const CardMedallion = ({ card, size = 'md' }: { card?: TreacheryCard; size?: 'sm' | 'md' }) => {
  const Icon = card ? getCardIcon(card) : HelpCircle;
  const theme = card ? CARD_THEME[card.type] : UNKNOWN_THEME;
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 14 : 18;
  return (
    <div
      className={cn(
        'shrink-0 rounded-full flex items-center justify-center ring-2 shadow-md',
        theme.medallion,
        theme.ring,
        dim,
      )}
    >
      <Icon size={iconSize} className={cn('drop-shadow', theme.icon)} />
    </div>
  );
};

type AddTarget = { factionId: FactionId } | { eliminated: true };
type Section = 'spice' | 'leaders' | 'cards' | 'traitors';

const SECTION_ORDER: Section[] = ['spice', 'leaders', 'cards', 'traitors'];

const SECTION_ICON: Record<Section, LucideIcon> = {
  spice: Coins,
  leaders: Crown,
  cards: Layers,
  traitors: UserX,
};

const SECTION_LABEL_KEY: Record<Section, string> = {
  spice: 'tracker.spiceLabel',
  leaders: 'tracker.leaders',
  cards: 'tracker.cards',
  traitors: 'tracker.traitors',
};

export const CardsPage = () => {
  const t = useT();
  const game = useCurrentGame();
  const entries = useCardsStore((s) => s.entries);
  const addEntry = useCardsStore((s) => s.addEntry);
  const updateEntry = useCardsStore((s) => s.updateEntry);
  const removeEntry = useCardsStore((s) => s.removeEntry);
  const traitors = useTraitorsStore((s) => s.traitors);
  const addTraitorSlot = useTraitorsStore((s) => s.addSlot);
  const assignTraitorLeader = useTraitorsStore((s) => s.assignLeader);
  const clearTraitorLeader = useTraitorsStore((s) => s.clearLeader);
  const toggleTraitorActive = useTraitorsStore((s) => s.toggleActive);
  const removeTraitorSlot = useTraitorsStore((s) => s.removeSlot);
  const factionStateByGame = useFactionStore((s) => s.byGame);
  const updateFaction = useFactionStore((s) => s.updateFaction);
  const killLeader = useFactionStore((s) => s.killLeader);
  const reviveLeader = useFactionStore((s) => s.reviveLeader);

  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [revealEntry, setRevealEntry] = useState<CardTrackerEntry | null>(null);
  const [traitorPickTarget, setTraitorPickTarget] = useState<Traitor | null>(null);
  const [addingTraitorFor, setAddingTraitorFor] = useState<FactionId | null>(null);
  const [selectedFactions, setSelectedFactions] = useState<Set<FactionId>>(new Set());
  const [biddingOpen, setBiddingOpen] = useState(false);
  const hiddenSectionsArr = useSettingsStore((s) => s.hiddenTrackerSections);
  const toggleTrackerSection = useSettingsStore((s) => s.toggleTrackerSection);
  const hiddenSections = useMemo(() => new Set(hiddenSectionsArr), [hiddenSectionsArr]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleSection = (s: Section) => toggleTrackerSection(s);
  const isVisible = (s: Section) => !hiddenSections.has(s);

  if (!game) return <Navigate to="/" replace />;

  const list = entries.filter((e) => e.gameId === game.id);
  const inHand = list.filter((e) => e.knowledge === 'known');
  const eliminated = list.filter((e) => e.knowledge === 'eliminated');

  const cardsByFaction = useMemo(() => {
    const map = new Map<FactionId, CardTrackerEntry[]>();
    game.factionsInPlay.forEach((id) => map.set(id, []));
    inHand.forEach((e) => {
      if (e.heldBy && map.has(e.heldBy)) {
        map.get(e.heldBy)!.push(e);
      }
    });
    return map;
  }, [inHand, game.factionsInPlay]);

  const traitorsByFaction = useMemo(() => {
    const map = new Map<FactionId, Traitor[]>();
    game.factionsInPlay.forEach((id) => map.set(id, []));
    traitors
      .filter((t) => t.gameId === game.id)
      .forEach((t) => {
        if (map.has(t.factionId)) map.get(t.factionId)!.push(t);
      });
    map.forEach((arr) => arr.sort((a, b) => a.createdAt - b.createdAt));
    return map;
  }, [traitors, game.id, game.factionsInPlay]);

  const groupedCards = useMemo(() => {
    const groups: Record<CardType, TreacheryCard[]> = {
      weapon: [],
      defense: [],
      special: [],
      worthless: [],
    };
    TREACHERY_CARDS.forEach((c) => groups[c.type].push(c));
    return groups;
  }, []);

  // Cartes déjà placées dans le tracker (toutes factions + éliminées)
  const usedCardIds = useMemo(
    () => new Set(list.filter((e) => e.cardId).map((e) => e.cardId as string)),
    [list],
  );

  // Leaders déjà assignés comme traîtres (toutes factions confondues)
  const usedLeaderKeys = useMemo(
    () =>
      new Set(
        traitors
          .filter(
            (t) => t.gameId === game.id && t.leaderName && t.leaderFactionId,
          )
          .map((t) => `${t.leaderFactionId}|${t.leaderName}`),
      ),
    [traitors, game.id],
  );

  const addUnknown = (target: AddTarget) => {
    if ('eliminated' in target) {
      addEntry({
        gameId: game.id,
        cardId: undefined,
        knowledge: 'eliminated',
        heldBy: undefined,
        notedAtTurn: game.currentTurn,
      });
    } else {
      addEntry({
        gameId: game.id,
        cardId: undefined,
        knowledge: 'known',
        heldBy: target.factionId,
        notedAtTurn: game.currentTurn,
      });
    }
    setAddTarget(null);
  };

  const addKnown = (target: AddTarget, cardId: string) => {
    if ('eliminated' in target) {
      addEntry({
        gameId: game.id,
        cardId,
        knowledge: 'eliminated',
        heldBy: undefined,
        notedAtTurn: game.currentTurn,
      });
    } else {
      addEntry({
        gameId: game.id,
        cardId,
        knowledge: 'known',
        heldBy: target.factionId,
        notedAtTurn: game.currentTurn,
      });
    }
    setAddTarget(null);
  };

  const eliminate = (entry: CardTrackerEntry) => {
    updateEntry(entry.id, { knowledge: 'eliminated', heldBy: undefined });
  };

  const restore = (entry: CardTrackerEntry, factionId: FactionId) => {
    updateEntry(entry.id, { knowledge: 'known', heldBy: factionId });
  };

  const revealCard = (cardId: string) => {
    if (!revealEntry) return;
    updateEntry(revealEntry.id, { cardId });
    setRevealEntry(null);
  };

  const pickLeaderForTraitor = (leaderFactionId: FactionId, leaderName: string) => {
    if (!traitorPickTarget) return;
    assignTraitorLeader(traitorPickTarget.id, leaderFactionId, leaderName);
    setTraitorPickTarget(null);
  };

  const addTraitorWithLeader = (
    factionId: FactionId,
    leaderFactionId: FactionId,
    leaderName: string,
  ) => {
    const created = addTraitorSlot(game.id, factionId);
    if (created) assignTraitorLeader(created.id, leaderFactionId, leaderName);
    setAddingTraitorFor(null);
  };

  const addTraitorUnknown = (factionId: FactionId) => {
    addTraitorSlot(game.id, factionId);
    setAddingTraitorFor(null);
  };

  const applyBid = ({
    cardId,
    winner,
    price,
  }: {
    cardId: string;
    winner: FactionId;
    price: number;
  }) => {
    addEntry({
      gameId: game.id,
      cardId,
      knowledge: 'known',
      heldBy: winner,
      notedAtTurn: game.currentTurn,
    });
    const winnerSpice =
      factionStateByGame[game.id]?.[winner]?.estimatedSpice ?? FACTIONS[winner].startingSpice;
    updateFaction(game.id, winner, {
      estimatedSpice: Math.max(0, winnerSpice - price),
    });
    const emperorInPlay = game.factionsInPlay.includes('emperor');
    if (winner !== 'emperor' && emperorInPlay) {
      const empSpice =
        factionStateByGame[game.id]?.emperor?.estimatedSpice ?? FACTIONS.emperor.startingSpice;
      updateFaction(game.id, 'emperor', {
        estimatedSpice: empSpice + price,
      });
    }
    setBiddingOpen(false);
  };

  return (
    <div className="px-4 lg:px-6 py-6">
      {/* Barre de filtre des factions */}
      <div className="mb-4 rounded border border-atreides-gold/15 bg-atreides-deep/40">
        {/* Header repliable mobile */}
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="sm:hidden w-full flex items-center justify-between gap-2 p-2 text-xs font-display uppercase tracking-wider text-atreides-silver"
          aria-expanded={filtersOpen}
        >
          <span className="flex items-center gap-1.5">
            <Filter size={12} className="text-atreides-gold" /> {t('tracker.filterMobile')}
            {(selectedFactions.size > 0 || hiddenSections.size > 0) && (
              <span className="ml-1 text-[10px] text-atreides-gold font-mono normal-case tracking-normal">
                {selectedFactions.size > 0 && t('tracker.factionsActive', { count: selectedFactions.size })}
                {selectedFactions.size > 0 && hiddenSections.size > 0 && ' · '}
                {hiddenSections.size > 0 && t('tracker.sectionsHidden', { count: hiddenSections.size })}
              </span>
            )}
          </span>
          <ChevronDown
            size={14}
            className={cn('transition-transform', filtersOpen && 'rotate-180')}
          />
        </button>
        <div
          className={cn(
            'flex items-center flex-wrap gap-2 p-2 sm:flex',
            !filtersOpen && 'hidden',
            filtersOpen && 'border-t border-atreides-gold/15 sm:border-t-0',
          )}
        >
        <span className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted flex items-center gap-1.5 mr-1">
          <Filter size={11} /> {t('tracker.filter')}
        </span>
        {game.factionsInPlay.map((id) => {
          const isActive = selectedFactions.has(id);
          const isDimmed = selectedFactions.size > 0 && !isActive;
          return (
            <button
              key={id}
              onClick={() => {
                setSelectedFactions((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
              title={t(`faction.${id}.short`)}
              aria-pressed={isActive}
              className={cn(
                'shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all',
                isActive
                  ? 'border-atreides-gold shadow-goldGlow scale-110'
                  : 'border-atreides-gold/15 hover:border-atreides-gold/50',
                isDimmed && 'opacity-40 grayscale',
              )}
            >
              <FactionIcon faction={id} size={28} />
            </button>
          );
        })}
        {selectedFactions.size > 0 && (
          <button
            onClick={() => setSelectedFactions(new Set())}
            className="sm:ml-auto text-[11px] font-display uppercase tracking-wider text-atreides-silverMuted hover:text-atreides-gold transition-colors flex items-center gap-1"
          >
            <X size={11} /> {t('tracker.showAll')}
          </button>
        )}
        <div
          className={cn(
            'flex items-center gap-1.5',
            selectedFactions.size > 0 ? 'sm:ml-2' : 'sm:ml-auto',
          )}
        >
          <span className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted flex items-center gap-1.5">
            <Eye size={11} /> {t('tracker.tracked')}
          </span>
          {SECTION_ORDER.map((s) => {
            const Icon = SECTION_ICON[s];
            const visible = isVisible(s);
            return (
              <button
                key={s}
                onClick={() => toggleSection(s)}
                title={t(SECTION_LABEL_KEY[s])}
                aria-pressed={visible}
                className={cn(
                  'shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all',
                  visible
                    ? 'border-atreides-gold shadow-goldGlow text-atreides-gold'
                    : 'border-atreides-gold/15 text-atreides-silverMuted/60 opacity-40',
                )}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Zones par faction */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {(selectedFactions.size === 0
          ? game.factionsInPlay
          : game.factionsInPlay.filter((id) => selectedFactions.has(id))
        ).map((id) => {
          const meta = FACTIONS[id];
          const factionEntries = cardsByFaction.get(id) ?? [];
          const factionTraitors = traitorsByFaction.get(id) ?? [];
          const factionState = factionStateByGame[game.id]?.[id];
          const spice = factionState?.estimatedSpice ?? meta.startingSpice;

          const adjustSpice = (delta: number) => {
            updateFaction(game.id, id, {
              estimatedSpice: Math.max(0, spice + delta),
            });
          };
          const setSpice = (value: number) => {
            updateFaction(game.id, id, {
              estimatedSpice: Math.max(0, Number.isFinite(value) ? value : 0),
            });
          };

          return (
            <UICard
              key={id}
              className="overflow-visible"
              title={
                <span className="flex items-center gap-2">
                  <FactionIcon faction={id} size={20} />
                  <span style={{ color: factionTextColor(id) }}>{t(`faction.${id}.short`)}</span>
                </span>
              }
              variant={id === game.playerFaction ? 'highlight' : 'default'}
            >
              {isVisible('spice') && (
                <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                  {/* Spice meter — pill with glowing value */}
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-gradient-to-r from-atreides-gold/15 via-atreides-gold/5 to-transparent border border-atreides-gold/25">
                    <Coins
                      size={16}
                      className="text-atreides-gold drop-shadow-[0_0_4px_rgba(212,164,55,0.55)]"
                    />
                    <div className="flex flex-col leading-none">
                      <span className="font-display text-xl text-atreides-gold tabular-nums drop-shadow-[0_0_6px_rgba(212,164,55,0.4)]">
                        {spice}
                      </span>
                      <span className="text-[8px] font-mono text-atreides-silverMuted uppercase tracking-[0.2em] mt-0.5">
                        {t('tracker.spice')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Segmented +/- control */}
                    <div className="flex items-stretch rounded-md overflow-hidden border border-atreides-gold/25 bg-atreides-deep/60 font-mono shadow-inner">
                      <SpiceBtn onClick={() => adjustSpice(-5)}>−5</SpiceBtn>
                      <span className="w-px bg-atreides-gold/20" />
                      <SpiceBtn onClick={() => adjustSpice(-1)}>−1</SpiceBtn>
                      <span className="w-px bg-atreides-gold/20" />
                      <SpiceBtn onClick={() => adjustSpice(1)}>+1</SpiceBtn>
                      <span className="w-px bg-atreides-gold/20" />
                      <SpiceBtn onClick={() => adjustSpice(5)} accent>+5</SpiceBtn>
                    </div>
                    <button
                      onClick={() => setSpice(meta.startingSpice)}
                      title={t('tracker.resetSpice', { value: meta.startingSpice })}
                      aria-label={t('tracker.resetSpice', { value: meta.startingSpice })}
                      className="p-1.5 rounded-md border border-atreides-gold/20 text-atreides-silverMuted hover:text-atreides-gold hover:border-atreides-gold/50 hover:bg-atreides-deep/60 transition-colors"
                    >
                      <RotateCw size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Leaders — vivants/tombés */}
              {isVisible('leaders') && factionState && factionState.leaders.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted">
                      {t('tracker.leaders')}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-mono',
                        factionState.leaders.filter((l) => l.alive).length <=
                          factionState.leaders.length / 2
                          ? 'text-severity-danger'
                          : 'text-atreides-gold/70',
                      )}
                    >
                      {factionState.leaders.filter((l) => l.alive).length}/
                      {factionState.leaders.length}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {factionState.leaders.map((l) => (
                      <LeaderAvatar
                        key={l.id}
                        name={l.name}
                        value={l.value}
                        portrait={l.portrait}
                        alive={l.alive}
                        onToggle={() =>
                          l.alive
                            ? killLeader(game.id, id, l.id)
                            : reviveLeader(game.id, id, l.id)
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {isVisible('cards') && (
              <>
              {/* Cartes en main */}
              <SectionHeader
                label={t('tracker.cards')}
                count={`${factionEntries.length}`}
              />
              {factionEntries.length > 0 && (
                <ul className="space-y-1.5 mb-2">
                  {factionEntries.map((e, idx) => (
                    <CardEntryRow
                      key={e.id}
                      entry={e}
                      index={idx}
                      onReveal={() => setRevealEntry(e)}
                      onEliminate={() => eliminate(e)}
                      onDelete={() => removeEntry(e.id)}
                    />
                  ))}
                </ul>
              )}
              <button
                onClick={() => setAddTarget({ factionId: id })}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-atreides-silverMuted hover:text-atreides-gold transition-colors font-display uppercase tracking-wider"
              >
                <Plus size={12} /> {t('tracker.addCard')}
              </button>
              </>
              )}

              {/* Traîtres */}
              {isVisible('traitors') && (
              <div className="mt-5">
                <SectionHeader
                  label={t('tracker.traitors')}
                  count={`${factionTraitors.length}/${MAX_TRAITORS_PER_FACTION}`}
                />
                {factionTraitors.length > 0 && (
                  <ul className="space-y-1 mb-2">
                    {factionTraitors.map((tr) => (
                      <TraitorRow
                        key={tr.id}
                        traitor={tr}
                        onAssign={() => setTraitorPickTarget(tr)}
                        onClearLeader={() => clearTraitorLeader(tr.id)}
                        onToggleActive={() => toggleTraitorActive(tr.id)}
                        onRemove={() => removeTraitorSlot(tr.id)}
                      />
                    ))}
                  </ul>
                )}
                <button
                  disabled={factionTraitors.length >= MAX_TRAITORS_PER_FACTION}
                  onClick={() => setAddingTraitorFor(id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-atreides-silverMuted hover:text-atreides-gold transition-colors font-display uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-atreides-silverMuted"
                >
                  <Plus size={12} /> {t('tracker.addTraitor')}
                </button>
              </div>
              )}
            </UICard>
          );
        })}
      </div>

      {/* Zone éliminées */}
      <UICard
        className="mt-4 overflow-visible"
        title={
          <span className="flex items-center gap-2">
            <Skull size={14} /> {t('tracker.cardsEliminated')}
          </span>
        }
        subtitle={t('tracker.cardsEliminatedSubtitle', { count: eliminated.length })}
      >
        {eliminated.length === 0 ? (
          <EmptyState
            title={t('tracker.emptyDiscard.title')}
            description={t('tracker.emptyDiscard.desc')}
          />
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {eliminated.map((e, idx) => (
              <CardEntryRow
                key={e.id}
                entry={e}
                index={idx}
                isEliminated
                onReveal={() => setRevealEntry(e)}
                onRestore={(factionId) => restore(e, factionId)}
                onDelete={() => removeEntry(e.id)}
                availableFactions={game.factionsInPlay}
              />
            ))}
          </ul>
        )}
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Plus size={12} />}
          onClick={() => setAddTarget({ eliminated: true })}
          className="w-full mt-3 border border-dashed border-atreides-gold/30 hover:border-atreides-gold/60"
        >
          {t('tracker.addEliminatedCard')}
        </Button>
      </UICard>

      {/* Modal d'ajout de carte */}
      <AddCardModal
        target={addTarget}
        onClose={() => setAddTarget(null)}
        onAddUnknown={() => addTarget && addUnknown(addTarget)}
        onAddKnown={(cardId) => addTarget && addKnown(addTarget, cardId)}
        groupedCards={groupedCards}
        usedCardIds={usedCardIds}
      />

      {/* Modal pour révéler une carte inconnue */}
      <Modal
        open={!!revealEntry}
        onClose={() => setRevealEntry(null)}
        title={t('tracker.revealModal.title')}
        size="lg"
      >
        <p className="text-xs text-atreides-silverMuted mb-3">
          {t('tracker.revealModal.desc')}
        </p>
        <CardCatalog
          groupedCards={groupedCards}
          onSelect={revealCard}
          usedCardIds={usedCardIds}
          allowedCurrent={revealEntry?.cardId}
        />
      </Modal>

      {/* Modal pour assigner un leader à un traître existant */}
      <Modal
        open={!!traitorPickTarget}
        onClose={() => setTraitorPickTarget(null)}
        title={t('tracker.traitorModal.assignTitle')}
        size="lg"
      >
        <p className="text-xs text-atreides-silverMuted mb-3">
          {t('tracker.traitorModal.assignDesc')}
        </p>
        <LeaderCatalog
          onSelect={pickLeaderForTraitor}
          usedLeaderKeys={usedLeaderKeys}
          allowedCurrentKey={
            traitorPickTarget?.leaderFactionId && traitorPickTarget?.leaderName
              ? `${traitorPickTarget.leaderFactionId}|${traitorPickTarget.leaderName}`
              : undefined
          }
        />
      </Modal>

      {/* Modal d'ajout d'un nouveau traître (avec option Inconnu) */}
      <Modal
        open={!!addingTraitorFor}
        onClose={() => setAddingTraitorFor(null)}
        title={
          addingTraitorFor
            ? t('tracker.traitorModal.addTitle', { faction: t(`faction.${addingTraitorFor}.short`) })
            : ''
        }
        size="lg"
      >
        <p className="text-xs text-atreides-silverMuted mb-3">
          {t('tracker.traitorModal.addDesc')}
        </p>
        {addingTraitorFor && (
          <LeaderCatalog
            onSelect={(lf, name) => addTraitorWithLeader(addingTraitorFor, lf, name)}
            onSelectUnknown={() => addTraitorUnknown(addingTraitorFor)}
            usedLeaderKeys={usedLeaderKeys}
          />
        )}
      </Modal>

      {/* Bidding modal */}
      <BiddingModal
        open={biddingOpen}
        onClose={() => setBiddingOpen(false)}
        onConfirm={applyBid}
        groupedCards={groupedCards}
        usedCardIds={usedCardIds}
        factionsInPlay={game.factionsInPlay}
      />

      {/* Floating bidding button */}
      <button
        onClick={() => setBiddingOpen(true)}
        title={t('tracker.bidding.fabTitle')}
        aria-label={t('tracker.bidding.fabTitle')}
        className="fixed bottom-24 right-4 z-20 w-14 h-14 rounded-full bg-gradient-to-br from-atreides-gold via-atreides-goldSoft to-atreides-gold/80 text-atreides-deep shadow-goldGlow ring-2 ring-atreides-gold/60 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Gavel size={22} />
      </button>
    </div>
  );
};

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────

const SpiceBtn = ({
  children,
  onClick,
  accent = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'px-2.5 py-1.5 text-[11px] font-medium tabular-nums transition-colors min-w-[32px]',
      accent
        ? 'text-atreides-gold hover:bg-atreides-gold/15'
        : 'text-atreides-silverMuted hover:text-atreides-silver hover:bg-atreides-navy/40',
    )}
  >
    {children}
  </button>
);

const SectionHeader = ({ label, count }: { label: string; count: string }) => (
  <div className="flex items-baseline justify-between mb-2">
    <span className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted">
      {label}
    </span>
    <span className="text-[10px] font-mono text-atreides-gold/70">{count}</span>
  </div>
);

interface LeaderAvatarProps {
  name: string;
  value: number;
  portrait?: string;
  alive: boolean;
  onToggle: () => void;
}

const LeaderAvatar = ({ name, value, portrait, alive, onToggle }: LeaderAvatarProps) => {
  const t = useT();
  return (
  <button
    onClick={onToggle}
    title={alive ? t('tracker.leaderAvatar.titleAlive', { name, value }) : t('tracker.leaderAvatar.titleDead', { name, value })}
    aria-label={t('tracker.leaderAvatar.aria', { name, state: alive ? t('tracker.leaderAvatar.alive') : t('tracker.leaderAvatar.dead') })}
    className={cn(
      'relative shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 transition-all',
      alive
        ? 'border-atreides-gold/40 hover:border-atreides-gold/80 hover:scale-105'
        : 'border-severity-danger/50 hover:border-severity-danger',
    )}
  >
    {portrait ? (
      <img
        src={portrait}
        alt={name}
        className={cn(
          'w-full h-full object-cover',
          !alive && 'grayscale brightness-50',
        )}
        loading="lazy"
        draggable={false}
      />
    ) : (
      <div
        className={cn(
          'w-full h-full bg-atreides-night flex items-center justify-center text-[10px] font-mono text-atreides-silverMuted',
          !alive && 'grayscale brightness-50',
        )}
      >
        {name.slice(0, 2)}
      </div>
    )}
    {!alive && (
      <span className="absolute inset-0 flex items-center justify-center bg-atreides-deep/40">
        <Skull size={18} className="text-severity-danger drop-shadow-[0_0_4px_rgba(127,29,29,0.8)]" />
      </span>
    )}
  </button>
  );
};

interface CardEntryRowProps {
  entry: CardTrackerEntry;
  index: number;
  isEliminated?: boolean;
  onReveal: () => void;
  onEliminate?: () => void;
  onRestore?: (factionId: FactionId) => void;
  onDelete: () => void;
  availableFactions?: FactionId[];
}

const CardEntryRow = ({
  entry,
  index,
  isEliminated = false,
  onReveal,
  onEliminate,
  onRestore,
  onDelete,
  availableFactions,
}: CardEntryRowProps) => {
  const t = useT();
  const card = entry.cardId ? getCard(entry.cardId) : undefined;
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreCoords, setRestoreCoords] = useState<
    { top: number; right: number; placement: 'top' | 'bottom' } | null
  >(null);
  const restoreBtnRef = useRef<HTMLButtonElement>(null);
  const [descOpen, setDescOpen] = useState(false);

  const theme = card ? CARD_THEME[card.type] : UNKNOWN_THEME;

  const toggleRestoreMenu = () => {
    if (!restoreOpen && restoreBtnRef.current) {
      const rect = restoreBtnRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 80; // reserve room for MobileNav
      const placement: 'top' | 'bottom' = spaceBelow < 180 ? 'top' : 'bottom';
      setRestoreCoords({
        top: placement === 'bottom' ? rect.bottom + 4 : rect.top - 4,
        right: window.innerWidth - rect.right,
        placement,
      });
    }
    setRestoreOpen((o) => !o);
  };

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        'rounded-md border flex items-center gap-2.5 px-2.5 py-2',
        theme.bg,
        theme.border,
        isEliminated && 'opacity-60 saturate-50',
        descOpen && 'relative z-50',
      )}
    >
      <CardMedallion card={card} size="sm" />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-serif uppercase tracking-wider truncate',
            card ? 'text-atreides-silver' : 'text-atreides-silverMuted italic normal-case',
          )}
        >
          {card ? t(cardNameKey(card)) : t('tracker.cardRow.unknown')}
        </p>
        <p className="text-[9px] font-display uppercase tracking-widest text-atreides-silver/60 mt-0.5">
          {card ? t(cardSubtitleKey(card)) : t('cards.unknown.subtitle')}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {card && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setDescOpen((o) => !o)}
              title={t(cardDescKey(card))}
              aria-label={t(cardDescKey(card))}
              aria-expanded={descOpen}
              className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
            >
              <Info size={13} />
            </button>
            {descOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setDescOpen(false)}
                  aria-hidden
                />
                <div
                  role="tooltip"
                  className="absolute right-0 top-full mt-1 z-20 w-56 p-2.5 rounded-md border border-atreides-gold/40 bg-atreides-night shadow-panel"
                >
                  <p className="text-[10px] uppercase font-display tracking-widest text-atreides-gold mb-1">
                    {t(cardNameKey(card))}
                  </p>
                  <p className="text-[11px] text-atreides-silver leading-snug">
                    {t(cardDescKey(card))}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
        {!entry.cardId && (
          <button
            onClick={onReveal}
            title={t('tracker.cardRow.reveal')}
            className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
          >
            <Eye size={13} />
          </button>
        )}
        {!isEliminated && onEliminate && (
          <button
            onClick={onEliminate}
            title={t('tracker.cardRow.eliminate')}
            className="p-1 text-atreides-silverMuted hover:text-severity-danger"
          >
            <Skull size={13} />
          </button>
        )}
        {isEliminated && onRestore && availableFactions && (
          <>
            <button
              ref={restoreBtnRef}
              onClick={toggleRestoreMenu}
              title={t('tracker.cardRow.restore')}
              className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
            >
              <RotateCcw size={13} />
            </button>
            {restoreOpen && restoreCoords && createPortal(
              <>
                <div
                  className="fixed inset-0 z-[60]"
                  onClick={() => setRestoreOpen(false)}
                  aria-hidden
                />
                <div
                  className="fixed z-[70] bg-atreides-night border border-atreides-gold/40 rounded shadow-panel min-w-[140px]"
                  style={{
                    right: restoreCoords.right,
                    ...(restoreCoords.placement === 'bottom'
                      ? { top: restoreCoords.top }
                      : { bottom: window.innerHeight - restoreCoords.top }),
                  }}
                >
                  <div className="max-h-32 overflow-y-auto">
                    {availableFactions.map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          onRestore(f);
                          setRestoreOpen(false);
                        }}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-xs text-atreides-silver hover:bg-atreides-navy/40 text-left"
                      >
                        <FactionIcon faction={f} size={14} />
                        {t(`faction.${f}.short`)}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setRestoreOpen(false)}
                    className="flex items-center gap-2 w-full px-2 py-1 text-[10px] text-atreides-silverMuted hover:text-atreides-gold border-t border-atreides-gold/10"
                  >
                    <X size={10} /> {t('common.cancel')}
                  </button>
                </div>
              </>,
              document.body,
            )}
          </>
        )}
        <button
          onClick={onDelete}
          title={t('tracker.cardRow.delete')}
          className="p-1 text-atreides-silverMuted hover:text-severity-danger"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.li>
  );
};

// ──────────────────────────────────────────────────────────

interface TraitorRowProps {
  traitor: Traitor;
  onAssign: () => void;
  onClearLeader: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
}

const TraitorRow = ({
  traitor,
  onAssign,
  onClearLeader,
  onToggleActive,
  onRemove,
}: TraitorRowProps) => {
  const t = useT();
  const isHarkonnen = traitor.factionId === 'harkonnen';
  const hasLeader = !!traitor.leaderName;
  const leaderSeed =
    hasLeader && traitor.leaderFactionId && traitor.leaderName
      ? findLeaderSeed(traitor.leaderFactionId, traitor.leaderName)
      : undefined;
  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'p-2 rounded border bg-atreides-deep/40 flex items-center gap-2',
        traitor.active
          ? 'border-atreides-gold/50 shadow-goldGlow/0'
          : 'border-atreides-gold/15 opacity-70',
      )}
    >
      <button
        onClick={onToggleActive}
        disabled={isHarkonnen}
        title={
          isHarkonnen
            ? t('tracker.traitorRow.harkAllActive')
            : traitor.active
              ? t('tracker.traitorRow.deactivate')
              : t('tracker.traitorRow.activate')
        }
        className={cn(
          'shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
          traitor.active
            ? 'bg-atreides-gold border-atreides-gold'
            : 'bg-transparent border-atreides-silverMuted/60 hover:border-atreides-gold',
          isHarkonnen && 'cursor-default',
        )}
      >
        {traitor.active && <span className="w-1.5 h-1.5 rounded-full bg-atreides-deep" />}
      </button>

      {leaderSeed?.portrait ? (
        <img
          src={leaderSeed.portrait}
          alt={leaderSeed.name}
          className="shrink-0 w-9 h-9 rounded-full object-cover border border-atreides-gold/40"
        />
      ) : hasLeader && traitor.leaderFactionId ? (
        <FactionIcon faction={traitor.leaderFactionId} size={20} />
      ) : (
        <div className="shrink-0 w-9 h-9 rounded-full border border-dashed border-atreides-gold/30 flex items-center justify-center">
          <HelpCircle size={14} className="text-atreides-silverMuted" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs truncate',
            hasLeader ? 'text-atreides-silver font-serif' : 'text-atreides-silverMuted italic',
          )}
        >
          {traitor.leaderName ?? t('tracker.traitorRow.unknownLeader')}
        </p>
        {traitor.leaderFactionId && (
          <p
            className="text-[10px] font-mono flex items-center gap-1"
            style={{ color: factionTextColor(traitor.leaderFactionId) }}
          >
            {t(`faction.${traitor.leaderFactionId}.short`)}
            {leaderSeed && (
              <span className="text-atreides-gold/80">· {t('tracker.traitorRow.valShort', { value: leaderSeed.value })}</span>
            )}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {hasLeader ? (
          <button
            onClick={onClearLeader}
            title={t('tracker.traitorRow.clear')}
            className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
          >
            <X size={12} />
          </button>
        ) : (
          <button
            onClick={onAssign}
            title={t('tracker.traitorRow.assign')}
            className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
          >
            <Eye size={12} />
          </button>
        )}
        <button
          onClick={onRemove}
          title={t('tracker.traitorRow.delete')}
          className="p-1 text-atreides-silverMuted hover:text-severity-danger"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.li>
  );
};

// ──────────────────────────────────────────────────────────

interface LeaderCatalogProps {
  onSelect: (factionId: FactionId, name: string) => void;
  onSelectUnknown?: () => void;
  usedLeaderKeys?: Set<string>;
  allowedCurrentKey?: string;
}

const LeaderCatalog = ({
  onSelect,
  onSelectUnknown,
  usedLeaderKeys,
  allowedCurrentKey,
}: LeaderCatalogProps) => {
  const t = useT();
  const [search, setSearch] = useState('');
  const includeValue10 = useSettingsStore((s) => s.useValue10Leaders);
  const isUsed = (id: FactionId, name: string) => {
    if (!usedLeaderKeys) return false;
    const key = `${id}|${name}`;
    if (key === allowedCurrentKey) return false;
    return usedLeaderKeys.has(key);
  };
  return (
    <>
      <Input
        placeholder={t('tracker.traitorModal.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {onSelectUnknown && (
          <button
            onClick={onSelectUnknown}
            className="w-full text-left p-3 rounded border border-dashed border-atreides-gold/40 bg-atreides-deep/40 hover:border-atreides-gold/70 hover:bg-atreides-navy/40 transition-colors flex items-center gap-3"
          >
            <div className="shrink-0 w-12 h-12 rounded-full border-2 border-dashed border-atreides-gold/40 flex items-center justify-center">
              <HelpCircle size={20} className="text-atreides-gold/80" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display uppercase tracking-wider text-atreides-gold">
                {t('tracker.traitorModal.unknownLeader')}
              </p>
              <p className="text-[11px] text-atreides-silverMuted mt-0.5">
                {t('tracker.traitorModal.unknownLeaderDesc')}
              </p>
            </div>
          </button>
        )}
        {FACTION_IDS.map((id) => {
          const leaders = LEADER_SEED[id].filter(
            (l) =>
              (includeValue10 || l.value < 10) &&
              !isUsed(id, l.name) &&
              (search.trim() ? l.name.toLowerCase().includes(search.toLowerCase()) : true),
          );
          if (leaders.length === 0) return null;
          return (
            <section key={id}>
              <div className="flex items-center gap-2 mb-2">
                <FactionIcon faction={id} size={16} />
                <span
                  className="text-sm font-serif"
                  style={{ color: factionTextColor(id) }}
                >
                  {t(`faction.${id}.short`)}
                </span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {leaders.map((l) => (
                  <li key={`${id}-${l.name}`}>
                    <button
                      onClick={() => onSelect(id, l.name)}
                      className="w-full text-left p-2 rounded border border-atreides-gold/15 bg-atreides-deep/40 hover:border-atreides-gold/50 hover:bg-atreides-navy/40 transition-colors flex items-center gap-3"
                    >
                      {l.portrait ? (
                        <img
                          src={l.portrait}
                          alt={l.name}
                          className="shrink-0 w-12 h-12 rounded-full object-cover border border-atreides-gold/40"
                          loading="lazy"
                        />
                      ) : (
                        <div className="shrink-0 w-12 h-12 rounded-full bg-atreides-night border border-atreides-gold/20" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-serif text-atreides-silver truncate">
                          {l.name}
                        </p>
                        <p className="text-[10px] font-mono text-atreides-silverMuted">
                          {t('tracker.traitorModal.leaderValue', { value: l.value })}
                        </p>
                      </div>
                      <Badge tone="gold">{l.value}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
};

// ──────────────────────────────────────────────────────────

interface AddCardModalProps {
  target: AddTarget | null;
  onClose: () => void;
  onAddUnknown: () => void;
  onAddKnown: (cardId: string) => void;
  groupedCards: Record<CardType, TreacheryCard[]>;
  usedCardIds?: Set<string>;
}

const AddCardModal = ({
  target,
  onClose,
  onAddUnknown,
  onAddKnown,
  groupedCards,
  usedCardIds,
}: AddCardModalProps) => {
  const t = useT();
  const [search, setSearch] = useState('');

  if (!target) return null;
  const title =
    'eliminated' in target
      ? t('tracker.addCardModal.eliminatedTitle')
      : t('tracker.addCardModal.factionTitle', { faction: t(`faction.${target.factionId}.short`) });

  return (
    <Modal open={!!target} onClose={onClose} title={title} size="lg">
      <Input
        placeholder={t('tracker.addCardModal.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />
      <CardCatalog
        groupedCards={groupedCards}
        search={search}
        onSelect={(cardId) => onAddKnown(cardId)}
        onSelectUnknown={onAddUnknown}
        usedCardIds={usedCardIds}
      />
    </Modal>
  );
};

// ──────────────────────────────────────────────────────────

interface CardCatalogProps {
  groupedCards: Record<CardType, TreacheryCard[]>;
  search?: string;
  onSelect: (cardId: string) => void;
  onSelectUnknown?: () => void;
  usedCardIds?: Set<string>;
  allowedCurrent?: string;
}

interface SlotGroup {
  sample: TreacheryCard;
  availableIds: string[];
}

const CardCatalog = ({
  groupedCards,
  search = '',
  onSelect,
  onSelectUnknown,
  usedCardIds,
  allowedCurrent,
}: CardCatalogProps) => {
  const t = useT();

  const groupBySlug = (cards: TreacheryCard[]): SlotGroup[] => {
    const map = new Map<string, SlotGroup>();
    for (const c of cards) {
      const isUsed = usedCardIds && c.id !== allowedCurrent && usedCardIds.has(c.id);
      if (isUsed) continue;
      if (search.trim() && !t(cardNameKey(c)).toLowerCase().includes(search.toLowerCase())) continue;
      const existing = map.get(c.slug);
      if (existing) existing.availableIds.push(c.id);
      else map.set(c.slug, { sample: c, availableIds: [c.id] });
    }
    return [...map.values()];
  };

  const showUnknown = !!onSelectUnknown && !search.trim();
  const typeGroups = (Object.keys(groupedCards) as CardType[]).map((type) => ({
    type,
    groups: groupBySlug(groupedCards[type]),
  }));
  const noResults = !showUnknown && typeGroups.every((tg) => tg.groups.length === 0);

  return (
    <div className="h-[60vh] overflow-y-auto pr-1 space-y-4">
      {showUnknown && (
        <button
          onClick={onSelectUnknown}
          className="w-full text-left p-3 rounded border border-dashed border-atreides-gold/40 bg-atreides-deep/40 hover:border-atreides-gold/70 hover:bg-atreides-navy/40 transition-colors flex items-center gap-3"
        >
          <div className="shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-atreides-gold/40 flex items-center justify-center">
            <HelpCircle size={18} className="text-atreides-gold/80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-display uppercase tracking-wider text-atreides-gold">
              {t('tracker.addCardModal.unknownTitle')}
            </p>
            <p className="text-[11px] text-atreides-silverMuted mt-0.5">
              {t('tracker.addCardModal.unknownDesc')}
            </p>
          </div>
        </button>
      )}
      {noResults && (
        <div className="flex flex-col items-center justify-center h-full text-center py-10">
          <HelpCircle size={32} className="text-atreides-silverMuted/60 mb-2" />
          <p className="text-sm text-atreides-silverMuted">
            {t('tracker.addCardModal.noResults')}
          </p>
        </div>
      )}
      {typeGroups.map(({ type, groups }) => {
        if (groups.length === 0) return null;
        return (
          <section key={type}>
            <div className="flex items-center gap-2 mb-2">
              <Badge tone={TYPE_TONE[type]}>{t(TYPE_KEY[type])}</Badge>
              <span className="text-[10px] font-mono text-atreides-silverMuted">
                {groups.length}
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {groups.map((g) => {
                const theme = CARD_THEME[g.sample.type];
                return (
                <li key={g.sample.slug}>
                  <button
                    onClick={() => onSelect(g.availableIds[0])}
                    className={cn(
                      'group w-full text-left px-3 py-2.5 rounded-md border flex items-center gap-3 transition-all hover:brightness-110 hover:ring-2 hover:ring-amber-500/40',
                      theme.bg,
                      theme.border,
                    )}
                  >
                    <CardMedallion card={g.sample} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-serif uppercase tracking-wider text-atreides-silver truncate">
                        {t(cardNameKey(g.sample))}
                      </p>
                      <p className="text-[10px] font-display uppercase tracking-widest text-atreides-silver/70 mt-0.5">
                        {t(cardSubtitleKey(g.sample))}
                      </p>
                      <p className="text-[10px] text-atreides-silver/60 mt-1 line-clamp-2">
                        {t(cardDescKey(g.sample))}
                      </p>
                    </div>
                    {g.availableIds.length > 1 && (
                      <span className="shrink-0 self-start text-[11px] font-mono font-display text-amber-100 border border-amber-500/60 rounded px-1.5 py-0.5">
                        ×{g.availableIds.length}
                      </span>
                    )}
                  </button>
                </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

// ──────────────────────────────────────────────────────────

interface BiddingModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (input: { cardId: string; winner: FactionId; price: number }) => void;
  groupedCards: Record<CardType, TreacheryCard[]>;
  usedCardIds: Set<string>;
  factionsInPlay: FactionId[];
}

const BiddingModal = ({
  open,
  onClose,
  onConfirm,
  groupedCards,
  usedCardIds,
  factionsInPlay,
}: BiddingModalProps) => {
  const t = useT();
  const [step, setStep] = useState<'card' | 'details'>('card');
  const [pickedCardId, setPickedCardId] = useState<string | null>(null);
  const [winner, setWinner] = useState<FactionId | null>(null);
  const [price, setPrice] = useState<string>('0');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setStep('card');
      setPickedCardId(null);
      setWinner(null);
      setPrice('0');
      setSearch('');
    }
  }, [open]);

  const pickedCard = pickedCardId ? getCard(pickedCardId) : undefined;
  const priceNum = parseInt(price, 10);
  const canConfirm =
    pickedCardId !== null && winner !== null && Number.isFinite(priceNum) && priceNum >= 0;

  const handleSelectCard = (cardId: string) => {
    setPickedCardId(cardId);
    setStep('details');
  };

  const handleConfirm = () => {
    if (!canConfirm || pickedCardId === null || winner === null) return;
    onConfirm({ cardId: pickedCardId, winner, price: priceNum });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Gavel size={16} className="text-atreides-gold" />
          {t('tracker.bidding.title')}
        </span>
      }
      size="lg"
    >
      {step === 'card' && (
        <>
          <p className="text-xs text-atreides-silverMuted mb-3">
            {t('tracker.bidding.stepCard')}
          </p>
          <Input
            placeholder={t('tracker.addCardModal.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3"
          />
          <CardCatalog
            groupedCards={groupedCards}
            search={search}
            onSelect={handleSelectCard}
            usedCardIds={usedCardIds}
          />
        </>
      )}

      {step === 'details' && pickedCard && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3 rounded-md border border-atreides-gold/25 bg-atreides-deep/40">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-display tracking-widest text-atreides-silverMuted">
                {t('tracker.bidding.pickedCard', { name: t(cardNameKey(pickedCard)) })}
              </p>
              <p className="text-sm font-serif uppercase tracking-wider text-atreides-silver truncate mt-0.5">
                {t(cardNameKey(pickedCard))}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('card')}>
              {t('tracker.bidding.changeCard')}
            </Button>
          </div>

          <div>
            <p className="text-[10px] uppercase font-display tracking-widest text-atreides-silverMuted mb-2">
              {t('tracker.bidding.winner')}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {factionsInPlay.map((id) => {
                const isActive = winner === id;
                return (
                  <button
                    key={id}
                    onClick={() => setWinner(id)}
                    title={t(`faction.${id}.short`)}
                    aria-pressed={isActive}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-md border transition-all',
                      isActive
                        ? 'border-atreides-gold bg-atreides-gold/10 shadow-goldGlow'
                        : 'border-atreides-gold/15 hover:border-atreides-gold/50',
                    )}
                  >
                    <FactionIcon faction={id} size={28} />
                    <span
                      className="text-[10px] font-display uppercase tracking-wider truncate w-full text-center"
                      style={{ color: factionTextColor(id) }}
                    >
                      {t(`faction.${id}.short`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-display tracking-widest text-atreides-silverMuted mb-1.5">
              {t('tracker.bidding.price')}
            </label>
            <div className="flex items-stretch">
              <button
                type="button"
                onClick={() =>
                  setPrice((p) => String(Math.max(0, (parseInt(p, 10) || 0) - 1)))
                }
                aria-label="−1"
                className="w-10 rounded-l-md border border-r-0 border-atreides-gold/30 text-atreides-silver hover:text-atreides-gold hover:border-atreides-gold/60 hover:bg-atreides-deep/60 transition-colors font-mono text-sm"
              >
                −1
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 text-center font-mono text-base bg-atreides-deep/60 border-y border-atreides-gold/30 text-atreides-silver focus:outline-none focus:border-atreides-gold/60 focus:bg-atreides-deep tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
              />
              <button
                type="button"
                onClick={() =>
                  setPrice((p) => String(Math.max(0, (parseInt(p, 10) || 0) + 1)))
                }
                aria-label="+1"
                className="w-10 rounded-r-md border border-l-0 border-atreides-gold/30 text-atreides-silver hover:text-atreides-gold hover:border-atreides-gold/60 hover:bg-atreides-deep/60 transition-colors font-mono text-sm"
              >
                +1
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-atreides-gold/10">
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('tracker.bidding.cancel')}
            </Button>
            <Button
              variant="gold"
              size="sm"
              disabled={!canConfirm}
              onClick={handleConfirm}
              leftIcon={<Gavel size={14} />}
            >
              {t('tracker.bidding.confirm')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
