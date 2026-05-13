import { cn } from '@/lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export const Toggle = ({ checked, onChange, label, description }: ToggleProps) => (
  <label className="flex items-start gap-3 cursor-pointer select-none">
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative shrink-0 w-10 h-5 rounded-full transition-colors border',
        checked
          ? 'bg-atreides-gold/80 border-atreides-gold'
          : 'bg-atreides-deep border-atreides-gold/30',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-atreides-silver transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
    {(label || description) && (
      <div className="flex flex-col text-sm">
        {label && <span className="text-atreides-silver">{label}</span>}
        {description && <span className="text-xs text-atreides-silverMuted">{description}</span>}
      </div>
    )}
  </label>
);
