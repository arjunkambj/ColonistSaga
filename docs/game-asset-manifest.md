# Catansaga v1 game asset manifest

## Art direction

Catansaga uses an original light casual-mobile-game style inspired by the
provided UI references: rounded clay/plastic forms, pastel surfaces, warm
highlights, honey-gold terrain rims, short ambient shading, clean silhouettes,
and readable detail at small sizes. It must not copy another game's branding,
artwork, icons, or UI.

All generated gameplay art must:

- use a consistent top-down three-quarter camera;
- contain no words, numbers, logos, borders, UI chrome, or watermarks;
- keep important detail away from crop edges;
- have a transparent background and clean alpha edge;
- remain legible at 64 px for icons and 160 px for board tiles;
- use code-rendered labels and player colors for accessibility and localization.

## Generate now: default Base board pack

| ID                | File                    | Purpose                     | Target        |
| ----------------- | ----------------------- | --------------------------- | ------------- |
| terrain-fields    | `terrain/fields.png`    | Wheat-producing hex         | 512×512 RGBA  |
| terrain-forest    | `terrain/forest.png`    | Tree-producing hex          | 512×512 RGBA  |
| terrain-hills     | `terrain/hills.png`     | Brick-producing hex         | 512×512 RGBA  |
| terrain-mountains | `terrain/mountains.png` | Stone-producing hex         | 512×512 RGBA  |
| terrain-pasture   | `terrain/pasture.png`   | Sheep-producing hex         | 512×512 RGBA  |
| terrain-desert    | `terrain/desert.png`    | Non-producing robber hex    | 512×512 RGBA  |
| resource-tree     | `resources/tree.png`    | Inventory and trade icon    | 256×256 RGBA  |
| resource-brick    | `resources/brick.png`   | Inventory and trade icon    | 256×256 RGBA  |
| resource-sheep    | `resources/sheep.png`   | Inventory and trade icon    | 256×256 RGBA  |
| resource-wheat    | `resources/wheat.png`   | Inventory and trade icon    | 256×256 RGBA  |
| resource-stone    | `resources/stone.png`   | Inventory and trade icon    | 256×256 RGBA  |
| piece-road        | `pieces/road.png`       | Neutral tintable road token | 256×256 RGBA  |
| piece-settlement  | `pieces/settlement.png` | Neutral tintable settlement | 256×256 RGBA  |
| piece-city        | `pieces/city.png`       | Neutral tintable city       | 256×256 RGBA  |
| piece-robber      | `pieces/robber.png`     | Neutral robber pawn         | 256×256 RGBA  |
| ui-trade-caravan  | `ui/trade-caravan.png`  | Domestic trade modal art    | 1672×941 RGBA |

The neutral road, settlement, and city are authored in warm ivory so the client
can apply the four accessible player colors consistently rather than depending
on separately generated variants.

The trade caravan is an original transparent illustration derived from the
provided casual-game UI references. It contains no text or interactive chrome;
all labels, offer values, response states, and controls remain code-rendered.

The desert is the sixth terrain type but is not a resource. The resource system
contains exactly five values: tree, brick, sheep, wheat, and stone.

## Render in code

These assets are deterministic shapes or text and should be SVG/CSS/canvas, not
generated bitmaps:

- ocean, coastline mask, hex borders, board coordinates, and legal-action glow;
- number tokens, probability pips, 6/8 emphasis, port ratios, and port labels;
- dice faces and roll result;
- player-color rings, selection/hover/invalid states, and connection badges;
- buttons, panels, cards, timers, counters, trade arrows, modal chrome, and chat;
- accessibility patterns that supplement terrain and player color.

## Generate later, when the matching feature is implemented

- five development-card illustrations and one hidden card back;
- Longest Road and Largest Army award art;
- player avatar set;
- victory/result flourishes;
- optional ambient ocean details such as rocks, foam, and coastal plants;
- sound effects for dice, placing pieces, receiving resources, trade, timer, and
  victory;
- lightweight board/piece animations derived from the approved still assets.

## Acceptance checks

- Correct dimensions and RGBA mode.
- Transparent corners with no chroma fringe.
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
