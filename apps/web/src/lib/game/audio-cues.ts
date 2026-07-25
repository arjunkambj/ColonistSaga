export const SOUND_EFFECT_PATHS = {
  action: "/sound-effects/action-feedback.mp3",
  piece: "/sound-effects/piece-placed.mp3",
  resource: "/sound-effects/resource-change.mp3",
  robber: "/sound-effects/robber-alert.mp3",
  trade: "/sound-effects/trade-resolved.mp3",
  turn: "/sound-effects/your-turn.mp3",
  victory: "/sound-effects/victory.mp3",
} as const;

export type SoundEffect = keyof typeof SOUND_EFFECT_PATHS;

export function getEventSound(kind: string): SoundEffect | null {
  switch (kind) {
    case "roll":
      return "action";
    case "place_road":
    case "place_settlement":
    case "build_city":
      return "piece";
    case "move_robber":
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
  actorPlayerId: string,
  viewerPlayerId: string,
  currentPhaseKind?: string,
): SoundEffect | null {
  if (kind === "end_turn" || (kind === "place_settlement" && currentPhaseKind === "setup_road")) {
    return null;
  }

  return actorPlayerId === viewerPlayerId ? getEventSound(kind) : "action";
}

export function shouldPlayVictory(
  previousWinnerPlayerId: string | null,
  winnerPlayerId: string | null,
): boolean {
  return previousWinnerPlayerId === null && winnerPlayerId !== null;
}
