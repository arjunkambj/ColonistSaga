"use client";

import { Modal } from "@heroui/react";
import type { DevelopmentCardType } from "@colonistsaga/game";
import Image from "next/image";

import {
  DEVELOPMENT_CARD_ASSETS,
  DEVELOPMENT_CARD_BACK_ASSET_PATH,
  getCardRuntimeAssetPath,
} from "@/constants/game/card-assets";

export function DevelopmentDeckGuide({
  cards = [],
  supply = 0,
}: {
  cards?: readonly DevelopmentCardType[];
  supply?: number;
}) {
  return (
    <li className="development-card-slot">
      <Modal>
        <Modal.Trigger
          aria-label={`Open your development cards. You own ${cards.length}; ${supply} remain in the deck.`}
          className="resource-card resource-card-face resource-mystery development-card-trigger"
        >
          <span aria-hidden="true" className="resource-card-art">
            <Image
              alt=""
              className="resource-card-image"
              data-card-asset={DEVELOPMENT_CARD_BACK_ASSET_PATH}
              draggable={false}
              height={768}
              loading="eager"
              sizes="4rem"
              src={getCardRuntimeAssetPath(DEVELOPMENT_CARD_BACK_ASSET_PATH)}
              width={512}
            />
          </span>
          <span className="resource-card-copy">
            <span className="resource-card-label">Dev deck</span>
            <span className="resource-card-quantity">
              <strong>{cards.length}</strong>
              <small>{cards.length === 1 ? "card owned" : "cards owned"}</small>
            </span>
          </span>
        </Modal.Trigger>

        <Modal.Backdrop className="development-deck-backdrop" variant="blur">
          <Modal.Container placement="center" scroll="inside" size="lg">
            <Modal.Dialog
              aria-describedby="development-deck-description"
              className="development-deck-dialog"
            >
              <Modal.CloseTrigger />
              <Modal.Header className="development-deck-header">
                <div>
                  <p className="eyebrow">Deck Reference</p>
                  <Modal.Heading>Development Cards</Modal.Heading>
                </div>
              </Modal.Header>
              <Modal.Body className="development-deck-body">
                <p id="development-deck-description">
                  You own {cards.length} development {cards.length === 1 ? "card" : "cards"}. The
                  deck has {supply} remaining. Development-card play is not enabled yet.
                </p>
                <DevelopmentCardReferenceGallery cards={cards} />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </li>
  );
}

export function DevelopmentCardReferenceGallery({
  cards,
}: {
  cards?: readonly DevelopmentCardType[];
}) {
  return (
    <div aria-label="Development card types" className="development-card-grid" role="list">
      {DEVELOPMENT_CARD_ASSETS.map((card) => (
        <article className="development-card-reference" key={card.id} role="listitem">
          <Image
            alt=""
            data-card-asset={card.path}
            draggable={false}
            height={768}
            loading="eager"
            sizes="(max-width: 620px) 42vw, 9rem"
            src={getCardRuntimeAssetPath(card.path)}
            width={512}
          />
          <div>
            <h3>{card.label}</h3>
            <p>{card.description}</p>
            {cards ? (
              <strong>{cards.filter((ownedCard) => ownedCard === card.id).length} owned</strong>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
