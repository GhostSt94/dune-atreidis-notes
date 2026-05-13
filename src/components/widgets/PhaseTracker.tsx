import { PHASES } from '@/data/phases';
import { useCurrentGame, useGameStore } from '@/store';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export const PhaseTracker = () => {
  const game = useCurrentGame();
  const setPhase = useGameStore((s) => s.setPhase);
  if (!game) return null;

  return (
    <Card title="Cycle de tour" subtitle={`Tour ${game.currentTurn}`}>
      <div className="grid grid-cols-3 lg:grid-cols-9 gap-1.5">
        {PHASES.map((p) => {
          const active = p.id === game.currentPhase;
          return (
            <button
              key={p.id}
              onClick={() => setPhase(p.id)}
              className={cn(
                'p-2 rounded text-[10px] uppercase font-display tracking-wider border transition-all',
                active
                  ? 'bg-atreides-gold/15 text-atreides-gold border-atreides-gold/60 shadow-goldGlow'
                  : 'bg-atreides-deep/40 text-atreides-silverMuted border-atreides-gold/10 hover:text-atreides-silver',
              )}
              title={p.description}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </Card>
  );
};
