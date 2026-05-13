import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wind,
  Swords,
  Handshake,
  Skull,
  Brain,
  Sparkles,
  AlertOctagon,
  Layers,
  Eye,
  RotateCw,
} from 'lucide-react';
import { useCurrentGame, useJournalStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FactionPill } from '@/components/ui/FactionPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateTime } from '@/lib/date';
import type { EventType } from '@/types/event';

const iconFor: Record<EventType, typeof Wind> = {
  turn_start: RotateCw,
  phase_change: RotateCw,
  battle: Swords,
  alliance_formed: Handshake,
  alliance_broken: AlertOctagon,
  betrayal: Skull,
  nexus: Sparkles,
  storm_move: Wind,
  spice_blow: Sparkles,
  leader_killed: Skull,
  note_added: Brain,
  card_revealed: Layers,
  prediction_made: Eye,
};

export const JournalPage = () => {
  const game = useCurrentGame();
  const events = useJournalStore((s) => (game ? s.forGame(game.id) : []));
  if (!game) return <Navigate to="/games" replace />;

  return (
    <div className="px-4 lg:px-6 py-6 max-w-3xl mx-auto">
      <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold mb-4">
        Journal de partie
      </h1>

      {events.length === 0 ? (
        <Card>
          <EmptyState title="Journal vide" description="Les événements de la partie apparaîtront ici." />
        </Card>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-atreides-gold/20" />
          <ul className="space-y-3">
            {events.map((e, i) => {
              const Icon = iconFor[e.type] ?? Brain;
              return (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="relative"
                >
                  <div className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full bg-atreides-blue border-2 border-atreides-gold" />
                  <Card>
                    <div className="flex items-start gap-3">
                      <Icon size={16} className="text-atreides-gold shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge tone="neutral">Tour {e.turn}</Badge>
                          <Badge tone="gold">{e.phase}</Badge>
                          {e.factionsInvolved.map((f) => (
                            <FactionPill key={f} id={f} />
                          ))}
                        </div>
                        <p className="text-sm text-atreides-silver font-display tracking-wide">
                          {e.title}
                        </p>
                        {e.description && (
                          <p className="text-xs text-atreides-silver/80 mt-1">{e.description}</p>
                        )}
                        <p className="text-[10px] text-atreides-silverMuted mt-1 font-mono">
                          {formatDateTime(e.timestamp)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
