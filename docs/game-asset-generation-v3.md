# ColonistSaga Detailed V7 Board Assets

Generated July 17, 2026 with OpenAI's built-in image generation tool. The current V6 ColonistSaga tile and piece files were used as edit targets. Their canvas purpose, light clay material, camera family, and shared board geometry were retained; the interior terrain detail and piece silhouettes were redesigned.

Every generated source used a perfectly flat `#ff00ff` chroma background. The sources were processed with the installed chroma-removal helper using border auto-key, a soft matte, transparent threshold 12, opaque threshold 220, and despill.

## Shared Terrain Prompt

```text
Use case: precise-object-edit
Asset type: ColonistSaga board terrain hex, V7 refinement
Input images: Image 1 is the edit target and authoritative source for exact canvas, flat-top hex silhouette, honey-gold rim geometry, perspective, scale, padding, material, palette, and lighting.
Primary request: Enrich only the terrain surface details while preserving the exact shared tile geometry. {terrain detail}
Style/medium: polished light casual-game 3D clay; smooth rounded handcrafted forms, subtle surface texture, crisp small-scale readability, friendly upper-left lighting.
Composition/framing: preserve the exact source hex outline, orientation, camera, size, padding, rim thickness, and centered placement. Distribute details asymmetrically around the outer half of the playable surface. Maintain a quiet circular center about 30% of tile width for a code-rendered number medallion.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key outside the hex, one uniform color with no gradient, shadow, floor, or reflection.
Constraints: change only interior terrain richness; keep the rim and base unchanged; all detail stays inside the rim; do not place anything beneath the central token area; no roads, houses, player pieces, badges, numbers, ports, words, logo, watermark, or exterior shadow; do not use #ff00ff in the tile.
Avoid: sparse empty terrain, one lonely prop, symmetrical decoration, crowded center, photorealism, noisy microtexture, hard sharp forms, altered silhouette, duplicated rim.
```

Terrain detail lines:

- Desert: layered wind-cut dunes, scattered sandstone pebbles, dry-grass tufts, and a secondary cactus cluster around the perimeter.
- Fields: curved planted furrows, three varied wheat clusters, tiny seed rows, and subtle terraced field bands.
- Forest: seven rounded conifers in varied heights, bushes, mushrooms, grass tufts, and a small exposed-earth patch.
- Hills: rounded terracotta ridges, eroded gullies, scattered stones, and compact natural clay outcrops.
- Mountains: low blue-gray crags, layered stone shelves, boulder clusters, and restrained pale mineral seams.
- Pasture: three ivory sheep in varied poses, rolling mounds, clover, flowers, grass tufts, and smooth stones.

## Shared Piece Prompt

```text
Use case: precise-object-edit
Asset type: ColonistSaga color-tinted board piece, V7 redesign
Input images: Image 1 is the previous edit target and material/lighting reference only; preserve its warm ivory base material, rounded casual-game finish, camera family, and transparent-asset purpose, but replace the object's design.
Primary request: {piece design}
Style/medium: original polished casual-mobile-game 3D token; smooth matte carved wood and clay; warm creamy ivory base with honey-gold bevel highlights and soft lavender-gray creases; enough relief detail to remain readable after player-color tinting.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for removal, one uniform color with no shadow, gradient, texture, floor, or reflection.
Lighting/mood: bright soft upper-left studio light; restrained internal ambient occlusion only.
Constraints: one isolated opaque board token; cream/ivory neutral base suitable for CSS player tint; crisp silhouette; no terrain, hex tile, number badge, road network, text, logo, watermark, exterior cast shadow, or use of #ff00ff in the subject.
Avoid: photorealism, noisy microdetail, dark materials.
```

Piece design lines:

- Road: one continuous gently bowed horizontal marker made from five interlocking carved sections, with organic joints and tapered end caps; endpoints remain aligned.
- Settlement: one compact island outpost with a folded asymmetric roof, rounded buttresses, deep arched entrance, tiny side canopy, and integrated base.
- City: one cohesive guild-hall city with a taller central hall, attached low wings, arched gate, rounded lookout, and shared sculpted base.

## Final Normalization

- Terrain: 512 × 512 RGBA with the approved shared alpha silhouette at `x=50–461`, `y=77–434`.
- Road: 512 × 512 RGBA.
- Settlement: 512 × 512 RGBA.
- City: 512 × 512 RGBA.
- Review sheet: `docs/game-asset-previews/detailed-pack-v3.png`.
- Board-scale integration preview: `docs/game-asset-previews/detailed-board-v3.png`.

The number markers and port surfaces are code-rendered. Their previous white surfaces were replaced with warm cream gradients and honey-gold edging; number markers now use a compact hexagonal medallion rather than a circular white badge.
