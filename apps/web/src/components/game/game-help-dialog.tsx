"use client";

import { Button, Modal } from "@heroui/react";
import Image from "next/image";
import { useState } from "react";

import { liquidGlassClassName } from "@/components/ui/liquid-glass";
import { ACTION_CARD_ASSET_PATHS } from "@/constants/game/card-assets";
import { END_TURN_ICON_ASSET_PATH } from "@/constants/game/ui-assets";

import styles from "./game-help-dialog.module.css";

interface GameHelpDialogProps {
  onClose(): void;
}

interface GuidePage {
  art: readonly {
    alt: string;
    height: number;
    path: string;
    width: number;
  }[];
  eyebrow: string;
  title: string;
  tips: readonly {
    copy: string;
    title: string;
  }[];
}

const GUIDE_PAGES: readonly GuidePage[] = [
  {
    art: [
      {
        alt: "Victory celebration over the island",
        height: 512,
        path: "/game-assets/results/victory-flourish.png",
        width: 1536,
      },
    ],
    eyebrow: "The goal",
    title: "Be first to the victory target",
    tips: [
      {
        copy: "The target is shown at the top of the game.",
        title: "Collect victory points",
      },
      {
        copy: "Settlements are worth 1 point. Cities are worth 2.",
        title: "Grow your island",
      },
      {
        copy: "Awards and some development cards give extra points.",
        title: "Find bonus points",
      },
    ],
  },
  {
    art: [
      {
        alt: "End turn compass",
        height: 256,
        path: END_TURN_ICON_ASSET_PATH,
        width: 256,
      },
    ],
    eyebrow: "Your turn",
    title: "Roll, take action, then pass",
    tips: [
      {
        copy: "Nearby buildings collect resources from tiles with the rolled number.",
        title: "1. Roll",
      },
      {
        copy: "Trade, build, or buy a development card in any order.",
        title: "2. Take action",
      },
      {
        copy: "Choose End Turn when you are done.",
        title: "3. Pass the turn",
      },
    ],
  },
  {
    art: [
      { alt: "Road", height: 768, path: ACTION_CARD_ASSET_PATHS.road, width: 512 },
      {
        alt: "Settlement",
        height: 768,
        path: ACTION_CARD_ASSET_PATHS.settlement,
        width: 512,
      },
      { alt: "City", height: 768, path: ACTION_CARD_ASSET_PATHS.city, width: 512 },
    ],
    eyebrow: "Building",
    title: "Connect roads and grow",
    tips: [
      {
        copy: "New roads must connect to one of your roads or buildings.",
        title: "Start with a road",
      },
      {
        copy: "Leave at least two road lengths between every settlement.",
        title: "Leave room",
      },
      {
        copy: "Upgrade your own settlement to place a city.",
        title: "Build upward",
      },
    ],
  },
  {
    art: [
      {
        alt: "Trade action",
        height: 768,
        path: ACTION_CARD_ASSET_PATHS.trade,
        width: 512,
      },
      {
        alt: "Harbor merchant",
        height: 1182,
        path: "/game-assets/ui/port-merchant-v2.png",
        width: 655,
      },
    ],
    eyebrow: "Trading",
    title: "Swap what you have for what you need",
    tips: [
      {
        copy: "Offer resources to other players during your turn.",
        title: "Trade with players",
      },
      {
        copy: "The bank always trades 4 of one resource for 1.",
        title: "Use the bank",
      },
      {
        copy: "Build beside a harbor to unlock its better 3:1 or 2:1 rate.",
        title: "Claim a harbor",
      },
    ],
  },
  {
    art: [
      {
        alt: "The robber",
        height: 256,
        path: "/game-assets/pieces/robber-piece.png",
        width: 256,
      },
    ],
    eyebrow: "Rolling a 7",
    title: "Move the robber",
    tips: [
      {
        copy: "If you have more than 7 resource cards, discard half.",
        title: "Discard if asked",
      },
      {
        copy: "Place the robber on a new tile. That tile stops producing.",
        title: "Block a tile",
      },
      {
        copy: "If an opponent has a building there, take one random card.",
        title: "Choose a neighbor",
      },
    ],
  },
] as const;

export function GameHelpDialog({ onClose }: GameHelpDialogProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const page = GUIDE_PAGES[pageIndex];
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === GUIDE_PAGES.length - 1;

  function showPreviousPage() {
    setPageIndex((currentPage) => Math.max(0, currentPage - 1));
  }

  function showNextPage() {
    if (isLastPage) {
      onClose();
      return;
    }

    setPageIndex((currentPage) => Math.min(GUIDE_PAGES.length - 1, currentPage + 1));
  }

  return (
    <Modal>
      <Modal.Backdrop
        className={styles.backdrop}
        isOpen
        onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}
        variant="blur"
      >
        <Modal.Container>
          <Modal.Dialog
            aria-label="How to play"
            className={liquidGlassClassName({
              className: styles.dialog,
              kind: "panel",
              radius: "md",
            })}
            id="game-help-dialog"
          >
            <Modal.Header className={styles.header}>
              <div>
                <p className={styles.kicker}>Player guide</p>
                <Modal.Heading>How to Play</Modal.Heading>
              </div>
              <Button
                aria-label="Close game guide"
                className={styles.closeButton}
                isIconOnly
                onPress={onClose}
                variant="ghost"
              >
                ×
              </Button>
            </Modal.Header>

            <Modal.Body className={styles.body}>
              <article aria-live="polite" className={styles.page} key={page.eyebrow}>
                <div className={styles.visual} data-page={pageIndex + 1}>
                  <div className={styles.artGroup}>
                    {page.art.map((asset) => (
                      <Image
                        alt={asset.alt}
                        className={styles.art}
                        draggable={false}
                        height={asset.height}
                        key={asset.path}
                        priority={pageIndex === 0}
                        sizes="(max-width: 640px) 42vw, 220px"
                        src={asset.path}
                        width={asset.width}
                      />
                    ))}
                  </div>
                  <span className={styles.pageNumber}>
                    {pageIndex + 1} / {GUIDE_PAGES.length}
                  </span>
                </div>

                <div className={styles.copy}>
                  <p className={styles.pageEyebrow}>{page.eyebrow}</p>
                  <h3>{page.title}</h3>
                  <ul className={styles.tips}>
                    {page.tips.map((tip) => (
                      <li key={tip.title}>
                        <span aria-hidden="true" className={styles.check}>
                          ✓
                        </span>
                        <div>
                          <strong>{tip.title}</strong>
                          <p>{tip.copy}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </Modal.Body>

            <Modal.Footer className={styles.footer}>
              <div aria-label="Guide pages" className={styles.dots} role="group">
                {GUIDE_PAGES.map((guidePage, index) => (
                  <button
                    aria-label={`Go to page ${index + 1}: ${guidePage.eyebrow}`}
                    aria-pressed={index === pageIndex}
                    className={index === pageIndex ? styles.activeDot : styles.dot}
                    key={guidePage.eyebrow}
                    onClick={() => setPageIndex(index)}
                    type="button"
                  />
                ))}
              </div>
              <div className={styles.actions}>
                {!isFirstPage && (
                  <Button className={styles.backButton} onPress={showPreviousPage} variant="ghost">
                    Back
                  </Button>
                )}
                <Button className={styles.nextButton} onPress={showNextPage} variant="primary">
                  {isLastPage ? "Start playing" : "Next"}
                  {!isLastPage && <span aria-hidden="true">→</span>}
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
