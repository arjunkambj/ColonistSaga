# ColonistSaga lean audio scope

## Decision

The current game ships one optional music loop and no sound effects. One
low-fatigue gameplay loop and eight reusable effects remain in the production
queue; the board, turn ownership, errors, timers, and results already
communicate completely through visible, accessible UI. More music and a large
effects library would add cost, implementation work, and cognitive noise before
the underlying playback system exists.

## Shipped music

| Asset | Runtime file | Use | Format |
| --- | --- | --- | --- |
| Home music | `apps/web/public/music/main-loby-music.mp3` | Signed-in home screen, after a user gesture | Stereo MP3, 44.1 kHz, 256 kbps |

The player controls this loop with the existing Music Volume setting.

## Required next music

| Asset | Use | Requirement |
| --- | --- | --- |
| In-game ambience | Normal turns: dice, resources, building, and trade | One optional 120–150 second, low-fatigue instrumental loop with no dramatic rise or result cue |

Its generation request is in
[`docs/audio/music-generation-manifest.json`](music-generation-manifest.json).

The authentication, lobby, and results screens stay quiet. Do not add
alternate, setup-specific, robber, winner, loss, or draw tracks unless research
shows that the in-game loop cannot satisfy a new player need.

## Future sound effects: eight reusable cues

Implement these only alongside a sound-effects preference and a confirmed
playback system. Each cue needs a visual equivalent; no rule state may rely on
audio.

| Cue | Covers | Requirement |
| --- | --- | --- |
| Interface press | Buttons, tabs, steppers, toggles | Short, quiet, optional local feedback |
| Action feedback | Confirmed action or invalid action | Use only after confirmed state for game actions |
| Your turn | Required actor changes to the viewer | Play once per handoff, never during replay or reconnect |
| Dice result | Confirmed roll total | One compact roll-and-settle cue, no pre-result loop |
| Resource change | Viewer gains or loses a bundle | One cue per state change, not one per resource type |
| Piece placed | Road, settlement, city | One shared placement cue |
| Robber alert | Seven, discard, robber sequence | Brief and informative, never alarming |
| Trade resolved | Bank or player trade completed | Confirm the final state, not every offer or cancellation |

Use isolated 48 kHz, 24-bit WAV source files and a compressed runtime copy.
Keep UI cues mono, under 700 ms, and free of music, speech, casino tones, or
long reverb. A single subtle variant per cue is sufficient at this stage.

## Explicitly out of scope

- alternate home, lobby, setup, midgame, robber, winner, loss, and draw music;
- per-resource, per-piece, modal, lobby-seat, timer, connection, and result
  effects;
- countdown ticks, ambient ocean loops, and transition flourishes;
- a sound for every optimistic click or repeated server-state update.

These cuts preserve focus during strategic play and avoid duplicate feedback:
the UI already supplies state labels, live messages, action availability,
timer text, and connection notices.

## Playback guardrails

- Start music only after a user gesture; persist the music preference locally.
- Add separate Sound Effects and Mute All controls before any effect ships.
- Never replay an effect when a reconnect restores existing state.
- Do not layer more than one effect for a single confirmed game event.
- Respect reduced-sensory preferences by allowing all effects to be disabled
  while retaining the existing visual feedback.
