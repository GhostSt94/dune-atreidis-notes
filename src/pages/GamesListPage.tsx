import { useNavigate } from 'react-router-dom';
import { Plus, Play, Copy, Trash2, Download, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  useGameStore,
  useProfileStore,
  useFactionStore,
  useNotesStore,
  useCardsStore,
  useBattlesStore,
  usePredictionsStore,
  useMapStore,
  useJournalStore,
  cascadeDeleteGame,
} from '@/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FactionPill } from '@/components/ui/FactionPill';
import { formatDateTime, relativeTime } from '@/lib/date';
import { downloadJson, EXPORT_VERSION, type GameExport } from '@/lib/exportImport';

export const GamesListPage = () => {
  const profile = useProfileStore((s) => s.profile);
  const games = useGameStore((s) => s.games);
  const loadGame = useGameStore((s) => s.loadGame);
  const duplicate = useGameStore((s) => s.duplicateGame);
  const navigate = useNavigate();

  const factionsByGame = useFactionStore((s) => s.byGame);
  const notes = useNotesStore((s) => s.notes);
  const cards = useCardsStore((s) => s.entries);
  const battles = useBattlesStore((s) => s.battles);
  const predictions = usePredictionsStore((s) => s.predictions);
  const mapByGame = useMapStore((s) => s.byGame);
  const events = useJournalStore((s) => s.events);

  const handleOpen = (id: string) => {
    loadGame(id);
    navigate('/game');
  };

  const handleExport = (id: string) => {
    const game = games[id];
    const factionsMap = factionsByGame[id] ?? {};
    const data: GameExport = {
      version: EXPORT_VERSION,
      exportedAt: Date.now(),
      game,
      factions: Object.values(factionsMap),
      notes: notes.filter((n) => n.gameId === id),
      cards: cards.filter((c) => c.gameId === id),
      battles: battles.filter((b) => b.gameId === id),
      predictions: predictions.filter((p) => p.gameId === id),
      territoryControls: Object.values(mapByGame[id] ?? {}),
      journal: events.filter((e) => e.gameId === id),
    };
    downloadJson(data, `dune-${game.name.replace(/\s+/g, '-')}.json`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer cette partie définitivement ?')) cascadeDeleteGame(id);
  };

  const list = Object.values(games).sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-atreides-silverMuted font-display">
            Salutations
          </p>
          <h1 className="font-display text-2xl lg:text-3xl text-atreides-gold uppercase tracking-wider mt-1">
            {profile?.housePrefix} {profile?.pseudo}
          </h1>
          <p className="text-sm text-atreides-silverMuted mt-1">
            Sélectionnez ou créez une chronique stratégique.
          </p>
        </div>
        <Button variant="gold" leftIcon={<Plus size={16} />} onClick={() => navigate('/games/new')}>
          Nouvelle partie
        </Button>
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState
            title="Aucune chronique"
            description="Lancez votre première partie pour commencer à suivre vos campagnes Atreides."
            action={
              <Button variant="primary" leftIcon={<Plus size={14} />} onClick={() => navigate('/games/new')}>
                Créer une partie
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((g, idx) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card
                variant={g.status === 'active' ? 'highlight' : 'default'}
                title={g.name}
                subtitle={`${g.playerCount} joueurs · ${relativeTime(g.updatedAt)}`}
              >
                <div className="flex flex-wrap gap-1 mb-3">
                  {g.factionsInPlay.map((f) => (
                    <FactionPill key={f} id={f} />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-atreides-silverMuted font-mono mb-4">
                  <span>Tour {g.currentTurn}</span>
                  <span className="uppercase">{g.currentPhase}</span>
                  {g.status === 'paused' && <Badge tone="neutral"><Pause size={9} /> Pause</Badge>}
                  {g.status === 'finished' && <Badge tone="gold">Terminée</Badge>}
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-atreides-gold/10">
                  <Button size="sm" variant="gold" leftIcon={<Play size={12} />} onClick={() => handleOpen(g.id)}>
                    Ouvrir
                  </Button>
                  <Button size="sm" variant="ghost" leftIcon={<Copy size={12} />} onClick={() => duplicate(g.id)}>
                    Dupliquer
                  </Button>
                  <Button size="sm" variant="ghost" leftIcon={<Download size={12} />} onClick={() => handleExport(g.id)}>
                    Exporter
                  </Button>
                  <Button size="sm" variant="ghost" leftIcon={<Trash2 size={12} />} onClick={() => handleDelete(g.id)}>
                    Suppr.
                  </Button>
                </div>
                <p className="text-[10px] text-atreides-silverMuted mt-3 font-mono">
                  Créée {formatDateTime(g.createdAt)}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
