import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-atreides-blue hover:bg-atreides-blueSoft text-atreides-silver border border-atreides-blueSoft/60',
  secondary:
    'bg-atreides-night hover:bg-atreides-navy text-atreides-silver border border-atreides-gold/20',
  ghost:
    'bg-transparent hover:bg-atreides-navy/40 text-atreides-silver border border-transparent',
  danger:
    'bg-severity-danger/90 hover:bg-severity-danger text-white border border-severity-danger',
  gold:
    'bg-atreides-gold/90 hover:bg-atreides-gold text-atreides-deep border border-atreides-goldSoft font-semibold shadow-goldGlow',
};

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', leftIcon, rightIcon, children, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-atreides-gold/50 disabled:opacity-50 disabled:cursor-not-allowed font-medium tracking-wide',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  ),
);
Button.displayName = 'Button';
