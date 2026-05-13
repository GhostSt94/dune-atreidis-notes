import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { useCurrentGame } from '@/store';

export const AppShell = () => {
  const game = useCurrentGame();
  const location = useLocation();
  const inGame = location.pathname.startsWith('/game') && game;

  return (
    <div className="min-h-screen bg-atreides-deep bg-starfield flex">
      {inGame && <Sidebar />}
      <div className="flex-1 min-w-0 flex flex-col">
        {inGame && <Topbar />}
        <main className="flex-1 pb-20 lg:pb-0">
          <Outlet />
        </main>
        {inGame && <MobileNav />}
      </div>
    </div>
  );
};
