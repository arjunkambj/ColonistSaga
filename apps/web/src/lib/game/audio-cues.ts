export const SOUND_EFFECT_PATHS = {
  action: "/sound-effects/action-feedback.mp3",
  city: "/sound-effects/city-placed.mp3",
  dice: "/sound-effects/magic-dice.mp3",
  resource: "/sound-effects/resource-change.mp3",
  robber: "/sound-effects/robber-alert.mp3",
  road: "/sound-effects/road-placed.mp3",
  settlement: "/sound-effects/settlement-placed.mp3",
  trade: "/sound-effects/trade-resolved.mp3",
  turn: "/sound-effects/your-turn.mp3",
  turnReminder: "/sound-effects/turn-reminder.mp3",
  victory: "/sound-effects/victory.mp3",
} as const;

export type SoundEffect = keyof typeof SOUND_EFFECT_PATHS;

export function getEventSound(
  kind: string,
  _sequence = 0,
  currentPhaseKind?: string,
): SoundEffect | null {
  if (kind === "place_settlement" && currentPhaseKind === "setup_road") {
    return null;
  }

  switch (kind) {
    case "roll":
      return "dice";
    case "place_road":
      return "road";
    case "place_settlement":
      return "settlement";
    case "build_city":
      return "city";
    case "move_robber":
    case "move_robber_and_steal":
      return "robber";
    case "discard":
    case "steal":
      return "resource";
    case "trade_bank":
    case "respond_trade":
      return "trade";
    case "cancel_trade":
    case "game_started":
    case "propose_trade":
      return "action";
    default:
      return null;
  }
}

export function getViewerEventSound(
  kind: string,
  sequence: number,
  currentPhaseKind: string,
  actorPlayerId: string,
  viewerPlayerId: string,
): SoundEffect | null {
  const eventSound = getEventSound(kind, sequence, currentPhaseKind);
  if (!eventSound || actorPlayerId === viewerPlayerId) {
    return eventSound;
  }

  return "action";
}

export function shouldPlayVictory(
  previousWinnerPlayerId: string | null,
  winnerPlayerId: string | null,
): boolean {
  return previousWinnerPlayerId === null && winnerPlayerId !== null;
}
