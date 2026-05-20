import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NewGamePage } from '@/pages/NewGamePage';
import { NotesPage } from '@/pages/NotesPage';
import { CardsPage } from '@/pages/CardsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { useCurrentGame } from '@/store';

const RootRedirect = () => {
  const game = useCurrentGame();
  return <Navigate to={game ? '/game' : '/games/new'} replace />;
};

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route element={<AppShell />}>
      <Route path="/games/new" element={<NewGamePage />} />
      <Route path="/game" element={<CardsPage />} />
      <Route path="/game/cards" element={<Navigate to="/game" replace />} />
      <Route path="/game/notes" element={<NotesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
