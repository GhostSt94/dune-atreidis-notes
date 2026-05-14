import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import {
  useCardsStore,
  useCurrentGame,
  useTraitorsStore,
  useFactionStore,
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

const TYPE_LABEL: Record<CardType, string> = {
  weapon: 'Armes',
  defense: 'Défenses',
  special: 'Spéciales',
  worthless: 'Sans valeur',
};

const TYPE_TONE: Record<CardType, 'red' | 'blue' | 'gold' | 'neutral'> = {
  weapon: 'red',
  defense: 'blue',
  special: 'gold',
  worthless: 'neutral',
};

type AddTarget = { factionId: FactionId } | { eliminated: true };

export const CardsPage = () => {
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

  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [revealEntry, setRevealEntry] = useState<CardTrackerEntry | null>(null);
  const [traitorPickTarget, setTraitorPickTarget] = useState<Traitor | null>(null);
  const [addingTraitorFor, setAddingTraitorFor] = useState<FactionId | null>(null);

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
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold">
            Tracker de cartes
          </h1>
          <p className="text-xs text-atreides-silverMuted mt-1">
            Cartes en main + traîtres connus, zone par faction. Atreides voit chaque enchère ;
            Harkonnen connaît ses 4 traîtres.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-atreides-silverMuted">
          <span>
            <span className="text-atreides-gold">{inHand.length}</span> cartes en main
          </span>
          <span>
            <span className="text-severity-danger">{eliminated.length}</span> éliminées
          </span>
        </div>
      </div>

      {/* Zones par faction */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {game.factionsInPlay.map((id) => {
          const meta = FACTIONS[id];
          const factionEntries = cardsByFaction.get(id) ?? [];
          const factionTraitors = traitorsByFaction.get(id) ?? [];
          const factionState = factionStateByGame[game.id]?.[id];
          const spice = factionState?.estimatedSpice ?? meta.startingSpice;
          const zones = factionState?.zonesControlled ?? 0;

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
                  <span style={{ color: factionTextColor(id) }}>{meta.shortName}</span>
                </span>
              }
              variant={id === game.playerFaction ? 'highlight' : 'default'}
            >
              {/* Épice — ligne compacte */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-baseline gap-1.5">
                  <Coins size={13} className="text-atreides-gold/80 self-center" />
                  <span className="font-display text-lg text-atreides-gold tabular-nums leading-none">
                    {spice}
                  </span>
                  <span className="text-[10px] font-mono text-atreides-silverMuted uppercase">
                    épice
                  </span>
                </span>
                <div className="flex items-center gap-0.5 font-mono">
                  <SpiceBtn onClick={() => adjustSpice(-5)}>−5</SpiceBtn>
                  <SpiceBtn onClick={() => adjustSpice(-1)}>−1</SpiceBtn>
                  <SpiceBtn onClick={() => adjustSpice(1)}>+1</SpiceBtn>
                  <SpiceBtn onClick={() => adjustSpice(5)} accent>+5</SpiceBtn>
                  <button
                    onClick={() => setSpice(meta.startingSpice)}
                    title={`Reset à ${meta.startingSpice}`}
                    className="ml-1 p-1 text-atreides-silverMuted hover:text-atreides-gold transition-colors"
                  >
                    <RotateCw size={11} />
                  </button>
                </div>
              </div>

              {/* Zones contrôlées — sélecteur 0..4 */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="flex items-baseline gap-1.5">
                  <Castle size={13} className="text-atreides-gold/80 self-center" />
                  <span className="font-display text-lg text-atreides-gold tabular-nums leading-none">
                    {zones}
                  </span>
                  <span className="text-[10px] font-mono text-atreides-silverMuted uppercase">
                    zones
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

              {/* Cartes en main */}
              <SectionHeader
                label="Cartes"
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
                <Plus size={12} /> Ajouter une carte
              </button>

              {/* Traîtres */}
              <div className="mt-5">
                <SectionHeader
                  label="Traîtres"
                  count={`${factionTraitors.length}/${MAX_TRAITORS_PER_FACTION}`}
                />
                {factionTraitors.length > 0 && (
                  <ul className="space-y-1 mb-2">
                    {factionTraitors.map((t) => (
                      <TraitorRow
                        key={t.id}
                        traitor={t}
                        onAssign={() => setTraitorPickTarget(t)}
                        onClearLeader={() => clearTraitorLeader(t.id)}
                        onToggleActive={() => toggleTraitorActive(t.id)}
                        onRemove={() => removeTraitorSlot(t.id)}
                      />
                    ))}
                  </ul>
                )}
                <button
                  disabled={factionTraitors.length >= MAX_TRAITORS_PER_FACTION}
                  onClick={() => setAddingTraitorFor(id)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-atreides-silverMuted hover:text-atreides-gold transition-colors font-display uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-atreides-silverMuted"
                >
                  <Plus size={12} /> Ajouter un traître
                </button>
              </div>
            </UICard>
          );
        })}
      </div>

      {/* Zone éliminées */}
      <UICard
        className="mt-4"
        title={
          <span className="flex items-center gap-2">
            <Skull size={14} /> Cartes éliminées
          </span>
        }
        subtitle={`${eliminated.length} carte(s) hors-jeu`}
      >
        {eliminated.length === 0 ? (
          <EmptyState
            title="Pile vide"
            description="Les cartes utilisées et défaussées apparaîtront ici."
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
          Ajouter une carte éliminée
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
        title="Révéler la carte"
        size="lg"
      >
        <p className="text-xs text-atreides-silverMuted mb-3">
          Choisissez la carte exacte à associer à cette entrée.
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
        title="Désigner un leader comme traître"
        size="lg"
      >
        <p className="text-xs text-atreides-silverMuted mb-3">
          Choisissez le leader que cette faction trahirait en combat.
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
            ? `Ajouter un traître pour ${FACTIONS[addingTraitorFor].shortName}`
            : ''
        }
        size="lg"
      >
        <p className="text-xs text-atreides-silverMuted mb-3">
          Choisissez un leader connu ou ajoutez un slot inconnu à révéler plus tard.
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
      'px-1.5 py-0.5 rounded text-[11px] transition-colors min-w-[26px]',
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
          {card ? card.name : 'Carte inconnue'}
        </p>
        <p className="text-[10px] font-mono text-atreides-silverMuted">
          Tour {entry.notedAtTurn}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!entry.cardId && (
          <button
            onClick={onReveal}
            title="Révéler"
            className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
          >
            <Eye size={13} />
          </button>
        )}
        {!isEliminated && onEliminate && (
          <button
            onClick={onEliminate}
            title="Éliminer"
            className="p-1 text-atreides-silverMuted hover:text-severity-danger"
          >
            <Skull size={13} />
          </button>
        )}
        {isEliminated && onRestore && availableFactions && (
          <div className="relative">
            <button
              onClick={() => setRestoreOpen((o) => !o)}
              title="Restaurer en main"
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
                    {FACTIONS[f].shortName}
                  </button>
                ))}
                <button
                  onClick={() => setRestoreOpen(false)}
                  className="flex items-center gap-2 w-full px-2 py-1 text-[10px] text-atreides-silverMuted hover:text-atreides-gold border-t border-atreides-gold/10"
                >
                  <X size={10} /> Annuler
                </button>
              </div>
            )}
          </div>
        )}
        <button
          onClick={onDelete}
          title="Supprimer"
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
            ? 'Tous les traîtres Harkonnen sont actifs'
            : traitor.active
              ? 'Désactiver'
              : 'Activer'
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
          {traitor.leaderName ?? 'Leader inconnu'}
        </p>
        {traitor.leaderFactionId && (
          <p
            className="text-[10px] font-mono flex items-center gap-1"
            style={{ color: factionTextColor(traitor.leaderFactionId) }}
          >
            {FACTIONS[traitor.leaderFactionId].shortName}
            {leaderSeed && (
              <span className="text-atreides-gold/80">· val {leaderSeed.value}</span>
            )}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {hasLeader ? (
          <button
            onClick={onClearLeader}
            title="Effacer le leader"
            className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
          >
            <X size={12} />
          </button>
        ) : (
          <button
            onClick={onAssign}
            title="Désigner un leader"
            className="p-1 text-atreides-silverMuted hover:text-atreides-gold"
          >
            <Eye size={12} />
          </button>
        )}
        <button
          onClick={onRemove}
          title="Supprimer le slot"
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
  const [search, setSearch] = useState('');
  const isUsed = (id: FactionId, name: string) => {
    if (!usedLeaderKeys) return false;
    const key = `${id}|${name}`;
    if (key === allowedCurrentKey) return false;
    return usedLeaderKeys.has(key);
  };
  return (
    <>
      <Input
        placeholder="Rechercher un leader..."
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
                Leader inconnu
              </p>
              <p className="text-[11px] text-atreides-silverMuted mt-0.5">
                Ajoute un slot vide à révéler plus tard.
              </p>
            </div>
          </button>
        )}
        {FACTION_IDS.map((id) => {
          const leaders = LEADER_SEED[id].filter(
            (l) =>
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
                  {FACTIONS[id].shortName}
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
                          Valeur {l.value}
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
  const [mode, setMode] = useState<'unknown' | 'known'>('unknown');
  const [search, setSearch] = useState('');

  if (!target) return null;
  const title =
    'eliminated' in target
      ? 'Ajouter une carte éliminée'
      : `Ajouter une carte à ${FACTIONS[target.factionId].shortName}`;

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
          <HelpCircle size={12} className="inline mr-1.5" /> Carte inconnue
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
          Choisir une carte
        </button>
      </div>

      {mode === 'unknown' ? (
        <div className="text-center py-6">
          <HelpCircle size={42} className="mx-auto text-atreides-gold/70 mb-3" />
          <p className="text-sm text-atreides-silver mb-1">Carte inconnue</p>
          <p className="text-xs text-atreides-silverMuted max-w-sm mx-auto mb-5">
            Cette maison détient une carte, mais vous ne savez pas laquelle. Vous pourrez
            la révéler plus tard.
          </p>
          <Button variant="gold" onClick={onAddUnknown}>
            Confirmer l&apos;ajout
          </Button>
        </div>
      ) : (
        <>
          <Input
            placeholder="Rechercher une carte..."
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
              <Badge tone={TYPE_TONE[type]}>{TYPE_LABEL[type]}</Badge>
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
