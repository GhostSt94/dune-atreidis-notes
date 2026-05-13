import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  variant?: 'default' | 'highlight';
}

export const Card = ({
  title,
  subtitle,
  action,
  variant = 'default',
  className,
  children,
  ...rest
}: CardProps) => (
  <div
    className={cn(
      'rounded-lg border bg-panel-gradient shadow-panel backdrop-blur-sm overflow-hidden',
      variant === 'highlight'
        ? 'border-atreides-gold/50 shadow-goldGlow'
        : 'border-atreides-gold/15',
      className,
    )}
    {...rest}
  >
    {(title || action) && (
      <div className="flex items-start justify-between gap-3 border-b border-atreides-gold/10 px-4 py-3">
        <div>
          {title && (
            <h3 className="font-display text-sm uppercase tracking-widest text-atreides-gold">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-atreides-silverMuted mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);
