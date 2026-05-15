export { useProfileStore } from './profileStore';
export { useGameStore, useCurrentGame } from './gameStore';
export { useFactionStore } from './factionStore';
export { useNotesStore } from './notesStore';
export { useCardsStore } from './cardsStore';
export { useBattlesStore } from './battlesStore';
export { usePredictionsStore } from './predictionsStore';
export { useMapStore } from './mapStore';
export { useJournalStore } from './journalStore';
export { useSettingsStore } from './settingsStore';
export { useTraitorsStore, MAX_TRAITORS_PER_FACTION } from './traitorsStore';

import { useGameStore } from './gameStore';
import { useFactionStore } from './factionStore';
import { useNotesStore } from './notesStore';
import { useCardsStore } from './cardsStore';
import { useBattlesStore } from './battlesStore';
import { usePredictionsStore } from './predictionsStore';
import { useMapStore } from './mapStore';
import { useJournalStore } from './journalStore';
import { useTraitorsStore } from './traitorsStore';
import { useSettingsStore } from './settingsStore';
import type { FactionId } from '@/types/faction';

export const cascadeDeleteGame = (gameId: string): void => {
  useGameStore.getState().deleteGame(gameId);
  useFactionStore.getState().removeGame(gameId);
  useNotesStore.getState().clearForGame(gameId);
  useCardsStore.getState().clearForGame(gameId);
  useBattlesStore.getState().clearForGame(gameId);
  usePredictionsStore.getState().clearForGame(gameId);
  useMapStore.getState().removeGame(gameId);
  useJournalStore.getState().clearForGame(gameId);
  useTraitorsStore.getState().clearForGame(gameId);
};

export const bootstrapGame = (gameId: string, factions: FactionId[]): void => {
  const includeValue10 = useSettingsStore.getState().useValue10Leaders;
  useFactionStore.getState().initForGame(gameId, factions, includeValue10);
  useMapStore.getState().initForGame(gameId);
};
