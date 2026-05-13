import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'gold' | 'blue' | 'red' | 'green' | 'purple';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: ReactNode;
}

const tones: Record<Tone, string> = {
  neutral: 'bg-atreides-navy/60 text-atreides-silver border-atreides-silver/20',
  gold: 'bg-atreides-gold/15 text-atreides-gold border-atreides-gold/40',
  blue: 'bg-atreides-blue/20 text-atreides-silver border-atreides-blue/50',
  red: 'bg-severity-danger/15 text-severity-danger border-severity-danger/40',
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
};

export const Badge = ({ tone = 'neutral', className, children, ...rest }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border',
      tones[tone],
      className,
    )}
    {...rest}
  >
    {children}
  </span>
);
