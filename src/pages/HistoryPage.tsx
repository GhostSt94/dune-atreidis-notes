import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FactionPill } from '@/components/ui/FactionPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/date';
import { FACTIONS, factionTextColor } from '@/data/factions';

export const HistoryPage = () => {
  const games = useGameStore((s) => s.games);
  const finished = Object.values(games)
    .filter((g) => g.status === 'finished')
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="px-4 lg:px-6 py-6 max-w-4xl mx-auto">
      <Link
        to="/games"
        className="inline-flex items-center gap-1.5 text-xs uppercase font-display tracking-wider text-atreides-silverMuted hover:text-atreides-gold transition-colors mb-3"
      >
        <ArrowLeft size={14} /> Retour aux parties
      </Link>
      <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold mb-4">
        Historique
      </h1>

      {finished.length === 0 ? (
        <Card>
          <EmptyState title="Aucune partie terminée" />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {finished.map((g) => (
            <Card key={g.id} title={g.name} subtitle={`Terminée ${formatDate(g.updatedAt)}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">Tour final {g.currentTurn}</Badge>
                {g.winner && (
                  <>
                    <span className="text-xs text-atreides-silverMuted">Vainqueur</span>
                    <FactionPill id={g.winner} />
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {g.factionsInPlay.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] font-mono"
                    style={{ color: factionTextColor(f) }}
                  >
                    {FACTIONS[f].shortName}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
