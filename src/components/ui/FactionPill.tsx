import { FACTIONS } from '@/data/factions';
import type { FactionId } from '@/types/faction';
import { cn } from '@/lib/cn';
import { FactionIcon } from '@/components/icons/FactionIcon';

interface FactionPillProps {
  id: FactionId;
  size?: 'sm' | 'md';
  withLabel?: boolean;
  withIcon?: boolean;
  className?: string;
}

export const FactionPill = ({
  id,
  size = 'sm',
  withLabel = true,
  withIcon = true,
  className,
}: FactionPillProps) => {
  const meta = FACTIONS[id];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-serif',
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-sm px-3 py-1',
        className,
      )}
      style={{
        borderColor: `${meta.color}80`,
        background: `${meta.color}33`,
        color: '#e8ecf3',
      }}
    >
      {withIcon ? (
        <FactionIcon faction={id} size={size === 'sm' ? 14 : 18} />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
      )}
      {withLabel && meta.shortName}
    </span>
  );
};
