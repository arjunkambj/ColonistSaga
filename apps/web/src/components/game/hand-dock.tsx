"use client";

import type { ResourceInventory, ResourceType } from "@colonistsaga/game";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

export const HAND_DOCK_ROOT_ID = "game-hand-dock-root";

export type HandInteractionOwner = "discard" | "trade";

export interface HandInteraction {
  disabled: boolean;
  label: string;
  onSelect(resource: ResourceType): void;
  selected: Readonly<ResourceInventory>;
  sourceResources: Readonly<ResourceInventory>;
}

interface OwnedHandInteraction {
  interaction: HandInteraction;
  owner: HandInteractionOwner;
}

interface HandDockContextValue {
  clearInteraction(owner: HandInteractionOwner): void;
  interaction: HandInteraction | null;
  setInteraction(owner: HandInteractionOwner, interaction: HandInteraction): void;
}

const HandDockContext = createContext<HandDockContextValue | null>(null);

export function HandDockProvider({ children }: { children: ReactNode }) {
  const [ownedInteraction, setOwnedInteraction] = useState<OwnedHandInteraction | null>(null);

  const clearInteraction = useCallback((owner: HandInteractionOwner) => {
    setOwnedInteraction((current) => (current?.owner === owner ? null : current));
  }, []);

  const setInteraction = useCallback(
    (owner: HandInteractionOwner, interaction: HandInteraction) => {
      setOwnedInteraction({ interaction, owner });
    },
    [],
  );

  const value = useMemo<HandDockContextValue>(
    () => ({
      clearInteraction,
      interaction: ownedInteraction?.interaction ?? null,
      setInteraction,
    }),
    [clearInteraction, ownedInteraction, setInteraction],
  );

  return <HandDockContext.Provider value={value}>{children}</HandDockContext.Provider>;
}

export function useHandDock(): HandDockContextValue {
  const context = useContext(HandDockContext);
  if (!context) {
    throw new Error("useHandDock must be used inside HandDockProvider");
  }
  return context;
}

export function HandDockPortal({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRoot(document.getElementById(HAND_DOCK_ROOT_ID));
  }, []);

  return root ? createPortal(children, root) : null;
}
