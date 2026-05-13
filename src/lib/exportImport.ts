import { z } from 'zod';
import type { Game } from '@/types/game';
import type { FactionState } from '@/types/faction';
import type { Note } from '@/types/note';
import type { CardTrackerEntry } from '@/types/card';
import type { Battle } from '@/types/battle';
import type { BGPrediction } from '@/types/prediction';
import type { TerritoryControl } from '@/types/territory';
import type { JournalEvent } from '@/types/event';

export const EXPORT_VERSION = 1;

export interface GameExport {
  version: number;
  exportedAt: number;
  game: Game;
  factions: FactionState[];
  notes: Note[];
  cards: CardTrackerEntry[];
  battles: Battle[];
  predictions: BGPrediction[];
  territoryControls: TerritoryControl[];
  journal: JournalEvent[];
}

const exportSchema = z.object({
  version: z.number(),
  exportedAt: z.number(),
  game: z.any(),
  factions: z.array(z.any()),
  notes: z.array(z.any()),
  cards: z.array(z.any()),
  battles: z.array(z.any()),
  predictions: z.array(z.any()),
  territoryControls: z.array(z.any()),
  journal: z.array(z.any()),
});

export const downloadJson = (data: unknown, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const readJsonFile = async (file: File): Promise<GameExport> => {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const validated = exportSchema.parse(parsed);
  if (validated.version !== EXPORT_VERSION) {
    throw new Error(
      `Version d'export non supportée : ${validated.version} (attendu ${EXPORT_VERSION})`,
    );
  }
  return validated as GameExport;
};
