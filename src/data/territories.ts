import type { TerritoryMeta } from '@/types/territory';

// Coordonnées x,y exprimées en pourcentages (0-100) de l'image dune-board.jpg (4145x4601).
// Calibrées sur 6 ancres mesurées : Polar Sink (49.4, 50.3), Arrakeen (63.3, 22.2),
// Carthag (49.2, 25.4), Sietch Tabr (19.2, 33.8), Habbanya Sietch (20.7, 67.1),
// Tuek's Sietch (80.5, 65.7). Les autres territoires sont positionnés relativement.
export const TERRITORIES: TerritoryMeta[] = [
  // Strongholds (forteresses) — valeurs mesurées exactes
  { id: 'arrakeen', name: 'Arrakeen', kind: 'stronghold', sector: 1, isStronghold: true, homeOf: 'atreides', x: 63.3, y: 22.2 },
  { id: 'carthag', name: 'Carthag', kind: 'stronghold', sector: 16, isStronghold: true, homeOf: 'harkonnen', x: 49.2, y: 25.4 },
  { id: 'sietch_tabr', name: 'Sietch Tabr', kind: 'stronghold', sector: 14, isStronghold: true, homeOf: 'fremen', x: 19.2, y: 33.8 },
  { id: 'habbanya_sietch', name: 'Habbanya Sietch', kind: 'stronghold', sector: 11, isStronghold: true, homeOf: 'fremen', x: 20.7, y: 67.1 },
  { id: 'tueks_sietch', name: "Tuek's Sietch", kind: 'stronghold', sector: 5, isStronghold: true, homeOf: 'guild', x: 80.5, y: 65.7 },
  { id: 'cielago_sietch', name: 'Cielago Sietch', kind: 'stronghold', sector: 8, isStronghold: true, x: 50, y: 80 },

  // Centre & passages
  { id: 'polar_sink', name: 'Polar Sink', kind: 'polar', sector: 0, isStronghold: false, x: 49.4, y: 50.3 },
  { id: 'wind_pass', name: 'Wind Pass', kind: 'rock', sector: 1, isStronghold: false, x: 41, y: 50 },
  { id: 'wind_pass_north', name: 'Wind Pass North', kind: 'rock', sector: 8, isStronghold: false, x: 43, y: 57 },
  { id: 'false_wall_east', name: 'False Wall East', kind: 'rock', sector: 4, isStronghold: false, x: 58, y: 50 },
  { id: 'harg_pass', name: 'Harg Pass', kind: 'rock', sector: 5, isStronghold: false, x: 60, y: 55 },

  // Arc Nord (12h)
  { id: 'broken_land', name: 'Broken Land', kind: 'sand', sector: 17, isStronghold: false, x: 40, y: 12 },
  { id: 'tsimpo', name: 'Tsimpo', kind: 'sand', sector: 17, isStronghold: false, x: 44, y: 19 },
  { id: 'old_gap', name: 'Old Gap', kind: 'sand', sector: 1, isStronghold: false, x: 63, y: 12 },
  { id: 'basin', name: 'Basin', kind: 'sand', sector: 2, isStronghold: false, x: 75, y: 19 },

  // Arc Nord-Est (1-3h)
  { id: 'rim_wall_west', name: 'Rim Wall West', kind: 'rock', sector: 1, isStronghold: false, x: 66, y: 27 },
  { id: 'sihaya_ridge', name: 'Sihaya Ridge', kind: 'rock', sector: 2, isStronghold: false, x: 82, y: 26 },
  { id: 'imperial_basin', name: 'Imperial Basin', kind: 'sand', sector: 1, isStronghold: false, x: 55, y: 33 },
  { id: 'hole_in_the_rock', name: 'Hole in the Rock', kind: 'rock', sector: 2, isStronghold: false, x: 71, y: 32 },
  { id: 'gara_kulon', name: 'Gara Kulon', kind: 'sand', sector: 3, isStronghold: false, x: 84, y: 36 },
  { id: 'shield_wall', name: 'Shield Wall', kind: 'rock', sector: 3, isStronghold: false, x: 73, y: 38 },

  // Arc Nord-Ouest (9-11h)
  { id: 'rock_outcroppings', name: 'Rock Outcroppings', kind: 'rock', sector: 15, isStronghold: false, x: 23, y: 22 },
  { id: 'plastic_basin', name: 'Plastic Basin', kind: 'rock', sector: 14, isStronghold: false, x: 25, y: 29 },
  { id: 'hagga_basin', name: 'Hagga Basin', kind: 'sand', sector: 16, isStronghold: false, x: 38, y: 34 },
  { id: 'arsunt', name: 'Arsunt', kind: 'sand', sector: 1, isStronghold: false, x: 48, y: 40 },

  // Arc Est (3-5h)
  { id: 'the_minor_erg', name: 'The Minor Erg', kind: 'sand', sector: 4, isStronghold: false, x: 70, y: 50 },
  { id: 'pasty_mesa', name: 'Pasty Mesa', kind: 'rock', sector: 4, isStronghold: false, x: 78, y: 49 },
  { id: 'red_chasm', name: 'Red Chasm', kind: 'rock', sector: 4, isStronghold: false, x: 85, y: 47 },

  // Arc Ouest (7-9h)
  { id: 'bight_of_the_cliff', name: 'Bight of the Cliff', kind: 'rock', sector: 13, isStronghold: false, x: 8, y: 39 },
  { id: 'funeral_plain', name: 'Funeral Plain', kind: 'sand', sector: 13, isStronghold: false, x: 11, y: 43 },
  { id: 'the_great_flat', name: 'The Great Flat', kind: 'sand', sector: 12, isStronghold: false, x: 13, y: 49 },
  { id: 'the_greater_flat', name: 'The Greater Flat', kind: 'sand', sector: 12, isStronghold: false, x: 7, y: 53 },
  { id: 'habbanya_erg', name: 'Habbanya Erg', kind: 'sand', sector: 11, isStronghold: false, x: 10, y: 59 },

  // Arc Sud-Ouest (7-8h)
  { id: 'false_wall_west', name: 'False Wall West', kind: 'rock', sector: 9, isStronghold: false, x: 28, y: 60 },
  { id: 'habbanya_ridge_flat', name: 'Habbanya Ridge Flat', kind: 'rock', sector: 10, isStronghold: false, x: 19, y: 77 },
  { id: 'cielago_west', name: 'Cielago West', kind: 'sand', sector: 9, isStronghold: false, x: 36, y: 67 },
  { id: 'meridian', name: 'Meridian', kind: 'sand', sector: 9, isStronghold: false, x: 32, y: 80 },

  // Arc Sud (5-7h)
  { id: 'cielago_north', name: 'Cielago North', kind: 'sand', sector: 8, isStronghold: false, x: 47, y: 63 },
  { id: 'false_wall_south', name: 'False Wall South', kind: 'rock', sector: 7, isStronghold: false, x: 58, y: 63 },
  { id: 'cielago_depression', name: 'Cielago Depression', kind: 'sand', sector: 8, isStronghold: false, x: 46, y: 73 },
  { id: 'cielago_south', name: 'Cielago South', kind: 'sand', sector: 7, isStronghold: false, x: 62, y: 76 },

  // Arc Sud-Est (4-6h)
  { id: 'south_mesa', name: 'South Mesa', kind: 'rock', sector: 6, isStronghold: false, x: 78, y: 74 },
];

export const STRONGHOLDS = TERRITORIES.filter((t) => t.isStronghold);

export const getTerritory = (id: string): TerritoryMeta | undefined =>
  TERRITORIES.find((t) => t.id === id);
