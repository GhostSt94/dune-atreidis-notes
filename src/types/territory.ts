import type { FactionId } from './faction';

export type TerritoryKind = 'stronghold' | 'sand' | 'rock' | 'polar';

export interface TerritoryMeta {
  id: string;
  name: string;
  kind: TerritoryKind;
  sector: number;
  isStronghold: boolean;
  homeOf?: FactionId;
  x: number;
  y: number;
}

export interface TerritoryControl {
  territoryId: string;
  controllingFaction?: FactionId;
  presence: Partial<Record<FactionId, number>>;
  hasSpice: boolean;
  spiceAmount?: number;
  inConflict: boolean;
}
