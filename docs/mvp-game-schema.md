# Catansaga MVP game schema

## Scope

The MVP implements one four-player Base game on the canonical 19-hex board. Custom layouts, development cards, player-to-player offers, awards, chat, timers, rankings, and expansions are intentionally deferred.

## Authoritative game state

`@catansaga/game` owns the JSON-serializable state and every rule transition. Convex stores that state as private JSON and exposes a filtered viewer-specific projection.

| Area     | Key fields                                                     | Invariant                                                                                              |
| -------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Identity | `version`, `seed`, `randomIndex`, `actionNumber`               | Random state is server-only; every accepted command increases the action number.                       |
| Turn     | `status`, `phase`, `activePlayerId`, `turnNumber`, `turnOrder` | Exactly one phase controls which players may act.                                                      |
| Board    | 19 tiles, 54 vertices, 72 edges, 9 ports                       | Tiles use the fixed flat-top radius-two topology.                                                      |
| Pieces   | buildings, roads, robber tile                                  | One building per vertex and one road per edge.                                                         |
| Players  | seat, bot flag, resources, remaining pieces, VP                | Resources are private; public views expose only opponent totals.                                       |
| Bank     | five resource inventories                                      | State transitions conserve bank plus player cards. Exact bank composition is not sent to player views. |
| Result   | 10-point target and nullable winner                            | A winner completes immediately; the high safety turn limit completes as a draw.                        |

The five resource keys are `tree`, `brick`, `sheep`, `wheat`, and `stone`. Desert is terrain, not a sixth resource.

## Phases and commands

```text
setup_settlement -> setup_road -> ...snake setup...
roll -> build_and_trade -> end_turn
roll(7) -> discard? -> move_robber -> steal? -> build_and_trade
victory or safety turn limit -> finished
```

The public reducer accepts these commands:

- `place_settlement { vertexKey }`
- `place_road { edgeKey }`
- `roll`
- `discard { resources }`
- `move_robber { tileId }`
- `steal { victimPlayerId }`
- `build_city { vertexKey }`
- `trade_bank { give, receive }`
- `end_turn`

All commands validate the required actor, phase, runtime input, location, resources, bank supply, connectivity, piece supply, and victory state before returning a new immutable state.

Bank trades use the best port owned by the player: 2:1 for a matching resource port, 3:1 for an any-resource port, and 4:1 otherwise. Port ownership comes from a settlement or city on either endpoint of its coastal edge.

## Convex persistence

| Table            | Purpose                                            | Important indexes                    |
| ---------------- | -------------------------------------------------- | ------------------------------------ |
| `mvpRooms`       | Invite code, host, lifecycle, linked game          | room code; status/update time        |
| `mvpSeats`       | Stable guest seat or bot controller                | room; room/session; room/seat index  |
| `mvpGames`       | Private serialized state and revision              | room; status/update time             |
| `mvpGameActions` | Idempotency record and ordered player-facing event | game/revision; game/client action ID |

Public Convex operations create, join, start, read, leave, recover, and command a room. Mutations validate membership and host authority. Gameplay commands include an expected action number and a unique client action ID, so stale writes are rejected and retries are safe.

## Player-view boundary

Each client receives only `PlayerGameView`:

- its own exact resource inventory;
- opponents' resource totals, pieces, seats, bot flags, and victory points;
- public board, phase, dice, and legal actions;
- no game seed or random index;
- no opponents' resource composition;
- no exact bank composition.

The web client renders legal targets from this projection and cannot authoritatively change state locally.
