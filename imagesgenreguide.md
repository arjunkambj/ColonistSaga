# ColonistSaga Image Generation Guide

This file is the visual source of truth for generated ColonistSaga artwork. New assets must look as if they were made by the same artist, for the same game, and with the same physical materials as the finished card set.

## Style anchor

Use the current resource, development, action, award, and redesigned home-menu assets as direct image references whenever possible. Written style descriptions are secondary to those finished assets.

The target look is a premium handcrafted board-game diorama:

- tactile matte clay rather than glossy plastic;
- dense, softly sculpted forms with rounded, slightly worn bevels;
- fine warm surface grain instead of perfectly smooth materials;
- deep walnut-brown ambient occlusion in joints and recesses;
- restrained highlights with no hard synthetic shine;
- substantial, readable silhouettes with limited tiny detail;
- warm, cohesive color grading across every asset category.

Avoid generic mobile-game art, neon colors, candy gloss, flat vectors, photorealism, hard metallic reflections, sterile white surfaces, and unrelated decorative props.

## Core palette

These values are directional anchors, not flat fills. Preserve material variation and warm lighting.

| Role | Anchor | Usage |
| --- | --- | --- |
| Parchment cream | `#F1D8AE` | Stone, plaster, sand, sails, neutral pieces |
| Antique gold | `#D4941E` | Trim, awards, roofs, important interaction cues |
| Deep teal | `#16888A` | Water accents, awnings, flags, glass, navigation |
| Royal purple | `#5A286E` | Development and command accents |
| Moss olive | `#758D2C` | Grass, island terrain, foliage |
| Terracotta | `#C65A35` | Brick, roads, flowers, route markers |
| Cool stone | `#737B80` | Ore, cliffs, neutral rock |
| Walnut | `#4B2D20` | Wood, deep recesses, contact occlusion |
| Board ocean | `#278FA5` | Muted turquoise water; never bright cyan |

Do not use neon lime, lemon yellow, saturated orange, bright cyan, pure white, or featureless black as dominant colors.

## Lighting and rendering

- Use soft upper-left key lighting with broad highlights.
- Keep shadows embedded within the object; transparent assets must not include cast or contact shadows outside their silhouette.
- Use strong but soft ambient occlusion to separate stacked forms.
- Keep highlights warm and restrained.
- Render important shapes with enough depth to remain legible at their final UI size.
- Prefer three-quarter or slightly elevated cameras unless an asset explicitly requires top-down presentation.

## Composition rules

- Use one dominant silhouette and a clear visual hierarchy.
- Center standalone assets with generous transparent padding.
- Keep props grouped tightly instead of scattering them around the canvas.
- Avoid text, labels, badges, card frames, panels, and button treatments inside generated artwork.
- Do not bake backgrounds into transparent UI assets.
- Maintain quiet negative space wherever interface content overlays a full-scene environment.

## Current asset specifications

| Asset group | File | Output |
| --- | --- | --- |
| Coastal environment | `apps/web/public/shared-assets/coastal-island-kingdom-day.png` | 1672×941 RGB PNG |
| Ocean board canvas | `apps/web/public/game-assets/ui/ocean-board-canvas.webp` | 1586×992 RGB WebP |
| Port skiff | `apps/web/public/game-assets/ui/port-skiff.png` | 384×512 RGBA PNG |
| Island shelf | `apps/web/public/game-assets/ui/island-shelf.png` | 1024×1024 RGBA PNG |
| Road piece | `apps/web/public/game-assets/pieces/road-piece.png` | 512×512 RGBA PNG |
| Settlement piece | `apps/web/public/game-assets/pieces/settlement-piece.png` | 512×512 RGBA PNG |
| City piece | `apps/web/public/game-assets/pieces/city-piece.png` | 512×512 RGBA PNG |
| Robber piece | `apps/web/public/game-assets/pieces/robber-piece.png` | 256×256 RGBA PNG |

Player pieces must remain neutral parchment/stone renders. The application applies player color through the asset alpha mask and `mix-blend-mode: color`, so silhouettes, value separation, and ambient-occlusion detail matter more than baked hue.

## Category direction

### Coastal cove

Create a wide handcrafted island panorama with muted deep-teal water, parchment limestone, moss/olive vegetation, ochre roofs and roads, terracotta hills, cool gray mountains, and small wheat fields. Preserve a quiet open-water area for interface content. Keep the scene readable and cohesive rather than filling it with tiny buildings.

### Board utility art

- Ocean canvas: calm top-down water with a quiet center, restrained embossed ripples, subtle depth variation, and slightly darker edges.
- Port skiff: compact ochre-and-walnut trading boat with a parchment sail and deep-teal trim.
- Island shelf: top-down shallow island foundation with a parchment sand lip, faceted limestone rim, and subdued moss accents. The playable terrain covers the center, so perimeter readability is the priority.

### Board pieces

- Road: short sculpted construction beam or cobbled segment with three to five readable divisions.
- Settlement: compact single-house silhouette with a steep roof, doorway, window recesses, and optional small chimney.
- City: clearly larger than the settlement, with a main hall plus tower or secondary roof.
- Robber: neutral dark-slate hooded figure with an empty face opening and a stable faceted base.

## Transparent asset workflow

1. Generate on a perfectly flat chroma-key background.
2. Prefer `#FF00FF` for green, teal, gold, cream, and stone subjects.
3. Choose a different key when the subject includes important purple or magenta areas.
4. The key background must contain no gradient, texture, floor, reflection, or shadow.
5. Remove the key with soft-matte and despill processing.
6. Resize only after background removal.
7. Verify transparent corners, an intact silhouette, opaque interior colors, and no colored fringe on both light and dark backgrounds.

## Reusable prompt structure

```text
Use case: stylized-concept
Asset type: <standalone transparent illustration or environment>
Input images: <identify semantic target and authoritative style references>
Primary request: <function and redesigned concept>
Style/medium: exact ColonistSaga card aesthetic—premium tactile matte clay miniature, warm surface grain, worn rounded bevels, deep walnut ambient occlusion, restrained highlights, substantial forms, and cohesive warm color grading.
Palette: parchment cream, antique honey/ochre gold, deep muted teal, royal purple, moss olive, terracotta, walnut, and cool stone as appropriate.
Composition: <camera, hierarchy, padding, and final-size readability>
Constraints: no text, watermark, unrelated props, generic mobile-game gloss, neon color, card frame, or baked UI treatment.
```

For transparent assets, append:

```text
Scene/backdrop: perfectly flat solid <key color> chroma-key background. One uniform color with no gradient, texture, floor plane, reflection, lighting variation, cast shadow, or contact shadow.
```

## Acceptance checklist

- The asset looks native beside the current card art.
- Palette and material response match the style anchors.
- The concept communicates its game function without a label.
- The silhouette remains clear at its real display size.
- Dimensions, format, and alpha mode match the asset specification.
- Transparent edges have no dark or chroma-colored fringe.
- No obsolete duplicate or versioned asset remains after replacement.
- Consuming paths do not change unless an explicit migration is intended.
