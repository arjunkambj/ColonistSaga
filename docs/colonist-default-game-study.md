# Colonist default-game study

## Scope

This study is limited to the four-player Base game and its single default
19-hex layout. Alternate maps, expansions, five-to-eight-player layouts, and
ranked modes are deliberately outside the Catansaga v1 scope.

## Verified flow

1. A room starts with one host seat and three open seats. Each open seat can be
   filled by a guest or an Easy, Medium, or Hard bot.
2. The room exposes Base mode and Base map as separate selections. Catansaga v1
   fixes both selections and does not persist a layout choice.
3. Starting the tested Base room created the standard 19-land-hex island with
   nine ports and four player colors.
4. Setup proceeds in settlement-then-road pairs. The game log records each
   placement, the board shows the current setup instruction, and player panels
   show victory points, development-card count, resource-card count, army, and
   road length.
5. The tested room used a two-minute setup timer even though its normal turn
   timer was set to 60 seconds. Catansaga therefore models the two timers
   separately.
6. Disconnecting leaves the match recoverable. The game log announces the
   disconnect, warns that a bot will take over on the next turn, and announces
   a successful reconnect. A persistent reconnect banner is shown outside the
   match.
7. The match keeps the board, contextual action bar, timer, game log/chat, bank
   counts, opponent summaries, and the current player's private hand visible
   as separate presentation regions.

## Verified custom-room settings

The Base room exposed these settings:

- Private Game
- Hide Bank Cards
- Friendly Robber
- Balanced Dice
- No Trolls
- Turn Timer
- Max Players
- Points to Win, shown as a 3-20 range with a default of 10
- Card Discard Limit, shown as a 5-20 range with a default of 7

The observed test configuration was public, four-player Base, Friendly Robber
enabled, Balanced Dice enabled, 60-second normal turns, 10 points to win, and a
discard limit of seven. It successfully started with three bots on the default
Base board.

## Catansaga implications

- Keep one canonical server state and a typed, append-only ordered event ledger.
- Require an expected action number and client action ID for idempotent turn
  mutations.
- Keep shuffled decks and deterministic random state in a server-only table.
- Return filtered player views so resource and development-card contents stay
  private while public counts remain reactive.
- Store room membership separately from game-player snapshots so the lobby can
  change safely while a started match remains reproducible.
- Track connection state and bot takeover explicitly; reconnecting must never
  create a second player seat.
- Render numbers, ratios, counts, labels, highlights, and player colors in code.
  Generated art should not contain gameplay text or baked-in color information.

## Independent replay limitation

An independent review agent was assigned a second Colonist playthrough. Its
browser backend was unavailable, so it correctly declined to invent live
observations. That agent remains suitable for the independent visual review of
the generated files, which does not require browser access.
