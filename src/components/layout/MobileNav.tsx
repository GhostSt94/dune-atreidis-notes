import { NavLink } from 'react-router-dom';
import { LayoutDashboard, StickyNote, Layers, Swords, Brain } from 'lucide-react';
import { cn } from '@/lib/cn';

const items = [
  { to: '/game', label: 'Board', icon: LayoutDashboard, end: true },
  { to: '/game/notes', label: 'Notes', icon: StickyNote },
  { to: '/game/cards', label: 'Cartes', icon: Layers },
  { to: '/game/battles', label: 'Batailles', icon: Swords },
  { to: '/game/analysis', label: 'IA', icon: Brain },
];

export const MobileNav = () => (
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
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);
