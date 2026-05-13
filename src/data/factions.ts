import type { FactionMeta, FactionId } from '@/types/faction';

// Couleurs alignées sur les emblèmes SVG officiels (cf. src/components/icons/factions/).
// Atreides   : olive #56692D    (rgb 86,105,45)
// Harkonnen  : noir  #212121    (rgb 33,33,33)
// Emperor    : rouge #8C3932    (rgb 140,57,50)
// Fremen     : sable #C7993D    (rgb 199,153,61)
// Guild      : orange #BA5827   (rgb 186,88,39)
// B.Gesserit : navy  #47506E    (rgb 71,80,110)
export const FACTIONS: Record<FactionId, FactionMeta> = {
  atreides: {
    id: 'atreides',
    name: 'House Atreides',
    shortName: 'Atreides',
    motto: 'Honor and prescience',
    color: '#56692D',
    startingTroops: 10,
    startingSpice: 10,
    homeWorld: 'Caladan',
    specialAbility:
      "Voit la première carte de l'enchère et peut interroger un adversaire avant chaque bataille.",
  },
  harkonnen: {
    id: 'harkonnen',
    name: 'House Harkonnen',
    shortName: 'Harkonnen',
    motto: 'Brutality and cunning',
    color: '#212121',
    startingTroops: 10,
    startingSpice: 10,
    homeWorld: 'Giedi Prime',
    specialAbility: 'Pioche deux cartes de traîtrise au lieu d\'une.',
  },
  emperor: {
    id: 'emperor',
    name: 'Padishah Emperor',
    shortName: 'Emperor',
    motto: 'Wealth and Sardaukar',
    color: '#8C3932',
    startingTroops: 15,
    startingSpice: 10,
    homeWorld: 'Kaitain',
    specialAbility: 'Reçoit toute l\'épice dépensée lors des enchères.',
  },
  fremen: {
    id: 'fremen',
    name: 'Fremen of Arrakis',
    shortName: 'Fremen',
    motto: 'Desert mastery',
    color: '#C7993D',
    startingTroops: 10,
    startingSpice: 3,
    homeWorld: 'Arrakis',
    specialAbility:
      'Ne subit aucune perte aux tempêtes ; déplacement libre dans le désert ; vers de sable.',
  },
  guild: {
    id: 'guild',
    name: 'Spacing Guild',
    shortName: 'Guild',
    motto: 'Transport monopoly',
    color: '#BA5827',
    startingTroops: 5,
    startingSpice: 5,
    homeWorld: 'Junction',
    specialAbility: 'Contrôle les déplacements ; victoire alternative par stagnation.',
  },
  bene_gesserit: {
    id: 'bene_gesserit',
    name: 'Bene Gesserit',
    shortName: 'B. Gesserit',
    motto: 'Voice and prophecy',
    color: '#47506E',
    startingTroops: 5,
    startingSpice: 5,
    homeWorld: 'Wallach IX',
    specialAbility: 'Prédit le vainqueur en début de partie ; voix de contrôle.',
  },
};

export const FACTION_IDS: FactionId[] = [
  'atreides',
  'harkonnen',
  'emperor',
  'fremen',
  'guild',
  'bene_gesserit',
];

export const getFactionMeta = (id: FactionId): FactionMeta => FACTIONS[id];

export const factionColor = (id: FactionId): string => FACTIONS[id].color;

// Variantes éclaircies des couleurs de faction, lisibles comme texte sur fond sombre.
const FACTION_TEXT_COLORS: Record<FactionId, string> = {
  atreides: '#A8B97F',
  harkonnen: '#B0B0B0',
  emperor: '#D6928A',
  fremen: '#E3C282',
  guild: '#E59B7A',
  bene_gesserit: '#9AA3BD',
};

export const factionTextColor = (id: FactionId): string => FACTION_TEXT_COLORS[id];
