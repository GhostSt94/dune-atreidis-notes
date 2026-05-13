import { motion } from 'framer-motion';
import { PhaseTracker } from '@/components/widgets/PhaseTracker';
import { FactionsOverview } from '@/components/widgets/FactionsOverview';
import { AlertsPanel } from '@/components/widgets/AlertsPanel';
import { QuickNote } from '@/components/widgets/QuickNote';
import { AlliancesPanel } from '@/components/widgets/AlliancesPanel';
import { AIInsightsPanel } from '@/components/widgets/AIInsightsPanel';
import { useCurrentGame } from '@/store';
import { Navigate } from 'react-router-dom';

export const GameViewPage = () => {
  const game = useCurrentGame();
  if (!game) return <Navigate to="/games" replace />;

  return (
    <div className="px-4 lg:px-6 py-6 space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between flex-wrap gap-2"
      >
        <div>
          <h1 className="font-display text-xl text-atreides-gold uppercase tracking-widest">
            {game.name}
          </h1>
          <p className="text-xs text-atreides-silverMuted font-mono mt-1">
            Tour {game.currentTurn} · Tempête secteur {game.stormSector} ·{' '}
            {game.factionsInPlay.length} factions
          </p>
        </div>
      </motion.div>

      <PhaseTracker />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <FactionsOverview />
          <AIInsightsPanel />
        </div>
        <div className="space-y-4">
          <AlertsPanel />
          <QuickNote />
          <AlliancesPanel />
        </div>
      </div>
    </div>
  );
};
