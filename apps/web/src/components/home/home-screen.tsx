"use client";

import { DEFAULT_BASE_GAME_SETTINGS, type BaseGameSettings } from "@colonistsaga/game";
import { Button, Input, Label, Modal, Slider, TextField } from "@heroui/react";
import botIcon from "@iconify-icons/game-icons/robot-golem";
import diceIcon from "@iconify-icons/game-icons/rolling-dice-cup";
import houseIcon from "@iconify-icons/game-icons/house";
import closeIcon from "@iconify-icons/solar/close-circle-outline";
import logoutIcon from "@iconify-icons/solar/logout-2-outline";
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
import { AppScenery } from "@/components/ui/app-scenery";
import { Brand } from "@/components/ui/brand";
import { LiveMessage } from "@/components/ui/live-message";
import { VoyageCard } from "@/components/ui/voyage-card";
import { cleanDisplayName } from "@/lib/app/display-name";
import type { PendingAction } from "@/lib/app/pending-action";
import { toBotCount } from "@/lib/lobby/lobby-settings-model";
import { isRoomCode, normalizeRoomCode } from "@/lib/session";

import botSetupStyles from "./bot-game-setup.module.css";
import setupShellStyles from "./game-setup-shell.module.css";
import joinRoomStyles from "./join-room.module.css";
import playerSettingsStyles from "./player-settings.module.css";

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
      <AppScenery />

      <header className="site-header voyage-header">
        <Brand />
        <div className="voyage-header__tools">
          <Button
            aria-controls="player-settings-dialog"
            aria-expanded={showPlayerSettings}
            aria-haspopup="dialog"
            aria-label="Open player settings"
            className="button voyage-header__tool"
            isDisabled={isPending}
            isIconOnly
            onPress={openPlayerSettings}
            variant="ghost"
          >
            <span className="voyage-header__icon">
              <Icon aria-hidden="true" icon={settingsIcon} />
            </span>
          </Button>

          <section
            aria-label={`Player profile for ${displayName}`}
            className="voyage-profile"
          >
            <span aria-hidden="true" className="voyage-profile__avatar">
              <Image
                alt=""
                className="voyage-profile__avatar-image"
                height={128}
                src={profileImageUrl ?? "/game-assets/players/red-navigator.png"}
                width={128}
              />
            </span>
            <span className="voyage-profile__copy">
              <strong>{displayName}</strong>
              <small>{accountLabel}</small>
            </span>
            <Button
              aria-label="Sign out"
              className="button voyage-profile__sign-out"
              isDisabled={isPending && pendingAction !== "signout"}
              isIconOnly
              isPending={pendingAction === "signout"}
              onPress={() => void onSignOut()}
              variant="ghost"
            >
              <Icon aria-hidden="true" icon={logoutIcon} />
            </Button>
          </section>
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
            description="Invite friends to a private island"
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
            description="Jump in with a friend code"
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
          className={`setup-backdrop ${setupShellStyles.backdrop}`}
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
              className={`setup-dialog join-room-dialog ${setupShellStyles.dialog} ${joinRoomStyles.dialog}`}
              id="join-room-dialog"
            >
              <Modal.Header className={`setup-dialog-header ${setupShellStyles.header}`}>
                <span className={setupShellStyles.icon} aria-hidden="true">
                  <Icon icon={usersIcon} />
                </span>
                <div>
                  <p className="eyebrow">Join Crew</p>
                  <Modal.Heading>Enter a Friend Code</Modal.Heading>
                  <p id="join-room-description">
                    Ask the host for their six-character room code, then meet them at the island.
                  </p>
                </div>
                <Button
                  aria-label="Close join room"
                  className={`setup-close ${setupShellStyles.close} ${joinRoomStyles.close}`}
                  isDisabled={isPending}
                  isIconOnly
                  onPress={() => setShowJoinRoom(false)}
                  variant="ghost"
                >
                  <Icon aria-hidden="true" icon={closeIcon} />
                </Button>
              </Modal.Header>
              <Modal.Body className={`${setupShellStyles.body} ${joinRoomStyles.body}`}>
                <form
                  className={`join-code-form ${joinRoomStyles.form}`}
                  id="join-room-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void onJoinRoom(joinCode);
                  }}
                >
                  <TextField
                    aria-describedby="room-code-help"
                    className={joinRoomStyles.field}
                    fullWidth
                    name="roomCode"
                    onChange={(value) => setJoinCode(normalizeRoomCode(value))}
                    value={joinCode}
                  >
                    <Label className={`field-label ${joinRoomStyles.label}`}>
                      Friend room code
                    </Label>
                    <Input
                      autoComplete="off"
                      autoCapitalize="characters"
                      autoFocus
                      className={`text-input code-input ${joinRoomStyles.input}`}
                      id="room-code"
                      inputMode="text"
                      maxLength={6}
                      placeholder="ABC123"
                      spellCheck={false}
                    />
                    <div className={joinRoomStyles.codeProgress} aria-hidden="true">
                      {Array.from({ length: 6 }, (_, index) => (
                        <span
                          className={index < joinCode.length ? joinRoomStyles.filledCharacter : ""}
                          key={index}
                        />
                      ))}
                    </div>
                    <p className={joinRoomStyles.help} id="room-code-help">
                      {joinCode.length === 0
                        ? "Codes contain six letters or numbers."
                        : isRoomCode(joinCode)
                          ? "Code ready — you can join the crew."
                          : `${6 - joinCode.length} ${6 - joinCode.length === 1 ? "character" : "characters"} remaining.`}
                    </p>
                  </TextField>
                </form>
              </Modal.Body>
              <Modal.Footer className={`${setupShellStyles.footer} ${joinRoomStyles.footer}`}>
                <Button
                  className={`button ${setupShellStyles.secondaryAction} ${joinRoomStyles.cancel}`}
                  isDisabled={isPending}
                  onPress={() => setShowJoinRoom(false)}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  className={`button ${setupShellStyles.primaryAction} ${joinRoomStyles.join}`}
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
          className={`setup-backdrop ${setupShellStyles.backdrop}`}
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
              className={`setup-dialog ${setupShellStyles.dialog} ${playerSettingsStyles.dialog}`}
              id="player-settings-dialog"
            >
              <Modal.Header
                className={`setup-dialog-header ${setupShellStyles.header} ${playerSettingsStyles.header}`}
              >
                <div>
                  <p className="eyebrow">Player Settings</p>
                  <Modal.Heading>Your Island Name</Modal.Heading>
                  <p id="player-settings-description">
                    This is the name other players will see at the table.
                  </p>
                </div>
                <Button
                  aria-label="Close player settings"
                  className={`setup-close ${setupShellStyles.close} ${playerSettingsStyles.close}`}
                  isDisabled={isPending}
                  isIconOnly
                  onPress={cancelPlayerSettings}
                  variant="ghost"
                >
                  <Icon aria-hidden="true" icon={closeIcon} />
                </Button>
              </Modal.Header>
              <Modal.Body className={`${setupShellStyles.body} ${playerSettingsStyles.body}`}>
                <form
                  className={playerSettingsStyles.form}
                  id="player-settings-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    savePlayerSettings();
                  }}
                >
                  <TextField
                    className={playerSettingsStyles.field}
                    fullWidth
                    name="displayName"
                    onChange={setDisplayNameDraft}
                    value={displayNameDraft}
                  >
                    <Label className={playerSettingsStyles.label}>Display Name</Label>
                    <Input
                      autoComplete="off"
                      autoFocus
                      className={playerSettingsStyles.input}
                      maxLength={24}
                      placeholder="Example: River Fox…"
                      spellCheck={false}
                    />
                  </TextField>

                  <div className={playerSettingsStyles.volume}>
                    <Slider
                      className={playerSettingsStyles.slider}
                      formatOptions={{ style: "unit", unit: "percent" }}
                      maxValue={100}
                      minValue={0}
                      onChange={updateMusicVolumeDraft}
                      step={1}
                      value={musicVolumeDraft}
                    >
                      <Label className={playerSettingsStyles.volumeLabel}>
                        <Icon aria-hidden="true" icon={volumeIcon} /> Music Volume
                      </Label>
                      <Slider.Output className={playerSettingsStyles.output} />
                      <Slider.Track className={playerSettingsStyles.track}>
                        <Slider.Fill className={playerSettingsStyles.fill} />
                        <Slider.Thumb className={playerSettingsStyles.thumb} />
                      </Slider.Track>
                    </Slider>
                    <p className={playerSettingsStyles.help}>
                      Adjust the menu soundtrack volume.
                    </p>
                  </div>
                </form>
              </Modal.Body>
              <Modal.Footer
                className={`${setupShellStyles.footer} ${playerSettingsStyles.footer}`}
              >
                <Button
                  className={`button ${playerSettingsStyles.cancel}`}
                  isDisabled={isPending}
                  onPress={cancelPlayerSettings}
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  className={`button ${playerSettingsStyles.save}`}
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
          className={`setup-backdrop ${setupShellStyles.backdrop} ${botSetupStyles.backdrop}`}
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
            <Modal.Dialog
              aria-describedby="bot-setup-description"
              className={`setup-dialog ${setupShellStyles.dialog} ${botSetupStyles.dialog}`}
              id="bot-setup-dialog"
            >
              <Modal.Header
                className={`setup-dialog-header ${setupShellStyles.header} ${botSetupStyles.header}`}
              >
                <span aria-hidden="true" className={setupShellStyles.icon}>
                  <Icon icon={botIcon} />
                </span>
                <div>
                  <p className="eyebrow">Quick Match</p>
                  <Modal.Heading id="bot-setup-title">Set Up Your Table</Modal.Heading>
                  <p id="bot-setup-description">
                    Pick the standard rules and bot challenge before the island is built.
                  </p>
                </div>
                <Button
                  aria-label="Close bot game setup"
                  className={`setup-close ${setupShellStyles.close} ${botSetupStyles.close}`}
                  isDisabled={isPending}
                  isIconOnly
                  onPress={() => setShowBotSetup(false)}
                  variant="ghost"
                >
                  <Icon aria-hidden="true" icon={closeIcon} />
                </Button>
              </Modal.Header>
              <Modal.Body
                className={`setup-dialog-body ${setupShellStyles.body} ${botSetupStyles.body}`}
              >
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
              <p className={`setup-note ${botSetupStyles.note}`}>
                Bot games fill every open seat. Choose two to seven bots for a 3–8 player table.
              </p>
              <Modal.Footer className={`${setupShellStyles.footer} ${botSetupStyles.footer}`}>
                <Button
                  className={`button button-large setup-start ${setupShellStyles.primaryAction} ${botSetupStyles.start}`}
                  isDisabled={isPending}
                  isPending={pendingAction === "quick"}
                  onPress={() => void onQuickPlay(quickSettings)}
                >
                  <Icon aria-hidden="true" icon={botIcon} />
                  {pendingAction === "quick" ? "Building the Island…" : "Start Quick Match"}
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

  const botCount = toBotCount(Math.max(2, next.botCount));
  return {
    ...next,
    botCount,
    settings: {
      ...next.settings,
      maxPlayers: (botCount + 1) as BaseGameSettings["maxPlayers"],
    },
  };
}
