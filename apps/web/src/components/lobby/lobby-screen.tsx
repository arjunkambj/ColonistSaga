"use client";

import type { BaseGameSettings } from "@catansaga/game";
import { Button } from "@heroui/react";
import botIcon from "@iconify-icons/game-icons/robot-golem";
import crownIcon from "@iconify-icons/game-icons/crown";
import gamepadIcon from "@iconify-icons/game-icons/gamepad";
import checkIcon from "@iconify-icons/solar/check-circle-outline";
import copyIcon from "@iconify-icons/solar/copy-outline";
import logoutIcon from "@iconify-icons/solar/logout-outline";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Brand } from "@/components/ui/brand";
import { LiveMessage } from "@/components/ui/live-message";
import type { PendingAction } from "@/lib/app/pending-action";
import type { RoomView } from "@/lib/game/types";

import { LobbySettings, type BotCount, type LobbySettingsValue } from "./lobby-settings";

type LobbyConfirmation =
  | { kind: "leave" }
  | { displayName: string; kind: "replace"; targetSeatId: string };

export interface LobbyScreenProps {
  error: string;
  onLeave(): Promise<void>;
  onReplacePlayer(targetSeatId: string): Promise<void>;
  onSaveSettings(value: LobbySettingsValue): Promise<void>;
  onStart(): Promise<void>;
  pendingAction: PendingAction;
  room: RoomView;
}

export function LobbyScreen({
  error,
  onLeave,
  onReplacePlayer,
  onSaveSettings,
  onStart,
  pendingAction,
  room,
}: LobbyScreenProps) {
  const [copied, setCopied] = useState(false);
  const [confirmation, setConfirmation] = useState<LobbyConfirmation | null>(null);
  const botCount = room.members.filter((member) => member.controller === "bot").length as BotCount;
  const [settingsDraft, setSettingsDraft] = useState<LobbySettingsValue>(() => ({
    botCount,
    botDifficulty: room.botDifficulty,
    settings: room.settings,
  }));
  const seats = Array.from({ length: room.settings.maxPlayers }, (_, index) =>
    room.members.find((member) => member.seatIndex === index),
  );
  const humanCount = room.members.length - botCount;
  const settingsAreSaved = sameLobbySettings(settingsDraft, room);
  const tableIsFull = room.members.length === room.settings.maxPlayers;
  const startHint = !settingsAreSaved
    ? "Save game settings before starting."
    : !tableIsFull
      ? `Fill all ${room.settings.maxPlayers} seats with players or bots before starting.`
      : "";

  useEffect(() => {
    setSettingsDraft({
      botCount,
      botDifficulty: room.botDifficulty,
      settings: room.settings,
    });
  }, [
    botCount,
    room.botDifficulty,
    room.settings.balancedDice,
    room.settings.discardLimit,
    room.settings.friendlyRobber,
    room.settings.hideBankCards,
    room.settings.map,
    room.settings.maxPlayers,
    room.settings.turnTimerSeconds,
    room.settings.victoryPoints,
  ]);

  const runConfirmedAction = async () => {
    if (!confirmation) {
      return;
    }
    if (confirmation.kind === "leave") {
      await onLeave();
    } else {
      await onReplacePlayer(confirmation.targetSeatId);
    }
    setConfirmation(null);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="lobby-page" id="main-content">
      <header className="site-header lobby-header">
        <Brand />
        <Button
          className="button button-quiet"
          isDisabled={pendingAction !== null}
          onPress={() => setConfirmation({ kind: "leave" })}
          variant="ghost"
        >
          <Icon aria-hidden="true" icon={logoutIcon} />
          {pendingAction === "leave" ? "Leaving…" : "Leave Room"}
        </Button>
      </header>

      <section className="lobby-card" aria-labelledby="lobby-title">
        <p className="eyebrow">Private Base Game</p>
        <h1 id="lobby-title">Gather Your Crew</h1>
        <p>Share this room code, then configure every open seat before starting.</p>

        <Button
          aria-label={`Copy room code ${room.code}`}
          className="invite-code"
          onPress={copyCode}
          variant="ghost"
        >
          <span translate="no">{room.code}</span>
          <Icon aria-hidden="true" icon={copied ? checkIcon : copyIcon} />
          <small aria-live="polite">{copied ? "Copied" : "Copy Code"}</small>
        </Button>

        <ol className="seat-grid" aria-label="Player seats">
          {seats.map((member, index) => (
            <li
              className={`seat-card ${member ? `player-${member.playerColor}` : "seat-empty"}`}
              key={member?.id ?? `open-seat-${index}`}
            >
              <span className="seat-avatar" aria-hidden="true">
                {member ? member.displayName.slice(0, 1).toUpperCase() : index + 1}
              </span>
              <div>
                <strong>{member?.displayName ?? "Open Seat"}</strong>
                <span>
                  {member?.role === "host" ? (
                    <>
                      <Icon aria-hidden="true" icon={crownIcon} /> Host
                    </>
                  ) : member ? (
                    "Ready"
                  ) : (
                    "Configure a player or bot seat"
                  )}
                </span>
              </div>
              {room.isHost && member?.controller === "player" && member.role !== "host" ? (
                <Button
                  aria-label={`Replace ${member.displayName} with a bot`}
                  className="seat-kick"
                  isDisabled={pendingAction !== null}
                  onPress={() =>
                    setConfirmation({
                      displayName: member.displayName,
                      kind: "replace",
                      targetSeatId: member.id,
                    })
                  }
                  variant="secondary"
                >
                  <Icon aria-hidden="true" icon={botIcon} />
                  {pendingAction === "replace" ? "Replacing…" : "Use Bot"}
                </Button>
              ) : null}
            </li>
          ))}
        </ol>

        <LobbySettings
          botCount={settingsDraft.botCount}
          botDifficulty={settingsDraft.botDifficulty}
          disabled={!room.isHost || pendingAction !== null}
          humanCount={humanCount}
          onChange={setSettingsDraft}
          settings={settingsDraft.settings}
        />

        {room.isHost ? (
          <Button
            className="button button-secondary lobby-save-settings"
            isDisabled={pendingAction !== null || settingsAreSaved}
            isPending={pendingAction === "settings"}
            onPress={() => void onSaveSettings(settingsDraft)}
            variant="secondary"
          >
            {pendingAction === "settings" ? "Saving Settings…" : "Save Game Settings"}
          </Button>
        ) : null}

        {room.isHost ? (
          <>
            {startHint ? (
              <p className="lobby-start-hint" id="start-game-hint">
                {startHint}
              </p>
            ) : null}
            <Button
              aria-describedby={startHint ? "start-game-hint" : undefined}
              className="button button-primary button-large"
              isDisabled={pendingAction !== null || Boolean(startHint)}
              isPending={pendingAction === "start"}
              onPress={onStart}
            >
              <Icon aria-hidden="true" icon={gamepadIcon} />
              {pendingAction === "start" ? "Building the Island…" : "Start Game"}
            </Button>
          </>
        ) : (
          <p className="waiting-callout" role="status">
            Waiting for the host to start…
          </p>
        )}
        <LiveMessage message={error} />
      </section>
      {confirmation ? (
        <ConfirmationDialog
          busy={pendingAction !== null}
          confirmLabel={confirmation.kind === "leave" ? "Leave Room" : "Use Bot"}
          description={
            confirmation.kind === "leave"
              ? room.isHost
                ? "Leaving now closes this waiting room for everyone in it."
                : "Leaving now frees your seat for another player or bot."
              : `${confirmation.displayName} will immediately lose control of this seat, and a bot will take over.`
          }
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void runConfirmedAction()}
          title={confirmation.kind === "leave" ? "Leave this room?" : "Replace this player?"}
        />
      ) : null}
    </main>
  );
}

function sameLobbySettings(value: LobbySettingsValue, room: RoomView): boolean {
  const roomBotCount = room.members.filter((member) => member.controller === "bot").length;
  return (
    value.botCount === roomBotCount &&
    value.botDifficulty === room.botDifficulty &&
    Object.entries(value.settings).every(
      ([key, setting]) => room.settings[key as keyof BaseGameSettings] === setting,
    )
  );
}
