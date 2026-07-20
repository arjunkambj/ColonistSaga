# ColonistSaga v2 game asset manifest

## Art direction

ColonistSaga uses an original light casual-mobile-game style inspired by the
provided UI references: rounded clay/plastic forms, pastel surfaces, warm
highlights, honey-gold terrain rims, short ambient shading, clean silhouettes,
and readable detail at small sizes. It must not copy another game's branding,
artwork, icons, or UI.

All generated gameplay art must:

- use a consistent top-down three-quarter camera;
- contain no words, numbers, logos, borders, UI chrome, or watermarks;
- keep important detail away from crop edges;
- use a clean alpha edge for isolated cutouts, or an intentional opaque
  full-bleed canvas for cards and environment scenes;
- remain legible at 64 px for icons and 160 px for board tiles;
- use code-rendered labels and player colors for accessibility and localization.

## Generated default board pack

| ID                | File                          | Purpose                       | Target        |
| ----------------- | ----------------------------- | ----------------------------- | ------------- |
| terrain-fields    | `terrain/fields.png`          | Wheat-producing hex           | 512×512 RGBA  |
| terrain-forest    | `terrain/forest.png`          | Tree-producing hex            | 512×512 RGBA  |
| terrain-hills     | `terrain/hills.png`           | Brick-producing hex           | 512×512 RGBA  |
| terrain-mountains | `terrain/mountains.png`       | Stone-producing hex           | 512×512 RGBA  |
| terrain-pasture   | `terrain/pasture.png`         | Sheep-producing hex           | 512×512 RGBA  |
| terrain-desert    | `terrain/desert.png`          | Non-producing robber hex      | 512×512 RGBA  |
| resource-tree     | `resources/tree.png`          | Inventory and trade icon      | 256×256 RGBA  |
| resource-brick    | `resources/brick.png`         | Inventory and trade icon      | 256×256 RGBA  |
| resource-sheep    | `resources/sheep.png`         | Inventory and trade icon      | 256×256 RGBA  |
| resource-wheat    | `resources/wheat.png`         | Inventory and trade icon      | 256×256 RGBA  |
| resource-stone    | `resources/stone.png`         | Inventory and trade icon      | 256×256 RGBA  |
| piece-road        | `pieces/road.png`             | Neutral tintable road token   | 512×512 RGBA  |
| piece-settlement  | `pieces/settlement.png`       | Neutral tintable settlement   | 512×512 RGBA  |
| piece-city        | `pieces/city.png`             | Neutral tintable city         | 512×512 RGBA  |
| piece-robber      | `pieces/robber.png`           | Neutral robber pawn           | 256×256 RGBA  |
| ui-development    | `ui/development-deck-v1.avif` | General development-card icon | 512×512 AVIF  |
| ui-trade-caravan  | `ui/trade-caravan.png`        | Domestic trade modal art      | 1672×941 RGBA |

The neutral road, settlement, and city are authored in warm ivory so the client
can apply the eight accessible player colors consistently rather than depending
on separately generated variants.

The trade caravan is an original transparent illustration derived from the
provided casual-game UI references. It contains no text or interactive chrome;
all labels, offer values, response states, and controls remain code-rendered.

The desert is the sixth terrain type but is not a resource. The resource system
contains exactly five values: tree, brick, sheep, wheat, and stone.

Each terrain type also has `-alternate` and `-alternate-2` variants, for 18
generated terrain tiles in total. The live renderer selects them
deterministically.

## Generated visual expansion pack

| Group                      | Count | Project location                | Output contract                              |
| -------------------------- | ----: | ------------------------------- | -------------------------------------------- |
| Resource cards             |     5 | `cards/resources/*-card-v1.png` | 512×768 opaque PNG                           |
| Action cards               |     5 | `cards/actions/*-card-v1.png`   | 512×768 opaque PNG                           |
| Development cards and back |     6 | `cards/development/*.png`       | 512×768 PNG                                  |
| Player portraits           |     8 | `players/*-v1.png`              | 256×256 opaque PNG                           |
| Award cutouts              |     2 | `awards/*-v1.png`               | 512×512 transparent PNG                      |
| Result art                 |     2 | `results/*-v1.*`                | 3:1 transparent flourish + 16:9 opaque scene |
| Optional ambience          |     3 | `ambience/*-v1.png`             | 384×384 transparent PNG                      |
| Bank building              |     1 | `ui/bank-v1.png`                | 256×256 transparent PNG                      |

The optional ambience remains catalog-only by default so it cannot compete
with legal targets, pieces, ports, or number tokens. The game asset sheet is the
complete visual inventory and includes the island shelf, ocean canvas, port
skiff, all 18 terrain variants, and every expansion image above.

All 16 unique generated card images share one runtime path catalog in
`apps/web/src/constants/game/card-assets.ts`. The five resource cards render in
the private hand, the five action cards render in the existing action dock, and
the hidden development-card back opens an in-game reference for the five card
faces. The reference explicitly states that development-card mechanics are not
enabled in the current ruleset.

Because the web client is statically exported and cannot use the Next image
optimizer, gameplay loads 320×480 WebP renditions from `cards/runtime/` rather
than the 9.5 MB source PNG set. The complete runtime card pack is roughly 412 KB;
the asset sheet continues to preview the full-resolution sources.

## Render in code

These assets are deterministic shapes or text and should be SVG/CSS/canvas, not
generated bitmaps:

- ocean, coastline mask, hex borders, board coordinates, and legal-action glow;
- number tokens, probability pips, 6/8 emphasis, port ratios, and port labels;
- dice faces and roll result;
- player-color rings, selection/hover/invalid states, and connection badges;
- buttons, panels, timers, counters, trade arrows, modal chrome, and chat;
- accessibility patterns that supplement terrain and player color.

## Remaining production backlog

No still-image generation remains. Future implementation may derive lightweight
board and piece motion from the approved still assets. The only unproduced media
inventory is the focused audio backlog below.

The focused music and sound-effect backlog is documented in
[`docs/audio/audio-production-brief.md`](audio/audio-production-brief.md).

## Acceptance checks

- Correct dimensions and RGB/RGBA mode for the asset contract.
- Transparent cutouts and rounded card corners have no chroma fringe.
- A single centered subject with at least 8% padding.
- Terrain silhouettes align closely enough to use one shared clickable hex mask.
- Every terrain alpha uses the exact visible bounds `x=50–461`, `y=77–434` on
  the 512 px source canvas. The renderer gives that footprint a 1–4 px overlap
  so antialiased edges cannot expose ocean seams.
- Icons are distinguishable in grayscale and at target size.
- Piece silhouettes remain distinct after player-color tinting.
- The road source has horizontally aligned endpoints and a gently bowed body;
  the renderer applies only the board edge angle and no asset-specific
  correction.
- No baked-in labels, numbers, ratios, brand marks, or accidental extra objects.
- The full pack reads as one material, camera, lighting, and texture system.
