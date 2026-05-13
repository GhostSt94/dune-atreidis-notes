import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-display uppercase tracking-wider text-atreides-silverMuted"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-md bg-atreides-deep/60 border border-atreides-gold/20 px-3 py-2 text-sm text-atreides-silver focus:outline-none focus:border-atreides-gold/60 focus:ring-1 focus:ring-atreides-gold/40 transition-colors',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        {error && <span className="text-xs text-severity-danger">{error}</span>}
      </div>
    );
  },
);
Select.displayName = 'Select';
