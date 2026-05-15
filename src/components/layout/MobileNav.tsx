import { NavLink } from 'react-router-dom';
import { StickyNote, Layers, Swords, Brain, Handshake } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';

const items = [
  { to: '/game', labelKey: 'nav.tracker', icon: Layers, end: true },
  { to: '/game/notes', labelKey: 'nav.notes', icon: StickyNote },
  { to: '/game/battles', labelKey: 'nav.battles', icon: Swords },
  { to: '/game/alliances', labelKey: 'nav.alliances', icon: Handshake },
  { to: '/game/analysis', labelKey: 'nav.strategy', icon: Brain },
];

export const MobileNav = () => {
  const t = useT();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-atreides-night/95 backdrop-blur-md border-t border-atreides-gold/20">
      <div className="grid grid-cols-5">
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
