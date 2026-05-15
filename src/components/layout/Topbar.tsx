import { ChevronRight, Undo2, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCurrentGame, useGameStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { getPhaseMeta } from '@/data/phases';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';

export const Topbar = () => {
  const t = useT();
  const game = useCurrentGame();
  const nextTurn = useGameStore((s) => s.nextTurn);
  const previousTurn = useGameStore((s) => s.previousTurn);
  const navigate = useNavigate();
  const location = useLocation();

  if (!game) return null;
  const phase = getPhaseMeta(game.currentPhase);
  const canGoBack = game.currentTurn > 1;

  return (
    <header className="sticky top-0 z-20 h-14 bg-atreides-deep/90 backdrop-blur-md border-b border-atreides-gold/15 flex items-center px-4 lg:px-6 gap-4">
      <div className="flex items-center gap-1 lg:hidden">
        <TopbarIconBtn
          icon={<Settings size={14} />}
          title={t('topbar.settings')}
          active={location.pathname === '/settings'}
          onClick={() => navigate('/settings')}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-atreides-silverMuted font-mono">
        <span className="text-atreides-silver text-[11px]">{t('topbar.turn')}</span>
        <span className="text-atreides-gold text-xs font-display">{game.currentTurn}</span>
        <ChevronRight size={12} className="text-atreides-silverMuted" />
        <span className="text-atreides-silver uppercase font-display tracking-wider text-[10px]">
          {t(`phase.${phase.id}`)}
        </span>
      </div>

      <div className="hidden md:block text-[11px] text-atreides-silverMuted italic">
        {t(`phase.${phase.id}.desc`)}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5">
        <button
          onClick={previousTurn}
          disabled={!canGoBack}
          title={t('topbar.previousTurn')}
          aria-label={t('topbar.previousTurn')}
          className="p-1.5 rounded-md border border-atreides-gold/30 text-atreides-silverMuted hover:text-atreides-gold hover:border-atreides-gold/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-atreides-silverMuted disabled:hover:border-atreides-gold/30"
        >
          <Undo2 size={14} />
        </button>
        <Button size="sm" variant="gold" onClick={nextTurn} className="whitespace-nowrap">
          {t('topbar.nextTurn')}
        </Button>
      </div>
    </header>
  );
};

const TopbarIconBtn = ({
  icon,
  title,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    title={title}
    aria-label={title}
    className={cn(
      'p-1.5 rounded-md border transition-colors',
      active
        ? 'border-atreides-gold/60 text-atreides-gold bg-atreides-gold/10'
        : 'border-atreides-gold/30 text-atreides-silverMuted hover:text-atreides-gold hover:border-atreides-gold/60',
    )}
  >
    {icon}
  </button>
);
