import { cn } from '@/lib/cn';

interface ThreatMeterProps {
  level: 0 | 1 | 2 | 3 | 4;
  showLabel?: boolean;
}

const labels = ['Inerte', 'Faible', 'Modérée', 'Élevée', 'Critique'];
const tones = [
  'bg-atreides-silverMuted/30',
  'bg-emerald-500/70',
  'bg-atreides-gold/80',
  'bg-orange-500/80',
  'bg-severity-danger',
];

export const ThreatMeter = ({ level, showLabel = true }: ThreatMeterProps) => (
  <div className="flex items-center gap-2">
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            'h-2 w-3 rounded-sm transition-colors',
            i <= level ? tones[level] : 'bg-atreides-deep border border-atreides-silver/15',
          )}
        />
      ))}
    </div>
    {showLabel && (
      <span className="text-[11px] font-mono uppercase tracking-wider text-atreides-silverMuted">
        {labels[level]}
      </span>
    )}
  </div>
);
