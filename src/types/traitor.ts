import type { FactionId } from './faction';

export interface Traitor {
  id: string;
  gameId: string;
  factionId: FactionId;          // faction qui détient ce traître (le « propriétaire » de la carte traîtrise)
  leaderFactionId?: FactionId;   // faction du leader désigné (undefined = inconnu)
  leaderName?: string;           // nom du leader désigné (undefined = inconnu)
  active: boolean;               // traître réellement sélectionné en début de partie ?
  createdAt: number;
  updatedAt: number;
}
