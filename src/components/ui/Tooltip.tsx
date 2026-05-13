import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export const Tooltip = ({ content, children }: TooltipProps) => {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-atreides-deep border border-atreides-gold/30 text-[11px] text-atreides-silver whitespace-nowrap shadow-panel pointer-events-none">
          {content}
        </span>
      )}
    </span>
  );
};
