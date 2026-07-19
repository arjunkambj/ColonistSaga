"use client";

import { DEFAULT_BASE_GAME_SETTINGS } from "@catansaga/game";
import { Button, Input, Label, Modal, Slider, TextField } from "@heroui/react";
import botIcon from "@iconify-icons/game-icons/robot-golem";
import diceIcon from "@iconify-icons/game-icons/rolling-dice-cup";
import houseIcon from "@iconify-icons/game-icons/house";
import closeIcon from "@iconify-icons/solar/close-circle-outline";
import giftIcon from "@iconify-icons/solar/gift-outline";
import helpIcon from "@iconify-icons/solar/question-circle-outline";
import logoutIcon from "@iconify-icons/solar/logout-outline";
import settingsIcon from "@iconify-icons/solar/settings-minimalistic-outline";
import usersIcon from "@iconify-icons/solar/users-group-rounded-outline";
import volumeIcon from "@iconify-icons/solar/volume-loud-outline";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useState } from "react";

import {
  LobbySettings,
  type BotCount,
  type LobbySettingsValue,
} from "@/components/lobby/lobby-settings";
import { Brand } from "@/components/ui/brand";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { LiveMessage } from "@/components/ui/live-message";
import { VoyageCard } from "@/components/ui/voyage-card";
import { cleanDisplayName } from "@/lib/app/display-name";
import type { PendingAction } from "@/lib/app/pending-action";
import { isRoomCode, normalizeRoomCode } from "@/lib/session";

export interface HomeScreenProps {
  accountLabel: string;
  displayName: string;
  error: string;
  musicVolume: number;
  onCreateRoom(): Promise<void>;
  onDisplayNameChange(value: string): void;
  onJoinRoom(code: string): Promise<void>;
  onMusicVolumeChange(value: number): void;
  onQuickPlay(value: LobbySettingsValue): Promise<void>;
  onSignOut(): Promise<void | null>;
  pendingAction: PendingAction;
  profileImageUrl: string | null;
}

export function HomeScreen({
  accountLabel,
  displayName,
  error,
  musicVolume,
  onCreateRoom,
  onDisplayNameChange,
  onJoinRoom,
  onMusicVolumeChange,
  onQuickPlay,
  onSignOut,
  pendingAction,
  profileImageUrl,
}: HomeScreenProps) {
  const [joinCode, setJoinCode] = useState("");
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [showBotSetup, setShowBotSetup] = useState(false);
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);
  const [homeNotice, setHomeNotice] = useState<{ description: string; title: string } | null>(null);
  const [displayNameDraft, setDisplayNameDraft] = useState(displayName);
  const [musicVolumeDraft, setMusicVolumeDraft] = useState(musicVolume);
  const [musicVolumeAtOpen, setMusicVolumeAtOpen] = useState(musicVolume);
  const [quickSettings, setQuickSettings] = useState<LobbySettingsValue>({
    botCount: 3,
    botDifficulty: "medium",
    settings: { ...DEFAULT_BASE_GAME_SETTINGS },
  });
  const isPending = pendingAction !== null;

  const openPlayerSettings = () => {
    setDisplayNameDraft(displayName);
    setMusicVolumeDraft(musicVolume);
    setMusicVolumeAtOpen(musicVolume);
    setShowPlayerSettings(true);
  };

  const savePlayerSettings = () => {
    onDisplayNameChange(cleanDisplayName(displayNameDraft));
    setShowPlayerSettings(false);
  };

  const cancelPlayerSettings = () => {
    onMusicVolumeChange(musicVolumeAtOpen);
    setShowPlayerSettings(false);
  };

  const updateMusicVolumeDraft = (value: number | number[]) => {
    const nextVolume = Array.isArray(value) ? value[0] : value;
    setMusicVolumeDraft(nextVolume);
    onMusicVolumeChange(nextVolume);
  };

  return (
    <main className="home-page voyage-home" id="main-content">
      <div className="home-backdrop voyage-home__backdrop" aria-hidden="true">
        <Image
          alt=""
          className="home-scenery voyage-home__scenery"
          fill
          priority
          sizes="100vw"
          src="/shared-assets/coastal-cove-day-v1.jpg"
        />
      </div>

      <header className="site-header voyage-header">
        <Brand />
        <div className="voyage-header__tools">
          <LiquidGlass
            className="voyage-header__decoration voyage-header__decoration--gift"
            kind="control"
            radius="md"
          >
            <Button
              aria-label="Open island rewards"
              className="voyage-header__decorative-button"
              isDisabled={isPending}
              isIconOnly
              onPress={() =>
                setHomeNotice({
                  description:
                    "Daily island rewards are being prepared and will appear here in a future update.",
                  title: "Island Rewards",
                })
              }
              variant="ghost"
            >
              <span className="voyage-header__icon">
                <Icon aria-hidden="true" icon={giftIcon} />
              </span>
              <span className="voyage-header__notification">2</span>
            </Button>
          </LiquidGlass>

          <LiquidGlass className="voyage-header__decoration" kind="control" radius="md">
            <Button
              aria-label="Open main menu help"
              className="voyage-header__decorative-button"
              isDisabled={isPending}
              isIconOnly
              onPress={() =>
                setHomeNotice({
                  description:
                    "Quick Match starts a bot table, Host Island creates a private room, and Join Crew uses a friend's six-character code.",
                  title: "Choose Your Voyage",
                })
              }
              variant="ghost"
            >
              <span className="voyage-header__icon">
                <Icon aria-hidden="true" icon={helpIcon} />
              </span>
            </Button>
          </LiquidGlass>

          <LiquidGlass className="voyage-header__control" kind="control" radius="md">
            <Button
              aria-controls="player-settings-dialog"
              aria-expanded={showPlayerSettings}
              aria-haspopup="dialog"
              aria-label="Open player settings"
              className="voyage-header__button"
              isDisabled={isPending}
              isIconOnly
              onPress={openPlayerSettings}
              variant="ghost"
            >
              <Icon aria-hidden="true" icon={settingsIcon} />
            </Button>
          </LiquidGlass>

          <LiquidGlass
            aria-label={`Player profile for ${displayName}`}
            as="section"
            className="voyage-profile"
            kind="panel"
            radius="md"
          >
            <span aria-hidden="true" className="voyage-profile__avatar">
              <Image
                alt=""
                className="voyage-profile__avatar-image"
                height={128}
                src={profileImageUrl ?? "/game-assets/players/red-navigator-v1.png"}
                width={128}
              />
            </span>
            <span className="voyage-profile__copy">
              <strong>{displayName}</strong>
              <small>{accountLabel}</small>
            </span>
            <Button
              aria-label="Sign out"
              className="voyage-profile__sign-out"
              isDisabled={isPending && pendingAction !== "signout"}
              isIconOnly
              isPending={pendingAction === "signout"}
              onPress={() => void onSignOut()}
              variant="ghost"
            >
              <Icon aria-hidden="true" icon={logoutIcon} />
            </Button>
          </LiquidGlass>
        </div>
      </header>

      <section aria-labelledby="voyage-heading" className="voyage-stage">
        <h1 className="sr-only" id="voyage-heading">
          Choose your voyage
        </h1>
        <div aria-label="Ways to play" className="voyage-card-grid" role="group">
          <VoyageCard
            actionLabel="Set up a quick match"
            badge={<Icon icon={diceIcon} />}
            description="Play instantly with bots or players"
            disabled={isPending || !displayName.trim()}
            imageSrc="/home-assets/menu/quick-match.png"
            onPress={() => setShowBotSetup(true)}
            pending={pendingAction === "quick"}
            title="Quick Match"
            tone="quick"
          />
          <VoyageCard
            actionLabel="Create a private room"
            badge={<Icon icon={houseIcon} />}
            description="Create a private room"
            disabled={isPending || !displayName.trim()}
            imageSrc="/home-assets/menu/host-island.png"
            onPress={() => void onCreateRoom()}
            pending={pendingAction === "create"}
            title="Host Island"
            tone="host"
          />
          <VoyageCard
            actionLabel="Enter a friend room code"
            badge={<Icon icon={usersIcon} />}
            description="Enter a friend code"
            disabled={isPending || !displayName.trim()}
            imageSrc="/home-assets/menu/join-crew.png"
            onPress={() => setShowJoinRoom(true)}
            pending={pendingAction === "join"}
            title="Join Crew"
            tone="join"
          />
        </div>
        <LiveMessage message={error} />
      </section>

      <Modal>
        <Modal.Backdrop
          className="setup-backdrop"
          isOpen={homeNotice !== null}
          onOpenChange={(isOpen) => (isOpen ? undefined : setHomeNotice(null))}
        >
          <Modal.Container>
            <Modal.Dialog
              aria-describedby="home-notice-description"
              className="setup-dialog home-notice-dialog"
            >
              <Modal.Header className="setup-dialog-header">
                <div>
                  <p className="eyebrow">Island Guide</p>
                  <Modal.Heading>{homeNotice?.title ?? "Catansaga"}</Modal.Heading>
                  <p id="home-notice-description">{homeNotice?.description}</p>
                </div>
                <Button
                  aria-label="Close island guide"
                  className="setup-close"
                  isIconOnly
                  onPress={() => setHomeNotice(null)}
                  variant="ghost"
                >
                  <Icon aria-hidden="true" icon={closeIcon} />
                </Button>
              </Modal.Header>
              <Modal.Footer>
                <Button className="button button-primary" onPress={() => setHomeNotice(null)}>
                  Got It
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop
          className="setup-backdrop"
          isDismissable={!isPending}
          isKeyboardDismissDisabled={isPending}
          isOpen={showJoinRoom}
          onOpenChange={(isOpen) => {
            if (!isOpen && !isPending) {
              setShowJoinRoom(false);
            }
          }}
        >
          <Modal.Container>
            <Modal.Dialog
              aria-describedby="join-room-description"
              className="setup-dialog join-room-dialog"
              id="join-room-dialog"
            >
              <Modal.Header className="setup-dialog-header">
                <div>
                  <p className="eyebrow">Join Crew</p>
                  <Modal.Heading>Enter a Friend Code</Modal.Heading>
                  <p id="join-room-description">
                    Ask the host for their six-character room code, then meet them at the island.
                  </p>
                </div>
                <Button
                  aria-label="Close join room"
                  className="setup-close"
                  isDisabled={isPending}
                  isIconOnly
                  onPress={() => setShowJoinRoom(false)}
                  variant="ghost"
                >
                  <Icon aria-hidden="true" icon={closeIcon} />
                </Button>
              </Modal.Header>
              <Modal.Body>
                <form
                  className="join-code-form"
                  id="join-room-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void onJoinRoom(joinCode);
                  }}
                >
                  <TextField
                    fullWidth
                    name="roomCode"
                    onChange={(value) => setJoinCode(normalizeRoomCode(value))}
                    value={joinCode}
                  >
                    <Label className="field-label">Friend Room Code</Label>
                    <Input
                      autoComplete="off"
                      autoFocus
                      className="text-input code-input"
                      id="room-code"
                      inputMode="text"
                      maxLength={6}
                      placeholder="Room code…"
                      spellCheck={false}
                    />
                  </TextField>
                </form>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  className="button button-quiet"
                  isDisabled={isPending}
                  onPress={() => setShowJoinRoom(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  className="button button-primary"
                  form="join-room-form"
                  isDisabled={isPending || !isRoomCode(joinCode) || !displayName.trim()}
                  isPending={pendingAction === "join"}
                  type="submit"
                >
                  {pendingAction === "join" ? "Joining…" : "Join Crew"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Modal.Backdrop
          className="setup-backdrop"
          isDismissable={!isPending}
          isKeyboardDismissDisabled={isPending}
          isOpen={showPlayerSettings}
          onOpenChange={(isOpen) => {
            if (!isOpen && !isPending) {
              cancelPlayerSettings();
            }
          }}
        >
          <Modal.Container>
            <Modal.Dialog
              aria-describedby="player-settings-description"
              className="setup-dialog player-settings-dialog"
              id="player-settings-dialog"
            >
              <Modal.Header className="setup-dialog-header">
                <div>
                  <p className="eyebrow">Player Settings</p>
                  <Modal.Heading>Your Island Name</Modal.Heading>
                  <p id="player-settings-description">
                    This is the name other players will see at the table.
                  </p>
                </div>
                <Button
                  aria-label="Close player settings"
                  className="setup-close"
                  isDisabled={isPending}
                  isIconOnly
                  onPress={cancelPlayerSettings}
                  variant="ghost"
                >
                  <Icon aria-hidden="true" icon={closeIcon} />
                </Button>
              </Modal.Header>
              <Modal.Body>
                <form
                  className="player-settings-form"
                  id="player-settings-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    savePlayerSettings();
                  }}
                >
                  <TextField
                    fullWidth
                    name="displayName"
                    onChange={setDisplayNameDraft}
                    value={displayNameDraft}
                  >
                    <Label className="field-label">Display Name</Label>
                    <Input
                      autoComplete="off"
                      className="text-input"
                      maxLength={24}
                      placeholder="Example: River Fox…"
                      spellCheck={false}
                    />
                  </TextField>

                  <div className="music-volume-setting">
                    <Slider
                      className="music-volume-slider"
                      formatOptions={{ style: "unit", unit: "percent" }}
                      maxValue={100}
                      minValue={0}
                      onChange={updateMusicVolumeDraft}
                      step={1}
                      value={musicVolumeDraft}
                    >
                      <Label className="field-label music-volume-label">
                        <Icon aria-hidden="true" icon={volumeIcon} /> Music Volume
                      </Label>
                      <Slider.Output className="music-volume-output" />
                      <Slider.Track className="music-volume-track">
                        <Slider.Fill className="music-volume-fill" />
                        <Slider.Thumb className="music-volume-thumb" />
                      </Slider.Track>
                    </Slider>
                    <p>Adjust the menu soundtrack volume.</p>
                  </div>
                </form>
              </Modal.Body>
              <Modal.Footer className="player-settings-actions">
                <Button
                  className="button button-quiet"
                  isDisabled={isPending}
                  onPress={cancelPlayerSettings}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  className="button button-primary"
                  form="player-settings-form"
                  isDisabled={isPending || !displayNameDraft.trim()}
                  type="submit"
                >
                  Save Settings
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

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
                  <Icon aria-hidden="true" icon={botIcon} />
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
      botCount: (next.settings.maxPlayers - 1) as BotCount,
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
