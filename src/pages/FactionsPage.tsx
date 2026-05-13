import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Heart, HeartCrack, Link2, Unlink } from 'lucide-react';
import { useCurrentGame, useFactionStore } from '@/store';
import { FACTIONS, factionTextColor } from '@/data/factions';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThreatMeter } from '@/components/ui/ThreatMeter';
import { useAnalysis } from '@/hooks/useAnalysis';
import type { FactionId } from '@/types/faction';
import { cn } from '@/lib/cn';
import { FactionIcon } from '@/components/icons/FactionIcon';

export const FactionsPage = () => {
  const game = useCurrentGame();
  const byGame = useFactionStore((s) => s.byGame);
  const update = useFactionStore((s) => s.updateFaction);
  const setAlliance = useFactionStore((s) => s.setAlliance);
  const killLeader = useFactionStore((s) => s.killLeader);
  const reviveLeader = useFactionStore((s) => s.reviveLeader);
  const analysis = useAnalysis();
  const [selected, setSelected] = useState<FactionId | null>(null);

  if (!game) return <Navigate to="/games" replace />;
  const map = byGame[game.id];
  if (!map) return null;

  const playerFaction = game.playerFaction;
  const active = selected ?? game.factionsInPlay[0];
  const f = map[active];

  return (
    <div className="px-4 lg:px-6 py-6">
      <h1 className="font-display text-xl uppercase tracking-widest text-atreides-gold mb-4">
        Factions
      </h1>

      <div className="grid lg:grid-cols-[260px_1fr] gap-4">
        <Card title="Maisons en présence">
          <ul className="space-y-1">
            {game.factionsInPlay.map((id) => {
              const meta = FACTIONS[id];
              const isPlayer = id === playerFaction;
              const isActive = id === active;
              return (
                <li key={id}>
                  <button
                    onClick={() => setSelected(id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors',
                      isActive
                        ? 'bg-atreides-blue/30 border border-atreides-gold/40'
                        : 'hover:bg-atreides-navy/40 border border-transparent',
                    )}
                  >
                    <FactionIcon faction={id} size={22} />
                    <span className="flex-1 text-sm font-serif" style={{ color: factionTextColor(id) }}>
                      {meta.shortName}
                    </span>
                    {isPlayer && <Badge tone="gold">Vous</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {f && (
          <div className="space-y-4">
            <Card
              title={FACTIONS[f.id].name}
              subtitle={FACTIONS[f.id].motto}
              action={
                analysis ? (
                  <div className="flex items-center gap-2">
                    <ThreatMeter level={analysis.threats[f.id]?.level ?? 0} />
                    <span className="text-xs font-mono text-atreides-gold">
                      {analysis.threats[f.id]?.score ?? 0}/100
                    </span>
                  </div>
                ) : null
              }
            >
              <p className="text-xs text-atreides-silver italic mb-3">
                {FACTIONS[f.id].specialAbility}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  label="Troupes estimées"
                  value={f.estimatedTroops}
                  onChange={(e) =>
                    update(game.id, f.id, { estimatedTroops: parseInt(e.target.value, 10) || 0 })
                  }
                />
                <Input
                  type="number"
                  label="Épice estimée"
                  value={f.estimatedSpice}
                  onChange={(e) =>
                    update(game.id, f.id, { estimatedSpice: parseInt(e.target.value, 10) || 0 })
                  }
                />
              </div>

              <Textarea
                className="mt-3"
                label="Notes privées"
                value={f.privateNotes}
                onChange={(e) => update(game.id, f.id, { privateNotes: e.target.value })}
                rows={3}
              />
            </Card>

            <Card title="Leaders">
              <ul className="grid grid-cols-2 gap-2">
                {f.leaders.map((l) => (
                  <li
                    key={l.id}
                    className={cn(
                      'flex items-center justify-between gap-2 p-2 rounded border',
                      l.alive
                        ? 'border-atreides-gold/15 bg-atreides-deep/40'
                        : 'border-severity-danger/30 bg-severity-danger/5 opacity-70',
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {l.portrait ? (
                        <img
                          src={l.portrait}
                          alt={l.name}
                          className={cn(
                            'shrink-0 w-10 h-10 rounded-full object-cover border border-atreides-gold/40',
                            !l.alive && 'grayscale',
                          )}
                          loading="lazy"
                        />
                      ) : (
                        <div className="shrink-0 w-10 h-10 rounded-full bg-atreides-night border border-atreides-gold/20" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-atreides-silver truncate font-serif">{l.name}</p>
                        <p className="text-[10px] font-mono text-atreides-silverMuted">
                          Valeur {l.value} · {l.alive ? 'vivant' : 'tombé'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        l.alive ? killLeader(game.id, f.id, l.id) : reviveLeader(game.id, f.id, l.id)
                      }
                      className="text-atreides-silverMuted hover:text-atreides-gold"
                      title={l.alive ? 'Marquer tombé' : 'Ressusciter'}
                    >
                      {l.alive ? <HeartCrack size={14} /> : <Heart size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>

            {f.id !== playerFaction && (
              <Card title="Alliances">
                <ul className="space-y-1.5">
                  {game.factionsInPlay
                    .filter((other) => other !== f.id)
                    .map((other) => {
                      const allied = f.alliances.includes(other);
                      return (
                        <li
                          key={other}
                          className="flex items-center justify-between p-2 rounded bg-atreides-deep/40 border border-atreides-gold/10"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: FACTIONS[other].color }}
                            />
                            <span className="text-sm font-serif">{FACTIONS[other].shortName}</span>
                          </div>
                          <Button
                            size="sm"
                            variant={allied ? 'gold' : 'ghost'}
                            leftIcon={allied ? <Link2 size={12} /> : <Unlink size={12} />}
                            onClick={() => setAlliance(game.id, f.id, other, !allied)}
                          >
                            {allied ? 'Alliés' : 'Lier'}
                          </Button>
                        </li>
                      );
                    })}
                </ul>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
