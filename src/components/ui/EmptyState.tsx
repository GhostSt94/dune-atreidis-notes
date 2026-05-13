import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-3">
    {icon && <div className="text-atreides-gold/60">{icon}</div>}
    <h3 className="font-display uppercase tracking-widest text-atreides-silver text-sm">
      {title}
    </h3>
    {description && (
      <p className="text-xs text-atreides-silverMuted max-w-sm leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
