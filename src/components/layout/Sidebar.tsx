import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  StickyNote,
  Layers,
  Swords,
  Map,
  Brain,
  Handshake,
  History,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useCurrentGame } from '@/store';
import { FACTIONS } from '@/data/factions';
import { AtreidesIcon } from '@/components/icons/FactionIcon';
import { useT } from '@/i18n';

export const Sidebar = () => {
  const t = useT();
  const game = useCurrentGame();
  const navigate = useNavigate();
  const playerMeta = game ? FACTIONS[game.playerFaction] : null;

  const navItems = [
    { to: '/game', labelKey: 'nav.tracker', icon: Layers, end: true },
    { to: '/game/factions', labelKey: 'nav.factions', icon: Users },
    { to: '/game/notes', labelKey: 'nav.notes', icon: StickyNote },
    { to: '/game/battles', labelKey: 'nav.battles', icon: Swords },
    { to: '/game/map', labelKey: 'nav.map', icon: Map },
    { to: '/game/alliances', labelKey: 'nav.alliances', icon: Handshake },
    { to: '/game/analysis', labelKey: 'nav.strategy', icon: Brain },
  ];

  const secondary = [
    { to: '/history', labelKey: 'nav.history', icon: History },
    { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 bg-atreides-night/80 border-r border-atreides-gold/15 backdrop-blur-md">
      <div className="px-5 py-5 border-b border-atreides-gold/15">
        <div className="flex items-center gap-3">
          <AtreidesIcon width={36} height={36} className="drop-shadow-[0_0_8px_rgba(212,164,55,0.4)]" />
          <div>
            <p className="font-display uppercase text-xs tracking-[0.2em] text-atreides-gold">
              Atreides
            </p>
            <p className="text-[10px] text-atreides-silverMuted font-mono">{t('nav.commandCenter')}</p>
          </div>
        </div>
        {game && playerMeta && (
          <div className="mt-4 p-3 rounded-md bg-atreides-deep/60 border border-atreides-gold/15">
            <p className="text-[10px] uppercase font-mono text-atreides-silverMuted tracking-wider">
              {t('nav.currentGame')}
            </p>
            <p className="text-sm text-atreides-silver mt-0.5 truncate">{game.name}</p>
            <p className="text-[11px] text-atreides-gold font-mono mt-1">
              {t('games.turnPhase', { turn: game.currentTurn, phase: t(`phase.${game.currentPhase}`) })}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-atreides-blue/30 text-atreides-gold border-l-2 border-atreides-gold'
                  : 'text-atreides-silver/80 hover:text-atreides-silver hover:bg-atreides-navy/40 border-l-2 border-transparent',
              )
            }
          >
            <item.icon size={16} />
            <span className="font-display uppercase tracking-wider text-xs">{t(item.labelKey)}</span>
          </NavLink>
        ))}

        <div className="my-3 border-t border-atreides-gold/10" />

        {secondary.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-atreides-blue/30 text-atreides-gold'
                  : 'text-atreides-silver/80 hover:bg-atreides-navy/40',
              )
            }
          >
            <item.icon size={16} />
            <span className="font-display uppercase tracking-wider text-xs">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => navigate('/games')}
        className="flex items-center gap-2 mx-3 mb-4 px-3 py-2 text-xs text-atreides-silverMuted hover:text-atreides-gold transition-colors border-t border-atreides-gold/10 pt-3"
      >
        <LogOut size={14} />
        <span className="font-display uppercase tracking-wider">{t('nav.quitGame')}</span>
      </button>
    </aside>
  );
};
