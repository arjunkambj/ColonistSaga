# Reference UI asset plan

This plan maps the supplied login, main-menu, game-table, and action-tray references to the
smallest practical raster set. Stateful UI, frames, text, glass, badges, dice, and board geometry
remain code-native so the game stays responsive and deterministic.

## Image generation inventory

| Asset                                        | Decision       | Project file                                                                                  | Notes                                                                                                     |
| -------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Shared daytime coastal panorama              | Generated      | `apps/web/public/shared-assets/coastal-cove-day-v1.jpg`                                       | 564 KB delivery asset; the generated PNG master remains beside it.                                        |
| Login castle-island centerpiece              | Generated      | `apps/web/public/shared-assets/login-castle-island-v1.avif`                                   | 112 KB transparent delivery asset; generated PNG master retained.                                         |
| Development-card deck icon                   | Generated      | `apps/web/public/game-assets/ui/development-deck-v1.avif`                                     | 36 KB disabled-tile art; generated PNG master retained.                                                   |
| Quick Match illustration                     | Reuse          | `apps/web/public/home-assets/menu/quick-match.png`                                            | Transparent 3D art is clipped into the blue reusable voyage card.                                         |
| Host Island illustration                     | Reuse          | `apps/web/public/home-assets/menu/host-island.png`                                            | Used by the green voyage card.                                                                            |
| Join Crew illustration                       | Reuse          | `apps/web/public/home-assets/menu/join-crew.png`                                              | Transparent 3D map art is clipped into the violet voyage card.                                            |
| Top-down ocean game canvas                   | Reuse          | `apps/web/public/game-assets/ui/ocean-board-canvas-v1.webp`                                   | CSS color grading brings it into the deeper blue reference palette.                                       |
| Six terrain faces                            | Reuse          | `apps/web/public/game-assets/terrain/*.png`                                                   | Kept separate from board state and clipped by the board renderer.                                         |
| Five resource icons                          | Reuse          | `apps/web/public/game-assets/resources/*.png`                                                 | Shared by bank, hand, costs, ports, and log-adjacent UI.                                                  |
| Road, settlement, city, robber, and port art | Reuse          | `apps/web/public/game-assets/pieces/*` and `apps/web/public/game-assets/ui/port-skiff-v1.png` | Remain individually positioned and tinted from live state.                                                |
| Player portraits                             | Reuse          | `apps/web/public/game-assets/players/*`                                                       | Existing human/bot set covers the three-screen reference work.                                            |
| Dedicated red bot portrait                   | Optional later | —                                                                                             | Red currently reuses the orange bot art with a hue treatment; not required for the supplied sample state. |

## Generated panorama prompt

Built-in Imagegen mode was used with the login and main-menu images as composition/style
references.

```text
Use case: stylized-concept
Asset type: shared full-screen game login and home background
Input images: Image 1 is the login-screen composition and world-style reference; Image 2 is the main-menu composition and world-style reference.
Primary request: Create one polished 16:9 daytime Mediterranean fantasy coastal panorama that can sit behind both the Catansaga login panel and the three main-menu cards.
Scene/backdrop: brilliant cobalt sky with large soft white clouds; saturated turquoise sea; warm stone harbor village and red-tile roofs on the left; a tall stone lighthouse on a rugged green cliff on the right; small sailboats and distant islands; lush foreground foliage, flowers, wooden rails, and sunlit rocks at the lower corners.
Style/medium: premium friendly 3D strategy-game environment render, toy-like but richly detailed, matching the supplied references.
Composition/framing: wide landscape; keep the central 48% visually calm and mostly open sea/sky so glass UI remains readable; left village and right lighthouse frame the scene without intruding into the center; horizon near 38% from the top.
Lighting/mood: bright warm late-morning sun, joyful, adventurous, clear atmospheric depth, subtle depth of field at the extreme foreground only.
Color palette: deep blue, cyan, emerald green, warm limestone, terracotta roofs, small purple flowers.
Constraints: environment only; no UI, no card frames, no logos, no symbols, no people, no text, no watermark; preserve a clean 16:9 composition and strong readable center negative space.
Avoid: dusk or night, orange sunset, empty generic Greek cliffs, flat illustration, photorealism, dark center, duplicated lighthouse, blurry central sea.
```

## Generated login-island prompt

Built-in Imagegen mode used the login reference for the island's subject and proportions. A
second deterministic chroma-field pass made the transparent-alpha extraction reliable.

```text
Use case: login-screen hero artwork for a polished multiplayer board-game web UI.
Reference: use the supplied login screenshot only for the hero island's composition, proportions, color language, and friendly premium 3D style. Do not copy any logo, text, button, panel, or UI.
Primary request: create one isolated floating coastal game island, shown in a slightly elevated three-quarter view. The island should feature a broad warm-gray stone castle/tower complex as the focal point, a small wooden dock and boat, clustered pine and round-canopy trees, rocky grass shoreline, a narrow bright-blue water ring, two tiny white seabirds, and subtle golden window accents.
Composition: centered asset, broad horizontal silhouette, approximately 1.25:1 width-to-height; all scenery fully inside the canvas with generous empty margin; no cropped objects.
Style: premium stylized 3D mobile strategy-game illustration, clean rounded geometry, crisp beveled forms, saturated but cohesive colors, soft cool daylight, gentle ambient occlusion, polished toy-like finish.
Background: transparent alpha only.
Text: none.
Constraints: no people, no UI, no logo, no labels, no frame, no checkerboard pattern, no watermark, no separate loose objects.
Output: high-resolution PNG with true transparent background, suitable for placement at roughly 320px wide on a dark-blue login panel.
```

```text
Edit this exact island asset. Preserve the castle island, dock, boat, birds, trees, rocks, water, lighting, scale, and centered composition. Replace every checkerboard background square outside the island artwork with one perfectly uniform flat chroma-magenta color #FF00FF, edge to edge. The background must contain no checker pattern, texture, gradient, shadow, glow, vignette, border, or extra objects. Do not tint or alter the island itself. Keep the full canvas and all subjects unchanged. No text or watermark.
```

## Generated development-deck prompt

Built-in Imagegen mode used the action-card reference for the isolated deck artwork. The visible
tile is intentionally disabled because development-card commands are not present in the rules
engine.

```text
Use case: isolated artwork inside a reusable game action tile.
Reference: use only the development-card deck artwork in the second action card of the supplied screenshot for subject, camera angle, proportions, and premium 3D style. Do not reproduce the surrounding card frame, UI text, badge, cost row, or background.
Primary request: create a compact stack of three slightly fanned dark-navy development cards, angled in a three-quarter view. The front card has one raised polished gold hexagonal coin/medallion with a subtle starburst emblem; the rear cards have simple gold edge accents.
Composition: centered, compact near-square silhouette; object fully inside the canvas with generous margin; readable at 64px.
Style: polished stylized 3D mobile strategy-game icon, clean bevels, saturated navy and warm gold, cool rim light, soft object shadow, crisp readable edges.
Background: one perfectly uniform flat chroma-magenta #FF00FF edge to edge.
Text: none.
Constraints: no UI tile, no frame, no labels, no numbers, no people, no extra objects, no checkerboard, no gradient or texture in the background, no watermark.
Output: square high-resolution PNG suitable for chroma-keying to transparent alpha and displaying in a 7rem action tile.
```

## Code-native presets

- `LiquidGlass`: panel/card/control variants, ocean/quick/host/join/neutral tones, four radii.
- `VoyageCard`: reusable reference-style mode card with illustration, badge, copy, and action affordance.
- Game action tiles: reusable dock/poster preset applied to Trade, the disabled Development Deck,
  Road, Settlement, City, and End Turn controls.
- All remaining glass panels, header pills, player rows, number tokens, dice, and navigation use CSS or SVG icons. Resource and action cards use generated artwork with code-rendered labels, values, costs, and states.
