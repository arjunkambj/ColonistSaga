# ColonistSaga audio production brief

## Product read

ColonistSaga is a friendly three- or four-player island strategy game. Its current flow is:

1. dusk-harbor sign-in;
2. bright archipelago home screen;
3. private-room or bot-game setup;
4. initial settlement-and-road placement;
5. repeating turns with dice, resource production, building, bank/player trade,
   the robber, discarding, stealing, and a turn timer;
6. victory, loss, or draw.

The art uses rounded clay-like pieces, warm terrain, blue water, and clean mobile-game UI. Audio
should make the table feel tactile and alive while leaving enough space for strategic thought.

## Audio identity

**Style:** handcrafted maritime folk chamber music with a modern casual-game finish.

**Music palette:** nylon-string guitar, muted mandolin or pizzicato strings, soft marimba, handpan,
woodblocks, brushed frame drum, warm cello, airy flute, and very quiet ocean-air ambience.

**Sound-effect palette:** carved wood, terracotta, ceramic, pebbles, paper cards, canvas, grain,
small bells, soft mallets, and subtle water shimmer.

**Avoid:** pirate music, sea shanties, ukulele-advertising music, obvious tropical stereotypes,
casino/slot-machine sounds, orchestral trailer scoring, aggressive combat drums, EDM, vocals,
spoken words, recognizable melodies, and direct imitation of any existing board game.

## Generation and delivery rules

Use these requirements with every generation tool unless a cue overrides them.

### Music

- Instrumental only: no voice, choir, humming, lyrics, or spoken words.
- Original melody and harmony; do not reference an existing game, film, or song.
- Seamless loop cues need a clean loop point, no long intro, and no final resolving chord.
- Keep the center channel light so future voice or accessibility cues remain clear.
- Deliver stereo WAV, 48 kHz, 24-bit. Make an OGG or AAC runtime copy later.
- Leave mastering headroom: true peak at or below -1 dBTP; target about -18 LUFS integrated.
- Do not bake ocean ambience into every cue. Keep ambience on a separate layer where possible.
- Generate the A/B loop variants with the same tempo, key family, instrument palette, and loudness
  so the game can crossfade between them.

### Sound effects

- Generate clean isolated one-shots with no music, voice, room tone, or background ambience.
- Start the meaningful transient within 20 ms unless the timing description calls for a lead-in.
- Keep tails short and intentional. Do not add a cinematic reverb wash.
- Deliver 48 kHz, 24-bit WAV. Use mono for centered UI and tactile hits; stereo only for wide
  transitions, ambience, dice movement, and result flourishes.
- Target peak at or below -3 dBFS. Loudness will be balanced in the game mix.
- For frequently repeated sounds, generate three or four subtle variants or use small randomized
  pitch/volume changes in-engine. Do not make variants rhythmically different.

## Music list

### M01 — Voyage Begins (sign-in and home)

- **Priority:** P0
- **Use:** sign-in harbor and the main “Choose Your Voyage” screen; continue across sign-in rather
  than restarting.
- **Length:** 96 seconds, seamless loop. Compose a 2-second fade-in and no ending cadence.
- **Tempo/style:** 82 BPM, warm and inviting, gently adventurous, no urgency.
- **Prompt:**

> Create an original instrumental seamless-loop soundtrack for a polished casual island strategy
> game. The scene moves from a lantern-lit harbor at dusk to a bright blue archipelago where the
> player chooses a voyage. Handcrafted maritime folk chamber style: gentle nylon guitar, muted
> mandolin, soft marimba, warm pizzicato strings, light hand percussion, airy flute, and a very
> subtle sense of ocean breeze. Begin intimate, then reveal a hopeful memorable motif without a
> dramatic swell. Friendly, premium, curious, and calm; 82 BPM, major key with a few suspended
> chords. Exactly 96 seconds, designed to loop seamlessly with no final cadence. Instrumental only,
> no vocals, no choir, no pirate or tropical clichés, no ukulele-advertising feel, no cinematic
> trailer drums, no recognizable melody, no sound effects.

### M02 — Gather the Crew (lobby)

- **Priority:** P0
- **Use:** private waiting room, seat configuration, bot difficulty, and game settings.
- **Length:** 80 seconds, seamless loop.
- **Tempo/style:** 92 BPM, lightly social and anticipatory, quieter than the home cue.
- **Prompt:**

> Create an original instrumental seamless-loop cue for a friendly multiplayer island-game lobby
> where three or four players gather around a handcrafted table and adjust the rules. Light maritime
> chamber folk with soft marimba, muted plucked strings, brushed frame drum, tiny woodblock details,
> warm cello pizzicato, and occasional airy flute. The mood is welcoming, social, and expectant but
> never busy; it must support reading settings for several minutes. 92 BPM, gentle syncopation, warm
> major harmony, restrained dynamics. Exactly 80 seconds with an immediate usable opening and a
> seamless loop, no ending chord. Instrumental only, no vocals, no pirate music, no fanfare, no
> comedy, no casino sounds, no large drums, no recognizable melody, no sound effects.

### M03 — Founding Shores (initial placement)

- **Priority:** P0
- **Use:** the snake-order setup phase while each player places two settlements and two roads.
- **Length:** 90 seconds, seamless loop.
- **Tempo/style:** 96 BPM, focused and optimistic with a little forward motion.
- **Prompt:**

> Create an original instrumental seamless-loop cue for the opening placement phase of a cozy but
> strategic island board game. Players carefully choose their first settlement and road locations on
> a colorful clay-like map. Use plucked nylon guitar, soft marimba, pizzicato strings, handpan,
> brushed frame drum, and restrained wood percussion. Convey planning, first footsteps, and the
> island waking up; optimistic and focused, never tense. 96 BPM, clear gentle pulse, light major and
> modal harmony, modest melodic development that can repeat without fatigue. Exactly 90 seconds,
> seamless loop, no slow intro and no final cadence. Instrumental only, no vocals, no epic scoring,
> no pirate or medieval tavern style, no heavy percussion, no recognizable melody, no sound effects.

### M04 — Trade Winds (normal play, calm variant)

- **Priority:** P0
- **Use:** default music after setup; dice, resource production, building, and ordinary turns.
- **Length:** 150 seconds, seamless loop.
- **Tempo/style:** 88 BPM, thoughtful, sunlit, low-fatigue strategy music.
- **Prompt:**

> Create an original instrumental seamless-loop background track for the main turns of a polished
> casual island strategy game. The player studies a colorful hex island, rolls dice, gains resources,
> builds roads and settlements, and plans trades. Handcrafted maritime chamber palette: nylon guitar
> ostinato, muted mandolin, soft marimba, gentle pizzicato strings, warm cello, sparse handpan, and
> brushed frame drum. Thoughtful, sunlit, quietly satisfying, and highly replayable with plenty of
> space between phrases. 88 BPM, warm modal-major harmony, small motif variations, restrained bass
> and transients. Exactly 150 seconds, seamless loop with no ending resolution. Instrumental only,
> no vocals, no danger, no pirate music, no tropical cliché, no trailer build, no casino energy, no
> recognizable melody, no sound effects.

### M05 — Clever Currents (normal play, momentum variant)

- **Priority:** P1
- **Use:** alternate with M04 after two loops or on a later round; do not change on every turn.
- **Length:** 150 seconds, seamless loop.
- **Tempo/style:** 100 BPM, clever and active but still suitable for concentration.
- **Prompt:**

> Create an original instrumental seamless-loop companion track for the midgame of a friendly island
> strategy board game. Match a handcrafted maritime chamber sound with soft marimba, muted plucked
> strings, nylon guitar, warm cello pizzicato, small wood percussion, brushed frame drum, and a few
> bright flute answers. Suggest expanding roads, lively negotiation, and clever plans coming together
> without implying combat or a race. 100 BPM, buoyant but restrained groove, major-modal harmony,
> medium-low intensity, no sudden peaks. Exactly 150 seconds and seamlessly loopable with no final
> chord. Instrumental only, no vocals, no pirate or tavern music, no tropical pop, no EDM, no epic
> trailer scoring, no recognizable melody, no sound effects.

### M06 — Seven on the Horizon (robber musical sting)

- **Priority:** P0
- **Use:** once when a seven is revealed, before discard/robber sound effects. Duck the background
  music by about 6 dB for this cue.
- **Length:** 2.4 seconds, one-shot; important impact at 0.45 seconds, resolved by 2.2 seconds.
- **Prompt:**

> Create a 2.4-second original instrumental danger sting for a friendly clay-style island strategy
> game when the dice reveal seven and the robber is activated. Start with a short low hand-drum and
> wooden impact at 0.45 seconds, followed by a dark muted cello slide, dry pebble rattle, and a brief
> suspended marimba tone. Concern and interruption, not horror or combat. End cleanly by 2.2 seconds
> so normal music can return. No voice, no choir, no jump scare, no brass blast, no cinematic boom,
> no music bed, no recognizable melody.

### M07 — Island Crowned (viewer victory)

- **Priority:** P0
- **Use:** “You Rule the Island!” result overlay.
- **Length:** 9 seconds, one-shot with a clean optional hold after 7.5 seconds.
- **Prompt:**

> Create a 9-second original victory flourish for a warm casual island strategy game. Reprise the
> feeling of a hopeful maritime folk motif using bright marimba, nylon guitar, pizzicato strings,
> warm rising cello, small hand drums, and one tasteful bell sparkle. Proud, earned, communal, and
> joyful rather than royal or bombastic. A clear lift at 1 second, satisfying melodic peak around 6
> seconds, gentle resolved tail by 9 seconds. Instrumental only, no voice or choir, no brass fanfare,
> no pirate music, no casino jackpot, no huge drums, no recognizable melody.

### M08 — Another Voyage (another player wins)

- **Priority:** P1
- **Use:** result overlay when somebody else wins.
- **Length:** 6 seconds, one-shot.
- **Prompt:**

> Create a 6-second respectful end-of-game flourish for a friendly multiplayer island strategy game
> when another player wins. Soft nylon guitar, warm cello, two quiet marimba notes, and a gentle ocean
> shimmer. Acknowledge the result with warmth and a small upward hint toward playing again; never sad,
> sarcastic, or triumphant. Resolve cleanly by 6 seconds. Instrumental only, no voice, no comedy
> trombone, no failure buzzer, no cinematic drama, no recognizable melody.

### M09 — Island at Rest (draw)

- **Priority:** P2
- **Use:** draw result overlay.
- **Length:** 6 seconds, one-shot.
- **Prompt:**

> Create a 6-second neutral, peaceful draw flourish for a handcrafted island strategy game. Use soft
> handpan, muted marimba, warm suspended strings, and a faint water shimmer. Balanced and complete,
> neither victorious nor disappointed, like the island settling at sunset. Gentle resolution by 6
> seconds. Instrumental only, no voice, no comedy, no ominous tone, no large percussion, no
> recognizable melody.

## Sound-effect list

Prompts below are complete generation prompts. For any cue marked **variants**, generate the stated
number as separate files while preserving timing and loudness.

### A. Interface and navigation

#### SFX-UI-01 — Soft button press

- **Priority:** P0
- **Trigger:** ordinary buttons, tabs, build-mode selection, and compact target buttons.
- **Length:** 90 ms; mono; 4 subtle variants.
- **Prompt:**

> Isolated 0.09-second casual-game UI button press, a tiny rounded carved-wood tap layered with a very
> soft ceramic tick, warm and tactile, immediate transient, dry close sound, four subtle variations,
> no music, no ambience, no voice, no clicky mouse sound, no high-pitched beep, no reverb tail.

#### SFX-UI-02 — Primary action press

- **Priority:** P0
- **Trigger:** Continue with Google, Quick Match, Host Island, Join Crew, Start Game, Roll Dice,
  confirm discard, and confirm trade.
- **Length:** 180 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.18-second premium casual-game primary button sound, rounded wooden press with a soft
> mallet thump and tiny bright clay chime, confident and friendly, fast attack and clean short tail,
> three subtle variants, no music, no ambience, no voice, no electronic beep, no casino sparkle.

#### SFX-UI-03 — Modal open

- **Priority:** P1
- **Trigger:** bot setup, trade center, game info, and confirmation dialogs.
- **Length:** 280 ms; stereo.
- **Prompt:**

> Isolated 0.28-second UI panel opening sound for a handcrafted island game, soft canvas-and-paper
> unfold with a light left-to-right wooden swish and one muted marimba mote, smooth and unobtrusive,
> no music bed, no voice, no magical sparkle cascade, no long reverb.

#### SFX-UI-04 — Modal close

- **Priority:** P1
- **Trigger:** close or cancel a dialog.
- **Length:** 190 ms; stereo.
- **Prompt:**

> Isolated 0.19-second UI panel closing sound, short reversed canvas fold with a gentle wooden tuck,
> slightly downward motion, clean dry ending, subtle and friendly, no music, no voice, no whoosh boom,
> no reverb tail.

#### SFX-UI-05 — Stepper and toggle

- **Priority:** P1
- **Trigger:** number +/- controls, resource quantities, rule switches, and select choices.
- **Length:** 70 ms; mono; 4 variants.
- **Prompt:**

> Isolated 0.07-second tiny tactile UI adjustment sound, a polished seed-sized wood click with a soft
> clay bead tick, quiet and repeatable, four nearly identical variations, no music, no ambience, no
> voice, no piercing digital click, no tail.

#### SFX-UI-06 — Copy room code

- **Priority:** P1
- **Trigger:** successful clipboard copy.
- **Length:** 320 ms; mono.
- **Prompt:**

> Isolated 0.32-second confirmation sound for copying a room code in a friendly island game, one soft
> paper-card flick followed by two tiny warm bell notes, clear but restrained, no music, no voice, no
> cash register, no casino sound, no long reverb.

#### SFX-UI-07 — Action accepted

- **Priority:** P0
- **Trigger:** successful settings save or other non-gameplay confirmation without a specific cue.
- **Length:** 420 ms; mono.
- **Prompt:**

> Isolated 0.42-second warm success notification for a polished casual strategy game, soft wooden
> knock followed by a gentle two-note marimba rise, satisfying and calm, no music, no voice, no
> jackpot sparkle, no triumphant fanfare, short clean tail.

#### SFX-UI-08 — Action rejected/error

- **Priority:** P0
- **Trigger:** sign-in, room, command, connection, or validation error toast.
- **Length:** 350 ms; mono; 2 variants.
- **Prompt:**

> Isolated 0.35-second friendly error notification for a casual island strategy game, muted low
> woodblock double tap with a soft downward ceramic tone, informative rather than alarming, two subtle
> variations, no music, no voice, no buzzer, no harsh bass, no horror, no long tail.

### B. Room and game start

#### SFX-ROOM-01 — Room created or joined

- **Priority:** P0
- **Trigger:** local player enters a private room successfully.
- **Length:** 700 ms; stereo.
- **Prompt:**

> Isolated 0.70-second welcoming room-entry sound for a multiplayer island game, a soft dock-rope
> pull, warm wooden knock, and three gentle rising marimba notes spreading slightly in stereo,
> friendly and anticipatory, no music bed, no voice, no harbor crowd, no fanfare, no casino sparkle.

#### SFX-ROOM-02 — Player takes a seat

- **Priority:** P0
- **Trigger:** another human joins the visible lobby.
- **Length:** 600 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.60-second multiplayer player-joined cue, a small wooden game piece placed on a table
> followed by a warm two-note plucked-string welcome, social and subtle, three variants, no music bed,
> no voice, no applause, no notification beep, no long reverb.

#### SFX-ROOM-03 — Player leaves a seat

- **Priority:** P1
- **Trigger:** a lobby member leaves.
- **Length:** 450 ms; mono.
- **Prompt:**

> Isolated 0.45-second player-left cue for a friendly board-game lobby, a small wooden token lifted
> from a table with a soft downward cloth-and-wood sound, neutral and nonjudgmental, no music, no
> voice, no sad trombone, no alarm, no reverb wash.

#### SFX-ROOM-04 — Bot fills a seat

- **Priority:** P1
- **Trigger:** bot added or player replaced by bot.
- **Length:** 650 ms; mono.
- **Prompt:**

> Isolated 0.65-second friendly bot-seat cue for a handcrafted strategy game, a wooden game piece
> placement, two precise clockwork ticks, and one soft marimba confirmation note, clever and warm
> rather than robotic, no speech, no electronic voice, no sci-fi laser, no music bed, no long tail.

#### SFX-ROOM-05 — Build the island transition

- **Priority:** P0
- **Trigger:** Start Game and Quick Match after the server confirms creation.
- **Length:** 2.2 seconds; stereo.
- **Prompt:**

> Isolated 2.2-second transition sound from lobby to island board in a polished casual strategy game.
> Begin with a close wooden table knock at 0.1 seconds, expand into a smooth ocean-air sweep, rolling
> pebble and clay-piece details, then land on a warm hopeful marimba-and-plucked-string chord at 1.7
> seconds. Adventurous but compact, clean ending by 2.2 seconds, no voice, no cinematic boom, no
> pirate fanfare, no music bed beyond the final short chord.

### C. Turns, dice, and resources

#### SFX-TURN-01 — Your turn

- **Priority:** P0
- **Trigger:** viewer becomes the required actor; play once per handoff, not on every state update.
- **Length:** 850 ms; mono.
- **Prompt:**

> Isolated 0.85-second “your turn” notification for a warm multiplayer island strategy game, three
> clear ascending wooden-marimba notes with a tiny plucked-string answer, noticeable but calm,
> readable over soft music, no voice, no alarm, no casino sound, no triumphant fanfare, short tail.

#### SFX-TURN-02 — Turn passes

- **Priority:** P2
- **Trigger:** local player successfully ends a turn.
- **Length:** 300 ms; stereo.
- **Prompt:**

> Isolated 0.30-second turn-handoff sound, a small wooden token sliding gently left to right across
> felt with one muted tick at the destination, quiet and clean, no music, no voice, no large whoosh,
> no reverb.

#### SFX-DICE-01 — Dice shake

- **Priority:** P0
- **Trigger:** Roll Dice press; stop when the server result arrives, maximum 700 ms.
- **Length:** 650 ms loopable texture; stereo; 2 variants.
- **Prompt:**

> Isolated 0.65-second loopable pair-of-dice shaking sound for a premium casual board game, rounded
> ivory dice tumbling naturally in a small wooden cup, quick irregular impacts, close stereo movement,
> energetic but not loud, seamless texture if repeated once, two variants, no music, no voice, no
> table slam, no casino ambience, no long reverb.

#### SFX-DICE-02 — Dice land

- **Priority:** P0
- **Trigger:** dice result appears; randomize between variants.
- **Length:** 480 ms; stereo; 4 variants.
- **Prompt:**

> Isolated 0.48-second two-dice landing sound on a polished wooden game table, two or three natural
> rounded impacts and a tiny final settle, satisfying and readable, close gentle stereo, four distinct
> but equal-loudness variations, no music, no voice, no casino ambience, no exaggerated crash, short
> dry tail.

#### SFX-DICE-03 — Seven revealed

- **Priority:** P0
- **Trigger:** layer after SFX-DICE-02 when the total is seven; M06 may replace this if used.
- **Length:** 1.25 seconds; mono.
- **Prompt:**

> Isolated 1.25-second “seven and robber” alert for a friendly island strategy game, low wooden drum
> impact, brief dry pebble rattle, and a two-note muted marimba descent, tense but safe and readable,
> no music bed, no voice, no horror, no cinematic braam, no siren, clean ending.

#### SFX-RESOURCE-01 — Resource bundle received

- **Priority:** P0
- **Trigger:** viewer's resource total increases after a production roll or second setup settlement.
- **Length:** 750 ms; stereo; 3 variants.
- **Prompt:**

> Isolated 0.75-second resource-reward sound for a handcrafted island strategy game, several small
> paper resource cards sliding together across felt, light wood and grain textures, then a restrained
> warm two-note chime, satisfying but not casino-like, three variants, gentle stereo, no music, no
> voice, no coin shower, no jackpot, no long reverb.

#### SFX-RESOURCE-02 — Tree accent

- **Priority:** P2
- **Trigger:** low-volume accent when selecting or receiving tree resources.
- **Length:** 320 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.32-second tree-resource accent, tiny dry twig snap layered with a soft leaf rustle and
> rounded wood tap, pleasant and miniature, three variants, no music, no forest ambience, no voice,
> no harsh crack, clean tail.

#### SFX-RESOURCE-03 — Brick accent

- **Priority:** P2
- **Length:** 300 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.30-second brick-resource accent, two tiny rounded terracotta pieces touching with a warm
> clay tick and soft dusty settle, miniature and friendly, three variants, no music, no construction
> ambience, no breaking pottery, no voice, short dry tail.

#### SFX-RESOURCE-04 — Sheep accent

- **Priority:** P2
- **Length:** 330 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.33-second sheep-resource accent represented without an animal voice: a soft wool-and-felt
> puff, tiny wooden bead tap, and airy gentle bounce, cute but restrained, three variants, no bleat, no
> voice, no music, no farm ambience, no cartoon squeak.

#### SFX-RESOURCE-05 — Wheat accent

- **Priority:** P2
- **Length:** 380 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.38-second wheat-resource accent, a miniature handful of dry grain shifting in a cloth
> pouch with one soft seed tap, warm and delicate, three variants, no music, no field ambience, no
> voice, no loud pouring, clean short tail.

#### SFX-RESOURCE-06 — Stone accent

- **Priority:** P2
- **Length:** 320 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.32-second stone-resource accent, two small smooth pebbles touching with a low rounded
> mineral clink and soft felt landing, solid but not metallic, three variants, no music, no cave
> ambience, no voice, no rock crash, short dry tail.

### D. Building and board interaction

#### SFX-BUILD-01 — Legal target selected

- **Priority:** P1
- **Trigger:** enter road, settlement, or city build mode and choose a highlighted target.
- **Length:** 160 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.16-second legal board-target selection cue, soft wooden pointer tap with a tiny warm
> glassy glint, precise and quiet, three variants, no music, no voice, no digital laser, no magical
> sparkle trail, no reverb.

#### SFX-BUILD-02 — Road placed

- **Priority:** P0
- **Trigger:** confirmed road appears on the board.
- **Length:** 520 ms; stereo; 4 variants.
- **Prompt:**

> Isolated 0.52-second road-placement sound for a clay-style island board game, a short carved wooden
> road piece slides a few centimeters over felt and seats firmly with two soft endpoint taps, tactile
> and satisfying, gentle stereo motion, four variants, no music, no voice, no construction machinery,
> no hammering, short tail.

#### SFX-BUILD-03 — Settlement placed

- **Priority:** P0
- **Trigger:** confirmed settlement appears.
- **Length:** 720 ms; mono; 4 variants.
- **Prompt:**

> Isolated 0.72-second settlement-placement sound for a handcrafted casual strategy game, a rounded
> wooden house piece placed firmly on a felt board, small clay contact, soft timber knock, then a tiny
> hopeful marimba note, four variants, no music bed, no voice, no real construction, no crowd, no
> casino sparkle, clean tail.

#### SFX-BUILD-04 — City upgraded

- **Priority:** P0
- **Trigger:** settlement changes into a city.
- **Length:** 1.0 second; stereo; 3 variants.
- **Prompt:**

> Isolated 1.0-second city-upgrade sound for a polished clay-style island game. Begin with the soft
> lift of a small wooden house, place a larger rounded city piece with a deeper satisfying wood-and-
> ceramic contact, then add a restrained three-note marimba rise. Meaningful progress, not a victory
> fanfare; three variants, subtle stereo width, no voice, no construction noise, no jackpot, clean
> ending.

### E. Robber, discard, and steal

#### SFX-ROBBER-01 — Discard required

- **Priority:** P0
- **Trigger:** viewer enters a discard requirement after seven.
- **Length:** 900 ms; mono.
- **Prompt:**

> Isolated 0.90-second discard-required notification for a friendly strategy board game, a low muted
> frame-drum tap, several paper cards shifting backward, and a restrained two-note wooden descent,
> urgent enough to notice but not punishing, no voice, no alarm, no horror, no music bed, short tail.

#### SFX-ROBBER-02 — Cards discarded

- **Priority:** P0
- **Trigger:** confirmed discard.
- **Length:** 650 ms; stereo; 3 variants.
- **Prompt:**

> Isolated 0.65-second resource-card discard sound, a small hand of paper cards gathered and slid away
> across felt into a wooden tray, firm clean finish, neutral rather than sad, three variants, gentle
> stereo, no music, no voice, no tearing, no cash register, short tail.

#### SFX-ROBBER-03 — Robber moved

- **Priority:** P0
- **Trigger:** robber pawn relocates to another tile.
- **Length:** 850 ms; stereo; 3 variants.
- **Prompt:**

> Isolated 0.85-second robber-pawn movement sound for a warm clay-style board game, a dark wooden pawn
> lifts, slides across textured board felt with a dry pebble rattle, and lands with a muted low knock,
> slightly mischievous and tense but not frightening, three stereo movement variants, no voice, no
> footsteps, no cinematic boom, no music.

#### SFX-ROBBER-04 — Resource stolen, thief feedback

- **Priority:** P0
- **Trigger:** viewer successfully steals.
- **Length:** 620 ms; stereo; 3 variants.
- **Prompt:**

> Isolated 0.62-second successful random-resource steal cue for a friendly island strategy game, one
> paper card slips quickly from one side to the other, a soft wooden token tick, and a tiny sly plucked
> string, readable but not cruel, three variants, no voice, no coin sound, no comedy, no music bed,
> short tail.

#### SFX-ROBBER-05 — Resource lost, victim feedback

- **Priority:** P1
- **Trigger:** viewer loses a resource to a steal.
- **Length:** 500 ms; mono; 2 variants.
- **Prompt:**

> Isolated 0.50-second resource-lost cue for a friendly strategy game, one paper card quietly pulled
> away with a soft downward wood tone, informative and restrained rather than punishing, two variants,
> no voice, no failure buzzer, no sad comedy, no music, clean tail.

### F. Trading

#### SFX-TRADE-01 — Market opens

- **Priority:** P1
- **Trigger:** trade center opens.
- **Length:** 480 ms; stereo.
- **Prompt:**

> Isolated 0.48-second island-market UI opening cue, canvas awning unfurl, two small wooden tokens
> placed, and a quiet plucked-string flourish, welcoming and compact, subtle stereo, no crowd, no
> merchant voice, no music bed, no coin jingle, no long reverb.

#### SFX-TRADE-02 — Offer sent

- **Priority:** P0
- **Trigger:** player trade proposal confirmed.
- **Length:** 700 ms; stereo; 2 variants.
- **Prompt:**

> Isolated 0.70-second player-trade-offer sent cue, a small paper offer card slides from center toward
> the sides across felt, followed by two questioning marimba notes, social and clear, two stereo
> variants, no voice, no mail swoosh, no coin sound, no music bed, clean tail.

#### SFX-TRADE-03 — Offer received

- **Priority:** P0
- **Trigger:** trade dialog becomes mandatory for an invited viewer.
- **Length:** 850 ms; mono.
- **Prompt:**

> Isolated 0.85-second incoming player-trade notification for a friendly multiplayer strategy game,
> paper card arrives with a soft wooden tap followed by a clear warm three-note question motif on
> marimba, noticeable but not urgent, no voice, no alarm, no phone notification, no casino sound, no
> music bed.

#### SFX-TRADE-04 — Trade accepted

- **Priority:** P0
- **Trigger:** player trade completes for all participants.
- **Length:** 1.1 seconds; stereo; 3 variants.
- **Prompt:**

> Isolated 1.1-second accepted-trade sound for a handcrafted island strategy game, two small stacks of
> paper resource cards cross smoothly in opposite stereo directions, settle with warm wooden taps,
> then a restrained three-note marimba agreement chime. Cooperative and satisfying, three variants,
> no voice, no coins, no cash register, no jackpot, no music bed, clean ending.

#### SFX-TRADE-05 — Trade declined

- **Priority:** P0
- **Trigger:** invited player declines.
- **Length:** 450 ms; mono; 2 variants.
- **Prompt:**

> Isolated 0.45-second politely declined trade cue, offer card slides back a short distance with one
> muted downward woodblock note, neutral and courteous, two variants, no voice, no buzzer, no comedy,
> no rejection alarm, no music, short dry tail.

#### SFX-TRADE-06 — Trade cancelled

- **Priority:** P1
- **Trigger:** proposer cancels an open offer.
- **Length:** 400 ms; mono.
- **Prompt:**

> Isolated 0.40-second cancelled trade cue, a paper offer card is neatly folded back into a small
> wooden tray with one soft neutral tick, calm and final, no voice, no buzzer, no music, no long tail.

#### SFX-TRADE-07 — Bank or harbor trade

- **Priority:** P0
- **Trigger:** bank trade completes.
- **Length:** 900 ms; stereo; 3 variants.
- **Prompt:**

> Isolated 0.90-second bank-or-harbor resource trade sound for a casual island strategy game, a small
> stack of paper resource cards slides away, a wooden dock knock and faint water lap bridge the
> exchange, then one new card slides back with a warm confirmation chime. Clear give-then-receive
> rhythm, three subtle stereo variants, no voice, no coins, no cash register, no music bed, short tail.

### G. Timer, connection, and results

#### SFX-TIMER-01 — Final-ten-second tick

- **Priority:** P0 when timed turns are enabled
- **Trigger:** once at each whole second from 10 through 4; lower volume than action sounds.
- **Length:** 90 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.09-second soft countdown tick for a friendly strategy game, muted wooden clock tap with a
> tiny dry seed click, focused and audible but not stressful, three nearly identical variants, no
> music, no voice, no electronic beep, no reverb.

#### SFX-TIMER-02 — Final-three-second tick

- **Priority:** P0 when timed turns are enabled
- **Trigger:** once at 3, 2, and 1 seconds; slightly higher pitch each second in-engine.
- **Length:** 120 ms; mono; 3 variants.
- **Prompt:**

> Isolated 0.12-second urgent-but-friendly final countdown tick, firm rounded woodblock tap layered
> with a very soft ceramic ping, clean and compact, three equal variants, no music, no voice, no alarm,
> no harsh digital beep, no tail.

#### SFX-TIMER-03 — Time expired

- **Priority:** P0 when timed turns are enabled
- **Trigger:** local action deadline expires.
- **Length:** 700 ms; mono.
- **Prompt:**

> Isolated 0.70-second turn-time-expired cue for a casual strategy game, low soft wooden double knock
> followed by a brief downward handpan tone, clear and final but not punitive, no voice, no buzzer, no
> siren, no failure comedy, no music bed, clean tail.

#### SFX-NET-01 — Connection interrupted

- **Priority:** P1
- **Trigger:** app detects loss of real-time connection or a recoverable stale state.
- **Length:** 650 ms; mono.
- **Prompt:**

> Isolated 0.65-second connection-interrupted notification for a warm casual game, a soft rope strain,
> wooden tap, and two muted descending marimba notes, concerned but calm and recoverable, no voice, no
> modem sound, no alarm, no music, short tail.

#### SFX-NET-02 — Reconnected

- **Priority:** P1
- **Trigger:** real-time connection or player session is restored.
- **Length:** 700 ms; mono.
- **Prompt:**

> Isolated 0.70-second reconnection cue for a friendly island game, dock rope settles, warm wood knock,
> and two gentle rising marimba notes, reassuring and restrained, no voice, no fanfare, no casino
> sparkle, no music bed, short clean tail.

#### SFX-RESULT-01 — Victory transition swell

- **Priority:** P0
- **Trigger:** immediately before M07 and the winner overlay; skip if M07 already has a suitable
  opening impact.
- **Length:** 1.4 seconds; stereo.
- **Prompt:**

> Isolated 1.4-second transition into a warm island-game victory screen, soft ocean-air lift, several
> wooden pieces settling together, then one bright marimba-and-bell crest, celebratory but premium and
> compact, no voice, no applause, no fireworks, no jackpot, no pirate fanfare, no long music bed.

#### SFX-RESULT-02 — Return home

- **Priority:** P2
- **Trigger:** leave result overlay and return to home.
- **Length:** 700 ms; stereo.
- **Prompt:**

> Isolated 0.70-second return-to-home transition for a handcrafted island game, gentle page turn,
> small wooden token lifted, and soft ocean breeze moving outward in stereo, peaceful and clean, no
> voice, no fanfare, no music bed, no long reverb.

## Recommended generation batches

### Batch 1 — Core feedback

Generate these first:

- M01, M02, M03, M04, M06, and M07;
- SFX-UI-01, UI-02, UI-07, UI-08;
- SFX-ROOM-01, ROOM-02, ROOM-05;
- SFX-TURN-01, DICE-01, DICE-02, DICE-03, RESOURCE-01;
- SFX-BUILD-02, BUILD-03, BUILD-04;
- SFX-ROBBER-01 through ROBBER-04;
- SFX-TRADE-02 through TRADE-05 and TRADE-07;
- timer cues if timed turns ship enabled.

### Batch 2 — Variety and social polish

Generate M05 and M08, modal/stepper sounds, lobby leave/bot cues, target selection, trade opening and
cancel, victim feedback, connection cues, and the result transition.

### Batch 3 — Optional texture

Generate M09, individual resource accents, turn-pass, and return-home sounds.

## Playback and mixing notes

- Start music only after the first user gesture because browsers block unsolicited audio.
- Crossfade screen music over 1.5 seconds. Crossfade gameplay loop variants over 3 seconds.
- Keep music around -24 to -20 LUFS during play; allow title and results to sit 2–3 dB louder.
- Duck music 4–6 dB for seven/robber, incoming trade, your-turn, and result cues.
- Do not play a sound from optimistic local UI and then again from the confirmed server state. Tactile
  button feedback may play locally; rule-result sounds should play only from the confirmed state diff.
- Only play “your turn” when the required actor changes to the viewer. Reconnects and state replays
  must not replay the full action history.
- When multiple players receive resources, each client should emphasize only its own gain. Use one
  bundle sound, then at most two quiet resource accents to prevent a five-sound pileup.
- Roll seven should be: dice shake → dice land → seven sting → discard/robber prompt. Do not stack
  M06 and SFX-DICE-03 at full volume; choose one or mix the short SFX 8 dB lower.
- A declined trade is private feedback for invited/proposing players, not a table-wide alert.
- Timer ticks should be disabled when the timer is off and muted for bot-thinking countdowns.
- Provide separate user controls for **Music**, **Sound Effects**, and **Mute All**. Persist choices
  locally and default to a conservative volume.
- Respect reduced sensory preferences with an option to suppress countdown ticks and high-priority
  alerts while retaining visual feedback.

## Do not generate yet

The current game has no development cards, Longest Road/Largest Army awards, chat messages, public
matchmaking queue, avatar emotes, or campaign/story scenes. Audio for those features would be
speculative and should wait until the corresponding interaction exists.

## Suggested file naming

Use lowercase kebab-case and preserve variants:

```text
audio/music/voyage-begins-a.wav
audio/music/voyage-begins-b.wav
audio/sfx/dice-land-01.wav
audio/sfx/dice-land-02.wav
audio/sfx/settlement-place-01.wav
audio/sfx/trade-accepted-01.wav
```
