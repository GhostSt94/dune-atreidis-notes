import { ChevronRight, Undo2 } from 'lucide-react';
import { useCurrentGame, useGameStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { getPhaseMeta } from '@/data/phases';

export const Topbar = () => {
  const game = useCurrentGame();
  const nextTurn = useGameStore((s) => s.nextTurn);
  const previousTurn = useGameStore((s) => s.previousTurn);

  if (!game) return null;
  const phase = getPhaseMeta(game.currentPhase);
  const canGoBack = game.currentTurn > 1;

  return (
    <header className="sticky top-0 z-20 h-14 bg-atreides-deep/90 backdrop-blur-md border-b border-atreides-gold/15 flex items-center px-4 lg:px-6 gap-4">
      <div className="flex items-center gap-2 text-xs text-atreides-silverMuted font-mono">
        <span className="text-atreides-silver">Tour</span>
        <span className="text-atreides-gold text-sm font-display">{game.currentTurn}</span>
        <ChevronRight size={14} className="text-atreides-silverMuted" />
        <span className="text-atreides-silver uppercase font-display tracking-wider">
          {phase.label}
        </span>
      </div>

      <div className="hidden md:block text-[11px] text-atreides-silverMuted italic">
        {phase.description}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <button
          onClick={previousTurn}
          disabled={!canGoBack}
          title="Tour précédent"
          aria-label="Tour précédent"
          className="p-1.5 rounded-md border border-atreides-gold/30 text-atreides-silverMuted hover:text-atreides-gold hover:border-atreides-gold/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-atreides-silverMuted disabled:hover:border-atreides-gold/30"
        >
          <Undo2 size={14} />
        </button>
        <Button size="sm" variant="gold" onClick={nextTurn}>
          Tour suivant
        </Button>
      </div>
    </header>
  );
};
