import type { TreacheryCard } from '@/types/card';

export const TREACHERY_CARDS: TreacheryCard[] = [
  // Weapons
  { id: 'crysknife', name: 'Crysknife', type: 'weapon', description: 'Tue le leader adverse en combat.' },
  { id: 'maula_pistol', name: 'Maula Pistol', type: 'weapon', description: 'Pistolet à fléchettes empoisonnées.' },
  { id: 'slip_tip', name: 'Slip-Tip', type: 'weapon', description: 'Arme rapide perçant le bouclier.' },
  { id: 'stunner', name: 'Stunner', type: 'weapon', description: 'Étourdit la cible.' },
  { id: 'chaumas', name: 'Chaumas', type: 'weapon', description: 'Poison dans la nourriture.' },
  { id: 'chaumurky', name: 'Chaumurky', type: 'weapon', description: 'Poison dans la boisson.' },
  { id: 'ellaca_drug', name: 'Ellaca Drug', type: 'weapon', description: 'Drogue mortelle.' },
  { id: 'gom_jabbar', name: 'Gom Jabbar', type: 'weapon', description: 'Aiguille empoisonnée — révérée des BG.' },
  { id: 'hunter_seeker', name: 'Hunter-Seeker', type: 'weapon', description: 'Drone tueur télécommandé.' },
  // Defenses
  { id: 'shield', name: 'Shield', type: 'defense', description: 'Bloque les lames rapides.' },
  { id: 'snooper', name: 'Snooper', type: 'defense', description: 'Détecte les poisons.' },
  { id: 'shield2', name: 'Shield (2)', type: 'defense', description: 'Bloque les lames rapides.' },
  { id: 'snooper2', name: 'Snooper (2)', type: 'defense', description: 'Détecte les poisons.' },
  // Special
  { id: 'cheap_hero', name: 'Cheap Hero', type: 'special', description: 'Leader bon marché (valeur 0).' },
  { id: 'family_atomics', name: 'Family Atomics', type: 'special', description: 'Détruit le Bouclier — joué hors combat.' },
  { id: 'hajr', name: 'Hajr', type: 'special', description: 'Mouvement supplémentaire.' },
  { id: 'karama', name: 'Karama', type: 'special', description: 'Annule un pouvoir de faction.' },
  { id: 'lasgun', name: 'Lasgun', type: 'special', description: 'Lasgun-Shield = explosion.' },
  { id: 'truthtrance', name: 'Truthtrance', type: 'special', description: 'Détecte le mensonge.' },
  { id: 'weather_control', name: 'Weather Control', type: 'special', description: 'Contrôle la tempête.' },
  { id: 'tleilaxu_ghola', name: 'Tleilaxu Ghola', type: 'special', description: 'Ressuscite un leader.' },
  // Worthless
  { id: 'baliset', name: 'Baliset', type: 'worthless', description: 'Instrument de Gurney. Sans valeur.' },
  { id: 'jubba_cloak', name: 'Jubba Cloak', type: 'worthless', description: 'Manteau du désert. Sans valeur.' },
  { id: 'kulon', name: 'Kulon', type: 'worthless', description: 'Animal de bât. Sans valeur.' },
  { id: 'la_la', name: 'La, La, La', type: 'worthless', description: 'Chanson. Sans valeur.' },
  { id: 'trip_to_gamont', name: 'Trip to Gamont', type: 'worthless', description: 'Souvenir de voyage. Sans valeur.' },
];

export const getCard = (id: string): TreacheryCard | undefined =>
  TREACHERY_CARDS.find((c) => c.id === id);
