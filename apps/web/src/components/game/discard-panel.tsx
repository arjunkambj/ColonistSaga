"use client";

import {
  RESOURCE_ORDER,
  emptyInventory,
  totalResources,
  type GameCommand,
  type PrivatePlayerState,
  type ResourceInventory,
  type ResourceType,
} from "@colonistsaga/game";
import { Button } from "@heroui/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { RESOURCE_CARD_ASSET_PATHS } from "@/constants/game/card-assets";

import { HandDockPortal, useHandDock } from "./hand-dock";
import { RESOURCE_LABELS } from "./resource-icon";
import styles from "./discard-panel.module.css";

export function DiscardPanel({
  count,
  me,
  onCommand,
  pending,
}: {
  count: number;
  me: PrivatePlayerState;
  onCommand(command: GameCommand, message: string): void;
  pending: boolean;
}) {
  const { clearInteraction, setInteraction } = useHandDock();
  const [selection, setSelection] = useState<ResourceInventory>(() => emptyInventory());
  const selectedCount = totalResources(selection);
  const remainingCount = Math.max(0, count - selectedCount);
  const selectedResources = RESOURCE_ORDER.filter((resource) => selection[resource] > 0);

  const addResource = useCallback(
    (resource: ResourceType) => {
      if (pending) {
        return;
      }

      setSelection((current) => {
        if (totalResources(current) >= count || current[resource] >= me.resources[resource]) {
          return current;
        }

        return {
          ...current,
          [resource]: current[resource] + 1,
        };
      });
    },
    [
      count,
      me.resources.brick,
      me.resources.sheep,
      me.resources.stone,
      me.resources.tree,
      me.resources.wheat,
      pending,
    ],
  );

  const removeResource = (resource: ResourceType) => {
    if (pending) {
      return;
    }

    setSelection((current) => {
      if (current[resource] === 0) {
        return current;
      }

      return {
        ...current,
        [resource]: current[resource] - 1,
      };
    });
  };

  useEffect(() => {
    setInteraction("discard", {
      disabled: pending || selectedCount >= count,
      label: "the discard tray",
      onSelect: addResource,
      selected: selection,
      sourceResources: me.resources,
    });

    return () => clearInteraction("discard");
  }, [
    addResource,
    clearInteraction,
    count,
    me.resources,
    pending,
    selectedCount,
    selection,
    setInteraction,
  ]);

  return (
    <HandDockPortal>
      <section
        aria-labelledby="discard-tray-title"
        className={styles.discardTray}
        id="discard-tray"
      >
        <header className={styles.trayHeader}>
          <div>
            <p className={styles.eyebrow}>Robber discard</p>
            <h2 id="discard-tray-title">
              Return {count} resource {count === 1 ? "card" : "cards"}
            </h2>
            <p className={styles.instruction}>
              Select cards from your hand below. Remove a tray card to restore it.
            </p>
          </div>
          <div
            aria-label={`${selectedCount} of ${count} resource cards selected`}
            className={styles.progress}
          >
            <strong>
              {selectedCount}/{count}
            </strong>
            <span>selected</span>
          </div>
        </header>

        <div className={styles.trayContent}>
          <div aria-label="Cards selected to discard" className={styles.selectedCards} role="list">
            {selectedResources.length === 0 ? (
              <p className={styles.emptyTray}>Tap a card in your hand to move it here.</p>
            ) : (
              selectedResources.map((resource) => (
                <div className={styles.selectedCard} key={resource} role="listitem">
                  <div className={styles.cardFace}>
                    <Image
                      alt=""
                      className={styles.cardImage}
                      draggable={false}
                      height={768}
                      sizes="2.7rem"
                      src={RESOURCE_CARD_ASSET_PATHS[resource]}
                      width={512}
                    />
                    <span aria-hidden="true" className={styles.quantity}>
                      {selection[resource]}
                    </span>
                  </div>
                  <Button
                    aria-label={`Return one ${RESOURCE_LABELS[resource]} from the discard tray to your hand`}
                    className={styles.removeButton}
                    isDisabled={pending}
                    isIconOnly
                    onPress={() => removeResource(resource)}
                    variant="tertiary"
                  >
                    −
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className={styles.trayActions}>
            <p aria-live="polite" id="discard-tray-status">
              {remainingCount === 0
                ? "Ready to return."
                : `Choose ${remainingCount} more ${remainingCount === 1 ? "card" : "cards"}.`}
            </p>
            <Button
              aria-describedby="discard-tray-status"
              className={styles.confirmButton}
              isDisabled={pending || selectedCount !== count}
              isPending={pending}
              onPress={() =>
                onCommand({ kind: "discard", resources: selection }, "Resources returned.")
              }
            >
              {pending ? "Returning…" : `Return ${count}`}
            </Button>
          </div>
        </div>
      </section>
    </HandDockPortal>
  );
}
