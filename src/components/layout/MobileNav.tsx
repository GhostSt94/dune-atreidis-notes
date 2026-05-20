import { NavLink } from 'react-router-dom';
import { StickyNote, Layers, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';

const items = [
  { to: '/game', labelKey: 'nav.tracker', icon: Layers, end: true },
  { to: '/game/notes', labelKey: 'nav.notes', icon: StickyNote },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export const MobileNav = () => {
  const t = useT();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-atreides-night/95 backdrop-blur-md border-t border-atreides-gold/20">
      <div className="grid grid-cols-3 max-w-2xl mx-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase font-display tracking-wider transition-colors',
                isActive ? 'text-atreides-gold' : 'text-atreides-silverMuted',
              )
            }
          >
            <item.icon size={18} />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
