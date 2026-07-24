import { DEVELOPMENT_CARD_COUNTS } from "./constants";
import { deterministicShuffle } from "./random";
import { DEVELOPMENT_CARD_TYPES } from "./types";
import type { DevelopmentCardType } from "./types";

export function createDevelopmentCardDeck(seed: string): DevelopmentCardType[] {
  const cards = DEVELOPMENT_CARD_TYPES.flatMap((type) =>
    Array.from({ length: DEVELOPMENT_CARD_COUNTS[type] }, () => type),
  );

  return deterministicShuffle(cards, `${seed}:development-cards`);
}
