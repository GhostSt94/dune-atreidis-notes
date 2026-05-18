import type { TreacheryCard, CardType, WeaponSubtype } from '@/types/card';

interface CardSeed {
  slug: string;
  type: CardType;
  subtype?: WeaponSubtype;
  counteredBy?: string;
  battleImpact: number;
  quantity: number;
}

const SEEDS: CardSeed[] = [
  // Projectile weapons (countered by Shield)
  { slug: 'lasgun', type: 'weapon', subtype: 'projectile', counteredBy: 'shield', battleImpact: 0.98, quantity: 1 },
  { slug: 'maula_pistol', type: 'weapon', subtype: 'projectile', counteredBy: 'shield', battleImpact: 0.61, quantity: 1 },
  { slug: 'hunter_seeker', type: 'weapon', subtype: 'projectile', counteredBy: 'shield', battleImpact: 0.73, quantity: 1 },
  { slug: 'slip_tip', type: 'weapon', subtype: 'projectile', counteredBy: 'shield', battleImpact: 0.58, quantity: 1 },
  { slug: 'stunner', type: 'weapon', subtype: 'projectile', counteredBy: 'shield', battleImpact: 0.55, quantity: 1 },
  { slug: 'crysknife', type: 'weapon', subtype: 'projectile', counteredBy: 'shield', battleImpact: 0.75, quantity: 1 },
  { slug: 'shigawire', type: 'weapon', subtype: 'projectile', counteredBy: 'shield', battleImpact: 0.69, quantity: 1 },

  // Poison weapons (countered by Snooper)
  { slug: 'gom_jabbar', type: 'weapon', subtype: 'poison', counteredBy: 'snooper', battleImpact: 0.88, quantity: 1 },
  { slug: 'chaumas', type: 'weapon', subtype: 'poison', counteredBy: 'snooper', battleImpact: 0.74, quantity: 1 },
  { slug: 'chaumurky', type: 'weapon', subtype: 'poison', counteredBy: 'snooper', battleImpact: 0.66, quantity: 1 },
  { slug: 'ellaca_drug', type: 'weapon', subtype: 'poison', counteredBy: 'snooper', battleImpact: 0.62, quantity: 2 },
  { slug: 'semuta_drug', type: 'weapon', subtype: 'poison', counteredBy: 'snooper', battleImpact: 0.59, quantity: 1 },
  { slug: 'kriminon', type: 'weapon', subtype: 'poison', counteredBy: 'snooper', battleImpact: 0.71, quantity: 1 },

  // Defenses
  { slug: 'shield', type: 'defense', battleImpact: 0.82, quantity: 5 },
  { slug: 'snooper', type: 'defense', battleImpact: 0.81, quantity: 5 },

  // Specials
  { slug: 'karama', type: 'special', battleImpact: 0.95, quantity: 2 },
  { slug: 'hajr', type: 'special', battleImpact: 0.63, quantity: 1 },
  { slug: 'family_atomics', type: 'special', battleImpact: 0.97, quantity: 1 },
  { slug: 'weather_control', type: 'special', battleImpact: 0.57, quantity: 1 },
  { slug: 'tleilaxu_ghola', type: 'special', battleImpact: 0.79, quantity: 1 },
  { slug: 'truthtrance', type: 'special', battleImpact: 0.72, quantity: 3 },
  { slug: 'cheap_hero', type: 'special', battleImpact: 0.33, quantity: 2 },
  { slug: 'cheap_heroine', type: 'special', battleImpact: 0.31, quantity: 2 },

  // Worthless
  { slug: 'baliset', type: 'worthless', battleImpact: 0.01, quantity: 1 },
  { slug: 'jubba_cloak', type: 'worthless', battleImpact: 0.01, quantity: 1 },
  { slug: 'kulon', type: 'worthless', battleImpact: 0.01, quantity: 1 },
  { slug: 'la_la_la', type: 'worthless', battleImpact: 0.01, quantity: 1 },
  { slug: 'trip_to_gamont', type: 'worthless', battleImpact: 0.01, quantity: 1 },
  { slug: 'ya_ya_yawm', type: 'worthless', battleImpact: 0.01, quantity: 1 },
  { slug: 'distrans', type: 'worthless', battleImpact: 0.01, quantity: 1 },
  { slug: 'dune_encyclopedia', type: 'worthless', battleImpact: 0.01, quantity: 1 },
];

const expand = (seeds: CardSeed[]): TreacheryCard[] => {
  const out: TreacheryCard[] = [];
  for (const s of seeds) {
    if (s.quantity === 1) {
      out.push({
        id: s.slug,
        slug: s.slug,
        type: s.type,
        subtype: s.subtype,
        counteredBy: s.counteredBy,
        battleImpact: s.battleImpact,
      });
    } else {
      for (let i = 1; i <= s.quantity; i++) {
        out.push({
          id: `${s.slug}_${i}`,
          slug: s.slug,
          type: s.type,
          subtype: s.subtype,
          counteredBy: s.counteredBy,
          battleImpact: s.battleImpact,
        });
      }
    }
  }
  return out;
};

export const TREACHERY_CARDS: TreacheryCard[] = expand(SEEDS);

export const getCard = (id: string): TreacheryCard | undefined =>
  TREACHERY_CARDS.find((c) => c.id === id);

export const cardNameKey = (card: TreacheryCard): string => `card.${card.slug}.name`;
export const cardDescKey = (card: TreacheryCard): string => `card.${card.slug}.desc`;

/** True if the card is a poison weapon (countered by Snooper). */
export const isPoison = (card: TreacheryCard): boolean =>
  card.type === 'weapon' && card.subtype === 'poison';

/** True if the card is a projectile weapon (countered by Shield). */
export const isProjectile = (card: TreacheryCard): boolean =>
  card.type === 'weapon' && card.subtype === 'projectile';
