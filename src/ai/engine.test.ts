import { describe, expect, it } from 'vitest';
import { analyze } from './engine';
import { FACTIONS } from '@/data/factions';
import { buildLeadersFor } from '@/data/leaders';
import type { Game } from '@/types/game';
import type { FactionId, FactionState } from '@/types/faction';

const makeFaction = (id: FactionId, overrides: Partial<FactionState> = {}): FactionState => ({
  id,
  name: FACTIONS[id].name,
  color: FACTIONS[id].color,
  estimatedTroops: 10,
  estimatedSpice: 10,
  alliances: [],
  threatLevel: 1,
  privateNotes: '',
  leaders: buildLeadersFor(id, () => Math.random().toString(36).slice(2)),
  actionsHistory: [],
  ...overrides,
});

describe('AI engine', () => {
  const game: Game = {
    id: 'g1',
    name: 'Test',
    createdAt: 0,
    updatedAt: 0,
    playerCount: 6,
    factionsInPlay: ['atreides', 'harkonnen', 'fremen'],
    currentTurn: 3,
    currentPhase: 'battle',
    stormSector: 1,
    status: 'active',
    playerFaction: 'atreides',
  };

  it('computes threat scores for all factions', () => {
    const factions = {
      atreides: makeFaction('atreides'),
      harkonnen: makeFaction('harkonnen', { estimatedTroops: 30, estimatedSpice: 25 }),
      fremen: makeFaction('fremen'),
    } as never;
    const report = analyze(game, factions, {}, []);
    expect(report.threats.harkonnen.score).toBeGreaterThan(report.threats.fremen.score);
  });

  it('flags critical alliances', () => {
    const factions = {
      atreides: makeFaction('atreides'),
      harkonnen: makeFaction('harkonnen', {
        estimatedTroops: 40,
        estimatedSpice: 30,
        alliances: ['fremen'],
      }),
      fremen: makeFaction('fremen', {
        estimatedTroops: 35,
        estimatedSpice: 20,
        alliances: ['harkonnen'],
      }),
    } as never;
    const report = analyze(game, factions, {}, []);
    expect(report.allianceRisks.length).toBeGreaterThan(0);
  });
});
