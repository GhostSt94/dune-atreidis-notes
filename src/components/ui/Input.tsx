import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const baseClasses =
  'w-full rounded-md bg-atreides-deep/60 border border-atreides-gold/20 px-3 py-2 text-sm text-atreides-silver placeholder:text-atreides-silverMuted/60 focus:outline-none focus:border-atreides-gold/60 focus:ring-1 focus:ring-atreides-gold/40 transition-colors';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
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
        <input ref={ref} id={inputId} className={cn(baseClasses, className)} {...rest} />
        {error && <span className="text-xs text-severity-danger">{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...rest }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(baseClasses, 'resize-y min-h-[80px] leading-relaxed', className)}
          {...rest}
        />
        {error && <span className="text-xs text-severity-danger">{error}</span>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
