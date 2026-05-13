import type { GamePhase, PhaseMeta } from '@/types/game';

export const PHASES: PhaseMeta[] = [
  { id: 'storm', index: 0, label: 'Storm', description: 'La tempête de Coriolis avance.' },
  { id: 'spice_blow', index: 1, label: 'Spice Blow', description: 'Une explosion d\'épice apparaît.' },
  { id: 'choam', index: 2, label: 'CHOAM', description: 'Charité CHOAM aux factions à court d\'épice.' },
  { id: 'bidding', index: 3, label: 'Bidding', description: 'Enchères pour les cartes de traîtrise.' },
  { id: 'revival', index: 4, label: 'Revival', description: 'Ressuscitation des troupes et leaders.' },
  { id: 'movement', index: 5, label: 'Movement', description: 'Déplacement et expédition des forces.' },
  { id: 'battle', index: 6, label: 'Battle', description: 'Résolution des conflits sur les territoires.' },
  { id: 'collection', index: 7, label: 'Collection', description: 'Collecte de l\'épice sur les territoires.' },
  { id: 'mentat', index: 8, label: 'Mentat', description: 'Pause stratégique et vérification de victoire.' },
];

export const PHASE_ORDER: GamePhase[] = PHASES.map((p) => p.id);

export const getPhaseMeta = (id: GamePhase): PhaseMeta =>
  PHASES.find((p) => p.id === id) ?? PHASES[0];

export const nextPhase = (current: GamePhase): { phase: GamePhase; turnIncrement: boolean } => {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === -1 || idx === PHASE_ORDER.length - 1) {
    return { phase: PHASE_ORDER[0], turnIncrement: true };
  }
  return { phase: PHASE_ORDER[idx + 1], turnIncrement: false };
};
