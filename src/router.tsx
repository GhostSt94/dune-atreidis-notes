import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { GamesListPage } from '@/pages/GamesListPage';
import { NewGamePage } from '@/pages/NewGamePage';
import { FactionsPage } from '@/pages/FactionsPage';
import { NotesPage } from '@/pages/NotesPage';
import { CardsPage } from '@/pages/CardsPage';
import { BattlesPage } from '@/pages/BattlesPage';
import { MapPage } from '@/pages/MapPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { AlliancesPage } from '@/pages/AlliancesPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PredictionsPage } from '@/pages/PredictionsPage';
export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/games" replace />} />
    <Route element={<AppShell />}>
      <Route path="/games" element={<GamesListPage />} />
      <Route path="/games/new" element={<NewGamePage />} />
      <Route path="/game" element={<CardsPage />} />
      <Route path="/game/factions" element={<FactionsPage />} />
      <Route path="/game/notes" element={<NotesPage />} />
      <Route path="/game/cards" element={<Navigate to="/game" replace />} />
      <Route path="/game/battles" element={<BattlesPage />} />
      <Route path="/game/map" element={<MapPage />} />
      <Route path="/game/alliances" element={<AlliancesPage />} />
      <Route path="/game/analysis" element={<AnalysisPage />} />
      <Route path="/game/predictions" element={<PredictionsPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/games" replace />} />
  </Routes>
);
