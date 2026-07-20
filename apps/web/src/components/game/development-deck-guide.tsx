"use client";

import { Modal } from "@heroui/react";
import Image from "next/image";

import {
  DEVELOPMENT_CARD_ASSETS,
  DEVELOPMENT_CARD_BACK_ASSET_PATH,
  getCardRuntimeAssetPath,
} from "@/constants/game/card-assets";

export function DevelopmentDeckGuide() {
  return (
    <li className="development-card-slot">
      <Modal>
        <Modal.Trigger
          aria-label="Open development card reference. Development cards are not available in this ruleset."
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
              <strong>{DEVELOPMENT_CARD_ASSETS.length}</strong>
              <small>card types</small>
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
                  These are the planned development-card types. Their artwork is available for
                  reference, but development-card play is not enabled in the current ruleset.
                </p>
                <DevelopmentCardReferenceGallery />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </li>
  );
}

export function DevelopmentCardReferenceGallery() {
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
          </div>
        </article>
      ))}
    </div>
  );
}
