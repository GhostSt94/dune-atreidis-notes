import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface Tab {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultId?: string;
  className?: string;
}

export const Tabs = ({ tabs, defaultId, className }: TabsProps) => {
  const [active, setActive] = useState(defaultId ?? tabs[0]?.id);
  const current = tabs.find((t) => t.id === active);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap gap-1 border-b border-atreides-gold/15">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              'px-3 py-2 text-xs font-display uppercase tracking-widest transition-colors border-b-2 -mb-px',
              t.id === active
                ? 'text-atreides-gold border-atreides-gold'
                : 'text-atreides-silverMuted border-transparent hover:text-atreides-silver',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
};
