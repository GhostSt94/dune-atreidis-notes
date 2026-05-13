import type { CardTrackerEntry } from '@/types/card';
import type { FactionId } from '@/types/faction';
import { TREACHERY_CARDS } from '@/data/cards';

export interface HandEstimate {
  factionId: FactionId;
  knownCount: number;
  unknownCount: number;
  topKnownCards: { cardId: string; name: string; type: string }[];
}

export const estimateHand = (faction: FactionId, entries: CardTrackerEntry[]): HandEstimate => {
  const inHand = entries.filter((e) => e.knowledge === 'known' && e.heldBy === faction);
  const known = inHand.filter((e) => !!e.cardId);
  const unknown = inHand.filter((e) => !e.cardId);

  const topKnown = known.slice(0, 5).map((k) => {
    const card = TREACHERY_CARDS.find((c) => c.id === k.cardId);
    return {
      cardId: k.cardId ?? '',
      name: card?.name ?? k.cardId ?? '?',
      type: card?.type ?? 'unknown',
    };
  });

  return {
    factionId: faction,
    knownCount: known.length,
    unknownCount: unknown.length,
    topKnownCards: topKnown,
  };
};
