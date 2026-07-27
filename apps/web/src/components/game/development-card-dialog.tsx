"use client";

import {
  RESOURCE_ORDER,
  emptyInventory,
  totalResources,
  type GameCommand,
  type ResourceInventory,
  type ResourceType,
} from "@colonistsaga/game";
import { Button } from "@heroui/react";
import Image from "next/image";
import { useState } from "react";

import { RESOURCE_CARD_ASSET_PATHS } from "@/constants/game/card-assets";

import { GameDialog } from "./game-dialog";
import { RESOURCE_LABELS } from "./resource-icon";
import styles from "./development-card-dialog.module.css";

type ChoiceCard = "monopoly" | "year-of-plenty";

export function DevelopmentCardDialog({
  bank,
  card,
  onClose,
  onPlay,
  pending,
}: {
  bank: ResourceInventory | null;
  card: ChoiceCard;
  onClose(): void;
  onPlay(command: GameCommand, message: string): void;
  pending: boolean;
}) {
  const [monopolyResource, setMonopolyResource] = useState<ResourceType | null>(null);
  const [plentyResources, setPlentyResources] = useState<ResourceInventory>(emptyInventory);
  const selectedCount = totalResources(plentyResources);
  const isMonopoly = card === "monopoly";

  const changePlentyResource = (resource: ResourceType, change: -1 | 1) => {
    setPlentyResources((current) => {
      const nextAmount = current[resource] + change;
      const bankCount = bank?.[resource];
      if (
        nextAmount < 0 ||
        (change > 0 && selectedCount >= 2) ||
        (bankCount !== undefined && nextAmount > bankCount)
      ) {
        return current;
      }
      return { ...current, [resource]: nextAmount };
    });
  };

  const play = () => {
    if (isMonopoly && monopolyResource) {
      onPlay(
        { kind: "play_monopoly", resource: monopolyResource },
        `Monopoly played on ${RESOURCE_LABELS[monopolyResource]}.`,
      );
      return;
    }
    if (!isMonopoly && selectedCount === 2) {
      onPlay({ kind: "play_year_of_plenty", resources: plentyResources }, "Year of Plenty played.");
    }
  };

  return (
    <GameDialog
      ariaLabel={isMonopoly ? "Choose a Monopoly resource" : "Choose two resources"}
      dialogClassName={styles.dialog}
      footer={
        <>
          <span>
            {isMonopoly
              ? monopolyResource
                ? `${RESOURCE_LABELS[monopolyResource]} selected`
                : "Choose a resource"
              : `${selectedCount} of 2 cards selected`}
          </span>
          <div>
            <Button isDisabled={pending} onPress={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              isDisabled={pending || (isMonopoly ? monopolyResource === null : selectedCount !== 2)}
              isPending={pending}
              onPress={play}
              variant="primary"
            >
              Play card
            </Button>
          </div>
        </>
      }
      footerClassName={styles.footer}
      isBusy={pending}
      kicker="Development card"
      onClose={onClose}
      title={isMonopoly ? "Play Monopoly" : "Year of Plenty"}
    >
      <p className={styles.instructions}>
        {isMonopoly
          ? "Choose one resource. Every opponent must give you all cards of that type."
          : "Choose exactly two available bank cards. You may choose the same type twice."}
      </p>
      <div className={styles.resources}>
        {RESOURCE_ORDER.map((resource) => {
          const selected = isMonopoly
            ? monopolyResource === resource
              ? 1
              : 0
            : plentyResources[resource];
          const knownAvailable = bank?.[resource];
          const cannotAdd =
            pending ||
            (!isMonopoly &&
              (selectedCount >= 2 || (knownAvailable !== undefined && selected >= knownAvailable)));

          return (
            <article className={styles.resource} data-selected={selected > 0} key={resource}>
              <Image
                alt=""
                draggable={false}
                height={192}
                src={RESOURCE_CARD_ASSET_PATHS[resource]}
                width={128}
              />
              <strong>{RESOURCE_LABELS[resource]}</strong>
              {isMonopoly ? (
                <Button
                  aria-pressed={selected > 0}
                  isDisabled={pending}
                  onPress={() => setMonopolyResource(resource)}
                  size="sm"
                  variant={selected > 0 ? "primary" : "secondary"}
                >
                  {selected > 0 ? "Selected" : "Choose"}
                </Button>
              ) : (
                <div className={styles.quantity}>
                  <Button
                    aria-label={`Remove one ${RESOURCE_LABELS[resource]}`}
                    isDisabled={pending || selected === 0}
                    isIconOnly
                    onPress={() => changePlentyResource(resource, -1)}
                    size="sm"
                    variant="ghost"
                  >
                    −
                  </Button>
                  <span aria-label={`${selected} selected`}>{selected}</span>
                  <Button
                    aria-label={`Add one ${RESOURCE_LABELS[resource]}`}
                    isDisabled={cannotAdd}
                    isIconOnly
                    onPress={() => changePlentyResource(resource, 1)}
                    size="sm"
                    variant="ghost"
                  >
                    +
                  </Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </GameDialog>
  );
}
