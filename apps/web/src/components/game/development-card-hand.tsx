import type { DevelopmentCardType } from "@colonistsaga/game";
import Image from "next/image";

import { DEVELOPMENT_CARD_ASSETS, getCardRuntimeAssetPath } from "@/constants/game/card-assets";

export function DevelopmentCardHand({ cards }: { cards: readonly DevelopmentCardType[] }) {
  return (
    <ul aria-label="Your development cards" className="development-card-hand">
      {cards.length === 0 ? (
        <li className="development-card-empty">No cards owned</li>
      ) : (
        cards.map((cardType, index) => {
          const card = DEVELOPMENT_CARD_ASSETS.find(({ id }) => id === cardType);

          if (!card) {
            return null;
          }

          return (
            <li
              aria-label={card.label}
              className="development-card-owned"
              key={`${cardType}-${index}`}
            >
              <Image
                alt=""
                data-card-asset={card.path}
                draggable={false}
                height={768}
                loading="eager"
                sizes="4rem"
                src={getCardRuntimeAssetPath(card.path)}
                width={512}
              />
            </li>
          );
        })
      )}
    </ul>
  );
}
