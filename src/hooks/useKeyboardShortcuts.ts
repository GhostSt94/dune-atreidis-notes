import { useEffect } from 'react';

type Handler = () => void;

interface Shortcut {
  key: string;
  meta?: boolean;
  shift?: boolean;
  handler: Handler;
}

export const useKeyboardShortcuts = (shortcuts: Shortcut[]): void => {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      for (const sc of shortcuts) {
        if (
          e.key.toLowerCase() === sc.key.toLowerCase() &&
          !!sc.meta === (e.metaKey || e.ctrlKey) &&
          !!sc.shift === e.shiftKey
        ) {
          e.preventDefault();
          sc.handler();
          return;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
};
