import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { GamesListPage } from '@/pages/GamesListPage';
import { NewGamePage } from '@/pages/NewGamePage';
import { GameViewPage } from '@/pages/GameViewPage';
import { FactionsPage } from '@/pages/FactionsPage';
import { NotesPage } from '@/pages/NotesPage';
import { CardsPage } from '@/pages/CardsPage';
import { BattlesPage } from '@/pages/BattlesPage';
import { MapPage } from '@/pages/MapPage';
import { JournalPage } from '@/pages/JournalPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PredictionsPage } from '@/pages/PredictionsPage';
import { useProfileStore } from '@/store';

const RequireProfile = ({ children }: { children: JSX.Element }) => {
  const profile = useProfileStore((s) => s.profile);
  if (!profile) return <Navigate to="/" replace />;
  return children;
};

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route element={<AppShell />}>
      <Route
        path="/games"
        element={
          <RequireProfile>
            <GamesListPage />
          </RequireProfile>
        }
      />
      <Route
        path="/games/new"
        element={
          <RequireProfile>
            <NewGamePage />
          </RequireProfile>
        }
      />
      <Route path="/game" element={<RequireProfile><GameViewPage /></RequireProfile>} />
      <Route path="/game/factions" element={<RequireProfile><FactionsPage /></RequireProfile>} />
      <Route path="/game/notes" element={<RequireProfile><NotesPage /></RequireProfile>} />
      <Route path="/game/cards" element={<RequireProfile><CardsPage /></RequireProfile>} />
      <Route path="/game/battles" element={<RequireProfile><BattlesPage /></RequireProfile>} />
      <Route path="/game/map" element={<RequireProfile><MapPage /></RequireProfile>} />
      <Route path="/game/journal" element={<RequireProfile><JournalPage /></RequireProfile>} />
      <Route path="/game/analysis" element={<RequireProfile><AnalysisPage /></RequireProfile>} />
      <Route path="/game/predictions" element={<RequireProfile><PredictionsPage /></RequireProfile>} />
      <Route path="/history" element={<RequireProfile><HistoryPage /></RequireProfile>} />
      <Route path="/settings" element={<RequireProfile><SettingsPage /></RequireProfile>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
