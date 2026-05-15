import { useEffect, useMemo, useState } from 'react';
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
  Castle,
  MapPin,
  Filter,
  LayoutGrid,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  useCardsStore,
  useCurrentGame,
  useTraitorsStore,
  useFactionStore,
  useSettingsStore,
  MAX_TRAITORS_PER_FACTION,
} from '@/store';
import { TREACHERY_CARDS, getCard } from '@/data/cards';
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

type AddTarget = { factionId: FactionId } | { eliminated: true };
type ViewMode = 'full' | 'cards';

const TOTAL_TROOPS = 20;

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
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [filtersOpen, setFiltersOpen] = useState(false);

  if (!game) return <Navigate to="/games" replace />;

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
            {(selectedFactions.size > 0 || viewMode === 'cards') && (
              <span className="ml-1 text-[10px] text-atreides-gold font-mono normal-case tracking-normal">
                {selectedFactions.size > 0 && t('tracker.factionsActive', { count: selectedFactions.size })}
                {selectedFactions.size > 0 && viewMode === 'cards' && ' · '}
                {viewMode === 'cards' && t('tracker.modeCards')}
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
          <div className="flex items-center gap-0.5 rounded border border-atreides-gold/15 p-0.5">
            <ViewModeBtn
              active={viewMode === 'full'}
              onClick={() => setViewMode('full')}
              icon={<LayoutGrid size={11} />}
              label={t('tracker.viewAll')}
            />
            <ViewModeBtn
              active={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
              icon={<Layers size={11} />}
              label={t('tracker.viewCards')}
            />
          </div>
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
          const zones = factionState?.zonesControlled ?? 0;
          const dead = factionState?.troopsDead ?? 0;
          const onMap = factionState?.troopsOnMap ?? 0;
          const reserve = TOTAL_TROOPS - dead - onMap;
          const reserveOverflow = reserve < 0;

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
          const setZones = (value: number) => {
            updateFaction(game.id, id, {
              zonesControlled: Math.max(0, Math.min(4, value)),
            });
          };

          return (
            <UICard
              key={id}
              title={
                <span className="flex items-center gap-2">
                  <FactionIcon faction={id} size={20} />
                  <span style={{ color: factionTextColor(id) }}>{t(`faction.${id}.short`)}</span>
                </span>
              }
              variant={id === game.playerFaction ? 'highlight' : 'default'}
            >
              {viewMode === 'full' && (
              <>
              {/* Épice — ligne compacte */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-baseline gap-1.5">
                  <Coins size={13} className="text-atreides-gold/80 self-center" />
                  <span className="font-display text-lg text-atreides-gold tabular-nums leading-none">
                    {spice}
                  </span>
                  <span className="text-[10px] font-mono text-atreides-silverMuted uppercase">
                    {t('tracker.spice')}
                  </span>
                </span>
                <div className="flex items-center gap-0.5 font-mono">
                  <SpiceBtn onClick={() => adjustSpice(-5)}>−5</SpiceBtn>
                  <SpiceBtn onClick={() => adjustSpice(-1)}>−1</SpiceBtn>
                  <SpiceBtn onClick={() => adjustSpice(1)}>+1</SpiceBtn>
                  <SpiceBtn onClick={() => adjustSpice(5)} accent>+5</SpiceBtn>
                  <button
                    onClick={() => setSpice(meta.startingSpice)}
                    title={t('tracker.resetSpice', { value: meta.startingSpice })}
                    className="ml-1 p-1 text-atreides-silverMuted hover:text-atreides-gold transition-colors"
                  >
                    <RotateCw size={11} />
                  </button>
                </div>
              </div>

              {/* Zones contrôlées — sélecteur 0..4 */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-baseline gap-1.5">
                  <Castle size={13} className="text-atreides-gold/80 self-center" />
                  <span className="font-display text-lg text-atreides-gold tabular-nums leading-none">
                    {zones}
                  </span>
                  <span className="text-[10px] font-mono text-atreides-silverMuted uppercase">
                    {t('tracker.zones')}
                  </span>
                </span>
                <div className="flex items-center gap-0.5 font-mono">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setZones(n)}
                      className={cn(
                        'w-7 h-7 rounded text-[11px] transition-colors border',
                        zones === n
                          ? 'bg-atreides-gold/20 border-atreides-gold text-atreides-gold'
                          : 'bg-transparent border-atreides-gold/15 text-atreides-silverMuted hover:border-atreides-gold/40 hover:text-atreides-silver',
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Troupes — section avec stepper inputs */}
              <div className="mb-4 pt-1">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[10px] uppercase font-display tracking-wider text-atreides-silverMuted">
                    {t('tracker.troops')}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-mono',
                      reserveOverflow ? 'text-severity-danger' : 'text-atreides-gold/70',
                    )}
                  >
                    {t('tracker.troopsReserve', { count: reserve, total: TOTAL_TROOPS })}
                  </span>
                </div>
                <div className="space-y-2">
                  <TroopStepper
                    icon={<Skull size={12} />}
                    label={t('tracker.troopsDead')}
                    value={dead}
                    onChange={(n) => {
                      const newDead = Math.max(0, n);
                      updateFaction(game.id, id, {
                        troopsDead: newDead,
                        estimatedTroops: Math.max(0, TOTAL_TROOPS - newDead),
                      });
                    }}
                  />
                  <TroopStepper
                    icon={<MapPin size={12} />}
                    label={t('tracker.troopsOnMap')}
                    value={onMap}
                    onChange={(n) =>
                      updateFaction(game.id, id, {
                        troopsOnMap: Math.max(0, n),
                      })
                    }
                  />
                </div>
              </div>

              {/* Leaders — vivants/tombés */}
              {factionState && factionState.leaders.length > 0 && (
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

              </>
              )}

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

              {/* Traîtres */}
              {viewMode === 'full' && (
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
        className="mt-4"
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
      'px-2 py-1 rounded text-xs transition-colors min-w-[32px] sm:px-1.5 sm:py-0.5 sm:text-[11px] sm:min-w-[26px]',
      accent
        ? 'text-atreides-gold hover:bg-atreides-gold/15'
        : 'text-atreides-silverMuted hover:text-atreides-silver hover:bg-atreides-navy/40',
    )}
  >
    {children}
  </button>
);

const ViewModeBtn = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display uppercase tracking-wider transition-colors',
      active
        ? 'bg-atreides-gold/15 text-atreides-gold'
        : 'text-atreides-silverMuted hover:text-atreides-silver',
    )}
  >
    {icon}
    {label}
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

interface TroopStepperProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (n: number) => void;
}

const TroopStepper = ({ icon, label, value, onChange }: TroopStepperProps) => {
  const [draft, setDraft] = useState(String(value));

  // Synchronise le draft local quand la valeur source change (ex : ajustement externe)
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isNaN(n)) {
      setDraft(String(value));
      return;
    }
    if (n !== value) onChange(Math.max(0, n));
  };

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs text-atreides-silver">
        <span className="text-atreides-gold/80">{icon}</span>
        {label}
      </span>
      <div className="flex items-center">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          aria-label="Diminuer"
          className="w-7 h-7 rounded-l-md border border-r-0 border-atreides-gold/30 text-atreides-silverMuted hover:text-atreides-gold hover:border-atreides-gold/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono"
        >
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          className="w-14 h-7 text-center font-mono text-sm bg-atreides-deep/60 border-y border-atreides-gold/30 text-atreides-silver focus:outline-none focus:border-atreides-gold/60 focus:bg-atreides-deep tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
        />
        <button
          onClick={() => onChange(value + 1)}
          aria-label="Augmenter"
          className="w-7 h-7 rounded-r-md border border-l-0 border-atreides-gold/30 text-atreides-silverMuted hover:text-atreides-gold hover:border-atreides-gold/60 transition-colors font-mono"
        >
          +
        </button>
      </div>
    </div>
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

  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        'p-2 rounded border bg-atreides-deep/40 flex items-center gap-2',
        isEliminated ? 'border-severity-danger/30' : 'border-atreides-gold/15',
      )}
    >
      {card ? (
        <Badge tone={TYPE_TONE[card.type]}>{card.type}</Badge>
      ) : (
        <HelpCircle size={14} className="text-atreides-silverMuted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm truncate',
            card ? 'text-atreides-silver font-serif' : 'text-atreides-silverMuted italic',
          )}
        >
          {card ? card.name : t('tracker.cardRow.unknown')}
        </p>
        <p className="text-[10px] font-mono text-atreides-silverMuted">
          {t('tracker.cardRow.atTurn', { turn: entry.notedAtTurn })}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
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
          <div className="relative">
            <button
              onClick={() => setRestoreOpen((o) => !o)}
              title={t('tracker.cardRow.restore')}
              className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
            >
              <RotateCcw size={13} />
            </button>
            {restoreOpen && (
              <div className="absolute right-0 top-full mt-1 z-10 bg-atreides-night border border-atreides-gold/40 rounded shadow-panel min-w-[140px]">
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
                <button
                  onClick={() => setRestoreOpen(false)}
                  className="flex items-center gap-2 w-full px-2 py-1 text-[10px] text-atreides-silverMuted hover:text-atreides-gold border-t border-atreides-gold/10"
                >
                  <X size={10} /> {t('common.cancel')}
                </button>
              </div>
            )}
          </div>
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
  const [mode, setMode] = useState<'unknown' | 'known'>('unknown');
  const [search, setSearch] = useState('');

  if (!target) return null;
  const title =
    'eliminated' in target
      ? t('tracker.addCardModal.eliminatedTitle')
      : t('tracker.addCardModal.factionTitle', { faction: t(`faction.${target.factionId}.short`) });

  return (
    <Modal open={!!target} onClose={onClose} title={title} size="lg">
      <div className="flex gap-1 border-b border-atreides-gold/15 mb-4">
        <button
          onClick={() => setMode('unknown')}
          className={cn(
            'px-4 py-2 text-xs font-display uppercase tracking-wider transition-colors border-b-2 -mb-px',
            mode === 'unknown'
              ? 'text-atreides-gold border-atreides-gold'
              : 'text-atreides-silverMuted border-transparent hover:text-atreides-silver',
          )}
        >
          <HelpCircle size={12} className="inline mr-1.5" /> {t('tracker.addCardModal.unknownTab')}
        </button>
        <button
          onClick={() => setMode('known')}
          className={cn(
            'px-4 py-2 text-xs font-display uppercase tracking-wider transition-colors border-b-2 -mb-px',
            mode === 'known'
              ? 'text-atreides-gold border-atreides-gold'
              : 'text-atreides-silverMuted border-transparent hover:text-atreides-silver',
          )}
        >
          {t('tracker.addCardModal.chooseTab')}
        </button>
      </div>

      {mode === 'unknown' ? (
        <div className="text-center py-6">
          <HelpCircle size={42} className="mx-auto text-atreides-gold/70 mb-3" />
          <p className="text-sm text-atreides-silver mb-1">{t('tracker.addCardModal.unknownTitle')}</p>
          <p className="text-xs text-atreides-silverMuted max-w-sm mx-auto mb-5">
            {t('tracker.addCardModal.unknownDesc')}
          </p>
          <Button variant="gold" onClick={onAddUnknown}>
            {t('tracker.addCardModal.confirmAdd')}
          </Button>
        </div>
      ) : (
        <>
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
            usedCardIds={usedCardIds}
          />
        </>
      )}
    </Modal>
  );
};

// ──────────────────────────────────────────────────────────

interface CardCatalogProps {
  groupedCards: Record<CardType, TreacheryCard[]>;
  search?: string;
  onSelect: (cardId: string) => void;
  usedCardIds?: Set<string>;
  allowedCurrent?: string;
}

const CardCatalog = ({
  groupedCards,
  search = '',
  onSelect,
  usedCardIds,
  allowedCurrent,
}: CardCatalogProps) => {
  const t = useT();
  const filter = (cards: TreacheryCard[]) =>
    cards.filter((c) => {
      if (usedCardIds && c.id !== allowedCurrent && usedCardIds.has(c.id)) return false;
      if (search.trim() && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {(Object.keys(groupedCards) as CardType[]).map((type) => {
        const cards = filter(groupedCards[type]);
        if (cards.length === 0) return null;
        return (
          <section key={type}>
            <div className="flex items-center gap-2 mb-2">
              <Badge tone={TYPE_TONE[type]}>{t(TYPE_KEY[type])}</Badge>
              <span className="text-[10px] font-mono text-atreides-silverMuted">
                {cards.length}
              </span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {cards.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onSelect(c.id)}
                    className="w-full text-left p-2 rounded border border-atreides-gold/15 bg-atreides-deep/40 hover:border-atreides-gold/50 hover:bg-atreides-navy/40 transition-colors"
                  >
                    <p className="text-sm font-serif text-atreides-silver">{c.name}</p>
                    <p className="text-[10px] text-atreides-silverMuted mt-0.5 line-clamp-2">
                      {c.description}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
