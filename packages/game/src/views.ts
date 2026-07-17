import { getLegalActions } from "./rules";
import { totalResources } from "./resources";
import type { GameState, PlayerGameView, PlayerId, PlayerViewState } from "./types";

export function toPlayerView(state: GameState, viewerPlayerId: PlayerId): PlayerGameView {
  if (!state.players.some((player) => player.id === viewerPlayerId)) {
    throw new Error(`Unknown viewer: ${viewerPlayerId}`);
  }

  const {
    balancedDiceBag: _balancedDiceBag,
    bank,
    randomIndex: _randomIndex,
    seed: _seed,
    players,
    ...publicState
  } = state;
  const playerViews: PlayerViewState[] = players.map((player) => {
    const resourceCount = totalResources(player.resources);

    return player.id === viewerPlayerId
      ? { ...player, isViewer: true, resourceCount }
      : {
          displayName: player.displayName,
          id: player.id,
          isBot: player.isBot,
          isViewer: false,
          piecesRemaining: { ...player.piecesRemaining },
          resourceCount,
          seatIndex: player.seatIndex,
          victoryPoints: player.victoryPoints,
        };
  });

  return {
    ...publicState,
    bank: state.settings.hideBankCards ? null : { ...bank },
    legalActions: getLegalActions(state, viewerPlayerId),
    players: playerViews,
    viewerPlayerId,
  };
}
