import { Outlet } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { useCurrentGame } from '@/store';

export const AppShell = () => {
  const game = useCurrentGame();

  return (
    <div className="min-h-screen bg-atreides-deep bg-starfield flex flex-col">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      {game && <MobileNav />}
    </div>
  );
};
