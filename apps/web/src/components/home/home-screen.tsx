"use client";

import { DEFAULT_BASE_GAME_SETTINGS } from "@catansaga/game";
import { Button, Input, Label, Modal, TextField } from "@heroui/react";
import { Bot, Gamepad2, LogOut, Sparkles, Users } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import {
  LobbySettings,
  type BotCount,
  type LobbySettingsValue,
} from "@/components/lobby/lobby-settings";
import { Brand } from "@/components/ui/brand";
import { LiveMessage } from "@/components/ui/live-message";
import type { PendingAction } from "@/lib/app/pending-action";
import { isRoomCode, normalizeRoomCode } from "@/lib/session";

export interface HomeScreenProps {
  accountLabel: string;
  displayName: string;
  error: string;
  onCreateRoom(): Promise<void>;
  onDisplayNameChange(value: string): void;
  onJoinRoom(code: string): Promise<void>;
  onQuickPlay(value: LobbySettingsValue): Promise<void>;
  onSignOut(): Promise<void | null>;
  pendingAction: PendingAction;
}

export function HomeScreen({
  accountLabel,
  displayName,
  error,
  onCreateRoom,
  onDisplayNameChange,
  onJoinRoom,
  onQuickPlay,
  onSignOut,
  pendingAction,
}: HomeScreenProps) {
  const [joinCode, setJoinCode] = useState("");
  const [showBotSetup, setShowBotSetup] = useState(false);
  const [quickSettings, setQuickSettings] = useState<LobbySettingsValue>({
    botCount: 3,
    botDifficulty: "medium",
    settings: { ...DEFAULT_BASE_GAME_SETTINGS },
  });
  const isPending = pendingAction !== null;

  return (
    <main className="home-page" id="main-content">
      <div className="home-backdrop" aria-hidden="true">
        <Image
          alt=""
          className="home-scenery"
          fill
          priority
          sizes="100vw"
          src="/home-assets/island-bay-v1.webp"
        />
      </div>

      <header className="site-header">
        <Brand />
        <div className="home-header-actions">
          <span className="status-pill">
            <span aria-hidden="true" className="status-dot" /> {accountLabel}
          </span>
          <Button
            className="button button-quiet home-sign-out"
            isPending={pendingAction === "signout"}
            onPress={() => void onSignOut()}
          >
            <LogOut aria-hidden="true" /> Sign Out
          </Button>
        </div>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={16} aria-hidden="true" /> A New Island Every Game
          </p>
          <h1>Build Boldly. Trade Wisely. Rule the Island.</h1>
          <p className="hero-description">
            A polished three- or four-player strategy game with quick turns, friendly bots, and a
            board made for every screen.
          </p>
          <ul className="feature-row" aria-label="Game features">
            <li>
              <Users aria-hidden="true" /> 3–4 Players
            </li>
            <li>
              <Bot aria-hidden="true" /> Smart Bots
            </li>
            <li>
              <Gamepad2 aria-hidden="true" /> 10-Point Game
            </li>
          </ul>
        </div>

        <div className="play-card">
          <div className="play-card-heading">
            <p className="eyebrow">Your Seat</p>
            <h2>Choose Your Voyage</h2>
            <p>Set your name, then pick how you want to reach the island.</p>
          </div>

          <TextField
            fullWidth
            name="displayName"
            onChange={onDisplayNameChange}
            value={displayName}
          >
            <Label className="field-label">Display Name</Label>
            <Input
              autoComplete="off"
              className="text-input"
              id="display-name"
              maxLength={24}
              placeholder="Example: River Fox…"
              spellCheck={false}
            />
          </TextField>

          <form
            className="join-code-form"
            id="join-room-form"
            onSubmit={(event) => {
              event.preventDefault();
              void onJoinRoom(joinCode);
            }}
          >
            <TextField
              name="roomCode"
              onChange={(value) => setJoinCode(normalizeRoomCode(value))}
              value={joinCode}
            >
              <Label className="field-label">Friend Room Code</Label>
              <Input
                autoComplete="off"
                className="text-input code-input"
                id="room-code"
                inputMode="text"
                maxLength={6}
                placeholder="Room code…"
                spellCheck={false}
              />
            </TextField>
          </form>

          <div aria-label="Ways to play" className="home-menu-grid" role="group">
            <Button
              aria-controls="bot-setup-dialog"
              aria-expanded={showBotSetup}
              aria-haspopup="dialog"
              className="home-menu-tile home-menu-quick"
              isDisabled={isPending || !displayName.trim()}
              onPress={() => setShowBotSetup(true)}
              variant="ghost"
            >
              <span className="home-menu-art">
                <Image
                  alt=""
                  aria-hidden="true"
                  height={512}
                  src="/home-assets/menu/quick-match.png"
                  width={512}
                />
              </span>
              <strong>{pendingAction === "quick" ? "Preparing…" : "Quick Match"}</strong>
              <small>Customize 2–3 bots</small>
            </Button>

            <Button
              className="home-menu-tile home-menu-host"
              isDisabled={isPending || !displayName.trim()}
              onPress={onCreateRoom}
              variant="ghost"
            >
              <span className="home-menu-art">
                <Image
                  alt=""
                  aria-hidden="true"
                  height={512}
                  src="/home-assets/menu/host-island.png"
                  width={512}
                />
              </span>
              <strong>{pendingAction === "create" ? "Opening…" : "Host Island"}</strong>
              <small>Create a private room</small>
            </Button>

            <Button
              className="home-menu-tile home-menu-join"
              isDisabled={isPending || !isRoomCode(joinCode) || !displayName.trim()}
              form="join-room-form"
              type="submit"
              variant="ghost"
            >
              <span className="home-menu-art">
                <Image
                  alt=""
                  aria-hidden="true"
                  height={512}
                  src="/home-assets/menu/join-crew.png"
                  width={512}
                />
              </span>
              <strong>{pendingAction === "join" ? "Joining…" : "Join Crew"}</strong>
              <small>Use a friend code</small>
            </Button>
          </div>

          <LiveMessage message={error} />
        </div>
      </section>

      <Modal>
        <Modal.Backdrop
          className="setup-backdrop"
          isDismissable={!isPending}
          isKeyboardDismissDisabled={isPending}
          isOpen={showBotSetup}
          onOpenChange={(isOpen) => {
            if (!isOpen && !isPending) {
              setShowBotSetup(false);
            }
          }}
        >
          <Modal.Container>
            <Modal.Dialog className="setup-dialog" id="bot-setup-dialog">
              <Modal.Header className="setup-dialog-header">
                <div>
                  <p className="eyebrow">Bot Game</p>
                  <Modal.Heading id="bot-setup-title">Set Up Your Table</Modal.Heading>
                  <p id="bot-setup-description">
                    Pick the standard rules and bot challenge before the island is built.
                  </p>
                </div>
                <Button
                  aria-label="Close bot game setup"
                  className="setup-close"
                  isDisabled={isPending}
                  isIconOnly
                  onPress={() => setShowBotSetup(false)}
                  variant="ghost"
                >
                  ×
                </Button>
              </Modal.Header>
              <Modal.Body className="setup-dialog-body">
                <LobbySettings
                  botCount={quickSettings.botCount}
                  botDifficulty={quickSettings.botDifficulty}
                  disabled={isPending}
                  humanCount={1}
                  minBotCount={2}
                  onChange={(value) =>
                    setQuickSettings((current) => normalizeQuickSettings(current, value))
                  }
                  settings={quickSettings.settings}
                />
              </Modal.Body>
              <p className="setup-note">
                Bot games fill every open seat: choose two bots for a 3-player table or three bots
                for a 4-player table.
              </p>
              <Modal.Footer>
                <Button
                  className="button button-primary button-large setup-start"
                  isDisabled={isPending}
                  isPending={pendingAction === "quick"}
                  onPress={() => void onQuickPlay(quickSettings)}
                >
                  <Bot aria-hidden="true" />
                  {pendingAction === "quick" ? "Building the Island…" : "Start Bot Game"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </main>
  );
}

function normalizeQuickSettings(
  current: LobbySettingsValue,
  next: LobbySettingsValue,
): LobbySettingsValue {
  if (next.settings.maxPlayers !== current.settings.maxPlayers) {
    return {
      ...next,
      botCount: next.settings.maxPlayers === 4 ? 3 : 2,
    };
  }

  const botCount: BotCount = next.botCount >= 3 ? 3 : 2;
  return {
    ...next,
    botCount,
    settings: {
      ...next.settings,
      maxPlayers: botCount === 3 ? 4 : 3,
    },
  };
}
