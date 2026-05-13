import { ChevronRight, AlertTriangle, Bell, Save } from 'lucide-react';
import { useCurrentGame, useGameStore, useJournalStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getPhaseMeta } from '@/data/phases';
import { useAlerts } from '@/hooks/useAlerts';

export const Topbar = () => {
  const game = useCurrentGame();
  const advancePhase = useGameStore((s) => s.advancePhase);
  const alerts = useAlerts();
  const events = useJournalStore((s) => (game ? s.forGame(game.id).length : 0));

  if (!game) return null;
  const phase = getPhaseMeta(game.currentPhase);
  const liveAlerts = alerts.filter((a) => !a.dismissed && a.severity !== 'info');

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

      <div className="flex items-center gap-2">
        <Badge tone="gold">
          <Save size={10} /> {events} events
        </Badge>
        {liveAlerts.length > 0 && (
          <Badge tone="red">
            <AlertTriangle size={10} /> {liveAlerts.length} alerte
            {liveAlerts.length > 1 ? 's' : ''}
          </Badge>
        )}
        <button
          className="relative text-atreides-silverMuted hover:text-atreides-gold transition-colors p-1.5"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {liveAlerts.length > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-severity-danger animate-pulseGold" />
          )}
        </button>
        <Button size="sm" variant="gold" onClick={advancePhase}>
          Phase suivante
        </Button>
      </div>
    </header>
  );
};
