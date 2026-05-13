import { AlertTriangle, Info, Skull, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useAlerts } from '@/hooks/useAlerts';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';

const icons = {
  info: Info,
  warning: AlertTriangle,
  danger: ShieldAlert,
  critical: Skull,
};

const tones = {
  info: 'text-severity-info bg-severity-info/10 border-severity-info/30',
  warning: 'text-severity-warning bg-severity-warning/10 border-severity-warning/30',
  danger: 'text-severity-danger bg-severity-danger/10 border-severity-danger/30',
  critical: 'text-severity-critical bg-severity-critical/15 border-severity-critical/40',
};

export const AlertsPanel = () => {
  const alerts = useAlerts();

  return (
    <Card title="Alertes stratégiques" subtitle={`${alerts.length} signal(aux)`}>
      {alerts.length === 0 ? (
        <EmptyState title="Front calme" description="Aucune menace majeure détectée pour l'instant." />
      ) : (
        <ul className="space-y-2">
          {alerts.slice(0, 5).map((a, idx) => {
            const Icon = icons[a.severity];
            return (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={cn('p-3 rounded-md border flex items-start gap-3', tones[a.severity])}
              >
                <Icon size={16} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-display uppercase tracking-wider">{a.title}</p>
                  <p className="text-[11px] mt-1 text-atreides-silver leading-relaxed">
                    {a.message}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};
