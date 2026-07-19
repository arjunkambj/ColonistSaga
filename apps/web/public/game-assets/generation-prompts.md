# ColonistSaga default Base asset generation prompts

> The current detailed V7 terrain and piece refinement is documented in
> `docs/game-asset-generation-v3.md`. It supersedes the V6 terrain, road,
> settlement, and city prompts below.

> The current light V6 pack was generated on July 17, 2026. Its authoritative
> references and prompt set are recorded in
> `docs/game-asset-generation-v2.md`. The material below documents earlier
> generation passes and is retained only as iteration history.

All 15 sources were generated with the built-in `image_gen` mode. The supplied
Colonist screenshot was inspected as a style reference only; it was not used as
an edit target. Each source used a flat chroma-key backdrop and was processed
with the installed `remove_chroma_key.py` helper using border auto-key, soft
matte, despill, transparent threshold 12, and opaque threshold 220.

## V5 resource-matched terrain pack

The final terrain pack was regenerated from one flat-top desert master. The
approved resource icons were used as the primary modeling, material, lighting,
and proportion reference. Every derived tile preserves the master's exact
silhouette, golden rim, shallow base, camera, scale, padding, and open center.

### `terrain/desert.png` V5 master

```text
Create a clean flat-top desert master matching the resource icons' polished rounded 3D clay, smooth broad forms, warm upper-left light, and friendly proportions. Use pale warm sand, two shallow dune impressions, one small rounded cactus, and two pebbles grouped near the upper edge. Keep the center and lower two-thirds open and unmarked. Preserve one slim golden rim and shallow base. No center circle, token, number, text, UI, or watermark.
```

### `terrain/fields.png` V5 edit

```text
Preserve the desert master's exact geometry. Use saturated harvest-gold clay with one compact wheat sheaf, a smaller wheat cluster, and a few shallow harvest marks only in the upper third. Keep the center smooth and empty. No dunes, center circle, token, number, text, UI, or watermark.
```

### `terrain/forest.png` V5 edit

```text
Preserve the desert master's exact geometry. Use deep emerald clay with three compact rounded evergreen trees and two tiny grass tufts only in the upper third. Match the approved tree resource's friendly tiered modeling. Keep the center smooth and empty. No center circle, token, number, text, UI, or watermark.
```

### `terrain/hills.png` V5 edit

```text
Preserve the desert master's exact geometry. Use coral-red terracotta clay with two shallow natural ridges and one compact three-brick stack only in the upper third. Match the approved brick resource's rounded proportions. Keep the center smooth and empty. No center circle, token, number, text, UI, or watermark.
```

### `terrain/mountains.png` V5 edit

```text
Preserve the desert master's exact geometry and golden rim. Use cool slate-gray clay with one three-boulder cluster and two very low stone ridges only in the upper third. Match the approved stone resource's broad friendly facets. Keep the center smooth and empty. No center circle, token, number, text, UI, or watermark.
```

### `terrain/pasture.png` V5 edit

```text
Preserve the desert master's exact geometry. Use fresh spring-green clay with two small ivory sheep and two tiny grass tufts only in the upper third. Match the approved sheep resource's rounded wool, beige face, ears, and short legs. Keep the center smooth and empty. No center circle, token, number, text, UI, or watermark.
```

## Terrain replacements after independent review

The independent review rejected all six original terrain tiles because they did
not share one mask/camera system. The replacements also used built-in
`image_gen`. The resource prompts later in this file describe the current
five-resource pack and supersede earlier processed-material concepts.

The V2 desert was generated as the master terrain reference with this locked
base specification:

```text
512×512 RGBA PNG on a removable perfectly flat chroma background. One centered flat-top hex terrain tile using one exact master outer silhouette and pixel footprint: approximately 8% horizontal and 12% vertical padding. Friendly softly rounded handmade clay, fixed top-down three-quarter camera, warm upper-left key light, short soft ambient shadow, identical low rim and shallow base thickness. Keep a calm circular area around the exact center for a code-rendered number token or game piece. No words, numbers, icons, logos, UI, border graphic, water, ports, extra game pieces, or watermark. Clean antialiased edges with no colored fringe.
```

The other five terrain images were generated as edits derived from that same V2
desert source, with the exact outer silhouette, footprint, rim, base thickness,
camera, lighting, center area, and padding preserved.

### `terrain/desert.png` V2 master

```text
Use the locked terrain base. Sculpt a warm sandy desert with two or three low wind-shaped dunes and a few small rounded stones placed toward the perimeter. Leave the center visibly open and level for the robber. Match the same rim, camera, lighting, contrast, and footprint used by all other terrain tiles. Use a perfectly flat solid #00ff00 chroma background; do not use the key color in the subject.
```

### `terrain/fields.png` V2 edit

```text
Edit the V2 desert master while preserving its exact outer silhouette, footprint, low rim, shallow base, camera, lighting, center token circle, and padding. Replace only the terrain surface/content with golden grain fields, shallow curved furrows, and two compact wheat clusters biased away from the center. Preserve an uncluttered central token area. Avoid a flat embossed illustration; use the same soft clay depth and detail scale as the master. Use a perfectly flat solid #00ff00 chroma background; do not use the key color in the subject.
```

### `terrain/hills.png` V2 edit

```text
Edit the V2 desert master while preserving its exact flat-top outer silhouette, footprint, low rim, shallow base, camera, lighting, center token circle, and padding. Replace only the terrain surface/content with several low terracotta clay hills and shallow layered cuts around a clear center. Reduce orange saturation and peak height so the tile matches the shared visual weight. Use a perfectly flat solid #00ff00 chroma background; do not use the key color in the subject.
```

### `terrain/mountains.png` V2 edit

```text
Edit the V2 desert master while preserving its exact flat-top outer silhouette, footprint, low rim, shallow base, camera, lighting, center token circle, and padding. Replace only the terrain surface/content with three compact low gray clay mountains or ore outcrops around a clear central token area. Avoid tall peaks and hard realistic facets. Use the same rounded clay shader and warm shared light. Use a perfectly flat solid #00ff00 chroma background; do not use the key color in the subject.
```

### `terrain/forest.png` V3 edit

```text
Edit the V2 desert master while preserving its exact flat-top outer silhouette, footprint, low rim, shallow base, camera, lighting, padding, and composition. Replace only the terrain surface/content with four compact rounded evergreen trees and sparse ground plants around, not on, the central token area. The entire hex interior, including the calm center, must be continuous solid opaque green clay terrain. The center is a level low-detail green clay surface, not a cutout, hole, transparent area, circle graphic, or chroma color. Keep the greens light enough for board readability. Use a perfectly flat solid #0000ff exterior chroma background; do not use blue in the subject.
```

### `terrain/pasture.png` V3 edit

```text
Edit the V2 desert master while preserving its exact flat-top outer silhouette, footprint, low rim, shallow base, camera, lighting, padding, and composition. Replace only the terrain surface/content with a softly textured green pasture, two small rounded sheep, and sparse low plants placed away from the center. The entire hex interior, including the calm center, must be continuous solid opaque green clay terrain. The center is a level low-detail green clay surface, not a cutout, hole, transparent area, circle graphic, or chroma color. Use a restrained spring-green palette. Use a perfectly flat solid #0000ff exterior chroma background; do not use blue in the subject.
```

## terrain/fields.png

```text
Use case: stylized-concept
Asset type: ColonistSaga board-game terrain hex tile
Primary request: Create one original grain-producing fields terrain hex for a digital tabletop strategy game.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal; one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Subject: a single regular hexagonal clay terrain tile with a warm golden ochre soil surface, shallow hand-sculpted furrows, and a few compact clusters of ripe golden wheat; no green foliage.
Style/medium: polished friendly 3D clay tabletop diorama, softly rounded handmade forms, subtle clay texture, original unbranded art.
Composition/framing: centered isolated regular hex silhouette, consistent top-down three-quarter camera with vertical axis aligned, tile fills about 78% of the square canvas, all six corners fully visible, generous equal padding.
Lighting/mood: soft warm upper-left studio light affecting only the subject, gentle ambient occlusion within the tile details; no cast or contact shadow onto the background.
Color palette: golden yellow, ochre, warm tan; do not use #00ff00 anywhere in the subject.
Materials/textures: matte modeling clay with restrained handmade texture, readable at 160 px.
Constraints: exact clean hex outline compatible with a shared clickable hex mask; crisp separated edges; a single centered subject; no border, no token, no numbers, no words, no logos, no watermark, no UI, no ocean, no coastline, no extra loose objects outside the tile.
Avoid: branded game artwork, photorealism, busy micro-detail, crop, perspective distortion, background shadow, green color.
```

## terrain/forest.png

```text
Use case: stylized-concept
Asset type: ColonistSaga board-game terrain hex tile
Primary request: Create one original lumber-producing forest terrain hex for a digital tabletop strategy game.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for background removal; one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Subject: a single regular hexagonal clay terrain tile with a deep evergreen-green forest floor and five compact rounded conifer trees arranged as one readable woodland cluster; keep trees inside the hex silhouette.
Style/medium: polished friendly 3D clay tabletop diorama, softly rounded handmade forms, subtle clay texture, original unbranded art.
Composition/framing: centered isolated regular hex silhouette, consistent top-down three-quarter camera with vertical axis aligned, tile fills about 78% of the square canvas, all six corners fully visible, generous equal padding.
Lighting/mood: soft warm upper-left studio light affecting only the subject, gentle ambient occlusion within the tile details; no cast or contact shadow onto the background.
Materials/textures: matte modeling clay with restrained handmade texture, readable at 160 px.
Constraints: exact clean hex outline compatible with a shared clickable hex mask; crisp separated edges; a single centered subject; no border, no token, no numbers, no words, no logos, no watermark, no UI, no ocean, no coastline, no extra loose objects outside the tile.
Avoid: branded game artwork, photorealism, busy micro-detail, crop, perspective distortion, background shadow.
Color palette: pine green, teal green, earthy brown; do not use #ff00ff anywhere in the subject.
```

## terrain/hills.png

```text
Use case: stylized-concept
Asset type: ColonistSaga board-game terrain hex tile
Primary request: Create one original brick-producing hills terrain hex for a digital tabletop strategy game.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal; one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Subject: a single regular hexagonal clay terrain tile with layered rounded terracotta hills, shallow gullies, and small clay-rock ridges; no bricks, buildings, plants, or loose objects outside the tile.
Style/medium: polished friendly 3D clay tabletop diorama, softly rounded handmade forms, subtle clay texture, original unbranded art.
Composition/framing: centered isolated regular hex silhouette, consistent top-down three-quarter camera with vertical axis aligned, tile fills about 78% of the square canvas, all six corners fully visible, generous equal padding.
Lighting/mood: soft warm upper-left studio light affecting only the subject, gentle ambient occlusion within the tile details; no cast or contact shadow onto the background.
Materials/textures: matte modeling clay with restrained handmade texture, readable at 160 px.
Constraints: exact clean hex outline compatible with a shared clickable hex mask; crisp separated edges; a single centered subject; no border, no token, no numbers, no words, no logos, no watermark, no UI, no ocean, no coastline, no extra loose objects outside the tile.
Avoid: branded game artwork, photorealism, busy micro-detail, crop, perspective distortion, background shadow.
Color palette: burnt coral, terracotta, rust, warm sienna; do not use #00ff00 anywhere in the subject.
```

## terrain/mountains.png

```text
Use case: stylized-concept
Asset type: ColonistSaga board-game terrain hex tile
Primary request: Create one original ore-producing mountains terrain hex for a digital tabletop strategy game.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal; one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Subject: a single regular hexagonal clay terrain tile with three chunky rounded slate-gray mountain peaks, layered rocky foothills, and a cool gray stone base; no snow, vegetation, ore nuggets, or loose objects outside the tile.
Style/medium: polished friendly 3D clay tabletop diorama, softly rounded handmade forms, subtle clay texture, original unbranded art.
Composition/framing: centered isolated regular hex silhouette, consistent top-down three-quarter camera with vertical axis aligned, tile fills about 78% of the square canvas, all six corners fully visible, generous equal padding.
Lighting/mood: soft warm upper-left studio light affecting only the subject, gentle ambient occlusion within the tile details; no cast or contact shadow onto the background.
Materials/textures: matte modeling clay with restrained handmade texture, readable at 160 px.
Constraints: exact clean hex outline compatible with a shared clickable hex mask; crisp separated edges; a single centered subject; no border, no token, no numbers, no words, no logos, no watermark, no UI, no ocean, no coastline, no extra loose objects outside the tile.
Avoid: branded game artwork, photorealism, busy micro-detail, crop, perspective distortion, background shadow.
Color palette: slate gray, blue-gray, charcoal, muted lavender-gray; do not use #00ff00 anywhere in the subject.
```

## terrain/pasture.png

```text
Use case: stylized-concept
Asset type: ColonistSaga board-game terrain hex tile
Primary request: Create one original wool-producing pasture terrain hex for a digital tabletop strategy game.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for background removal; one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Subject: a single regular hexagonal clay terrain tile with a fresh spring-green pasture surface, soft low rolling mounds, small clover-like tufts, and two tiny rounded ivory clay sheep resting safely inside the hex.
Style/medium: polished friendly 3D clay tabletop diorama, softly rounded handmade forms, subtle clay texture, original unbranded art.
Composition/framing: centered isolated regular hex silhouette, consistent top-down three-quarter camera with vertical axis aligned, tile fills about 78% of the square canvas, all six corners fully visible, generous equal padding.
Lighting/mood: soft warm upper-left studio light affecting only the subject, gentle ambient occlusion within the tile details; no cast or contact shadow onto the background.
Color palette: spring green, moss green, warm ivory, muted brown; do not use #ff00ff anywhere in the subject.
Materials/textures: matte modeling clay with restrained handmade texture, readable at 160 px.
Constraints: exact clean hex outline compatible with a shared clickable hex mask; crisp separated edges; a single centered subject; no border, no token, no numbers, no words, no logos, no watermark, no UI, no ocean, no coastline, no extra loose objects outside the tile.
Avoid: branded game artwork, photorealism, busy micro-detail, crop, perspective distortion, background shadow.
```

## terrain/desert.png

```text
Use case: stylized-concept
Asset type: ColonistSaga board-game terrain hex tile
Primary request: Create one original desert terrain hex for a digital tabletop strategy game, serving as the robber starting terrain.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal; one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Subject: a single regular hexagonal clay terrain tile with warm pale sand, three broad wind-shaped dune ridges, a few small rounded sandstone pebbles embedded in the surface, and subtle dry cracks; no cactus, plants, bones, robber, token, or loose objects outside the tile.
Style/medium: polished friendly 3D clay tabletop diorama, softly rounded handmade forms, subtle clay texture, original unbranded art.
Composition/framing: centered isolated regular hex silhouette, consistent top-down three-quarter camera with vertical axis aligned, tile fills about 78% of the square canvas, all six corners fully visible, generous equal padding.
Lighting/mood: soft warm upper-left studio light affecting only the subject, gentle ambient occlusion within the tile details; no cast or contact shadow onto the background.
Color palette: pale sand, honey beige, warm sandstone, cream; do not use #00ff00 anywhere in the subject.
Materials/textures: matte modeling clay with restrained handmade texture, readable at 160 px.
Constraints: exact clean hex outline compatible with a shared clickable hex mask; crisp separated edges; a single centered subject; no border, no token, no numbers, no words, no logos, no watermark, no UI, no ocean, no coastline, no extra loose objects outside the tile.
Avoid: branded game artwork, photorealism, busy micro-detail, crop, perspective distortion, background shadow.
```

## resources/tree.png

```text
Use case: stylized-concept
Asset type: ColonistSaga inventory and trade resource icon
Primary request: Create one original standalone resource icon representing TREE / WOOD, matching the direct tree symbol shown in the reference resource-card row without copying its UI or artwork.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local removal; no shadow, gradient, texture, reflection, or floor.
Subject: one compact healthy evergreen tree with a short visible brown trunk and three clearly separated rounded tiers of green clay foliage; a single tree only, not logs, timber, a forest, or a terrain tile.
Style/medium: original friendly polished 3D clay tabletop-game icon; softly rounded handmade forms; subtle matte clay texture.
Composition/framing: centered isolated subject, top-down three-quarter camera, at least 10% padding.
Constraints: readable at 64px; no card, frame, label, text, number, logo, watermark, UI, ground, rocks, other trees, or extra objects.
```

## resources/brick.png

```text
Use case: stylized-concept
Asset type: ColonistSaga inventory and trade resource icon
Primary request: Create one original standalone resource icon representing BRICK, matching the direct brick symbol in the reference resource-card row without copying its UI or artwork.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal; no shadow, gradient, texture, reflection, or floor.
Subject: one compact stack of three rounded terracotta clay bricks, two on the bottom and one centered on top; clearly separated brick shapes with shallow top indent lines.
Style/medium: original friendly polished 3D clay tabletop-game icon; softly rounded handmade forms; subtle matte clay texture.
Composition/framing: centered isolated subject, top-down three-quarter camera, at least 10% padding.
Constraints: readable at 64px; no card, frame, text, number, logo, watermark, UI, ground, mortar, building, or extra objects.
```

## resources/sheep.png

```text
Use case: stylized-concept
Asset type: ColonistSaga inventory and trade resource icon
Primary request: Create one original standalone resource icon representing SHEEP, matching the direct sheep symbol in the reference resource-card row without copying its UI or artwork.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal; no shadow, gradient, texture, reflection, or floor.
Subject: one small full-body ivory sheep in side three-quarter view, with a compact rounded cloud-like wool body, clearly visible beige face, two small ears, and four short legs; a single sheep only.
Style/medium: original friendly polished 3D clay tabletop-game icon; softly rounded handmade forms; subtle matte clay texture.
Composition/framing: centered isolated subject, top-down three-quarter camera, at least 10% padding.
Constraints: unmistakable at 64px; no card, frame, text, number, logo, watermark, UI, grass, ground, fence, second animal, or extra objects.
```

## resources/wheat.png

```text
Use case: stylized-concept
Asset type: ColonistSaga inventory and trade resource icon
Primary request: Create one original standalone resource icon representing WHEAT, matching the direct wheat symbol in the reference resource-card row without copying its UI or artwork.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal; no shadow, gradient, texture, reflection, or floor.
Subject: one compact upright golden wheat sheaf with five thick stalks, large readable rounded grain kernels, and a simple warm-brown tie; no green leaves.
Style/medium: original friendly polished 3D clay tabletop-game icon; softly rounded handmade forms; subtle matte clay texture.
Composition/framing: centered isolated subject, top-down three-quarter camera, at least 10% padding.
Constraints: readable at 64px; no card, frame, text, number, logo, watermark, UI, field, bread, sack, or extra objects.
```

## resources/stone.png

```text
Use case: stylized-concept
Asset type: ColonistSaga inventory and trade resource icon
Primary request: Create one original standalone resource icon representing STONE, matching the direct stone symbol in the reference resource-card row without copying its UI or artwork.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for local removal; no shadow, gradient, texture, reflection, or floor.
Subject: one compact cluster of three rounded gray stones in different sizes, arranged as a stable low pile; broad simple facets, clearly stone rather than metallic ore.
Style/medium: original friendly polished 3D clay tabletop-game icon; softly rounded handmade forms; subtle matte clay texture.
Composition/framing: centered isolated subject, top-down three-quarter camera, at least 10% padding.
Constraints: readable at 64px; no card, frame, text, number, logo, watermark, UI, ground, sparkles, ore crystals, pickaxe, or extra objects.
```

## pieces/robber.png

```text
Use case: stylized-concept
Asset type: ColonistSaga board-game robber pawn token
Primary request: Create one original neutral robber pawn for blocking a terrain hex.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background for background removal; one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Subject: one abstract charcoal clay pawn with a low rounded circular foot, tapered faceted body, narrow collar, and smooth oval top; dignified simple silhouette, no face, hands, weapons, clothing, or character details.
Style/medium: polished friendly 3D clay tabletop-game piece, softly rounded handmade form, subtle clay texture, original unbranded art.
Composition/framing: single centered upright isolated subject, consistent top-down three-quarter camera facing slightly right, fills about 66% of square canvas, generous equal padding, complete silhouette.
Lighting/mood: soft warm upper-left studio light on subject only, gentle self-occlusion; no cast or contact shadow on background.
Color palette: charcoal, graphite gray, muted slate; do not use #00ff00 anywhere in the subject.
Materials/textures: matte modeling clay, restrained texture, strong readable silhouette at 64 px.
Constraints: one fused pawn silhouette; no base disk separate from the pawn, no ground, no words, no numbers, no logos, no watermark, no UI, no extra objects.
Avoid: branded game piece designs, photorealism, human figure, hooded character, crop, background shadow, green color.
```

## ui/trade-caravan.png

```text
Use case: reference-guided image edit
References: the supplied bright casual-game home screen and character-selection images, used only for softness, palette, and material cues.
Asset type: ColonistSaga decorative domestic-trade modal illustration.
Primary request: Create one original cheerful island trading caravan: a compact blue-and-gold wooden handcart piled with timber logs, red bricks, wheat sheaves, a wool bundle, and rounded stone, with a rolled map and a small balance scale suggesting fair exchange.
Style/medium: polished friendly casual-mobile-game illustration with softly rounded clay forms, pale warm highlights, clean silhouettes, and playful proportions; original unbranded design.
Composition/framing: isolated three-quarter view, cart facing right, complete silhouette, no cropped wheels or cargo, no ground plane.
Scene/backdrop: perfectly flat #ff00ff chroma-key background for local alpha removal.
Constraints: no words, numbers, logos, watermark, UI panels, characters, coins, gems, branded board-game imagery, or extra scenery.
```

## ui/ocean-board-canvas-v2.webp

Generated with OpenAI's built-in image generation tool. The supplied board screenshot was a
style and mood reference only, not an edit target. The generated PNG was converted to a
production WebP with Sharp at quality 86.

```text
Use case: stylized-concept
Asset type: responsive game-board background texture for a web game
Primary request: Generate only the open turquoise ocean background seen behind the board in Image 1. Image 1 is a style and mood reference, not an edit target. Remove the entire board, islands, hex tiles, ports, pieces, avatars, labels, buttons, and all UI.
Scene/backdrop: uninterrupted bright tropical blue water filling the full canvas edge to edge
Style/medium: polished friendly mobile-game 3D illustration, soft clay-like rendering, subtle painterly softness matching Image 1
Composition/framing: wide landscape canvas; center 75% must stay visually quiet and unobstructed for a large board overlay; evenly usable at different responsive crops
Lighting/mood: cheerful daylight, luminous aqua glow, gentle depth
Color palette: cyan, turquoise, pale sky blue, restrained white highlights
Materials/textures: very subtle broad underwater gradients, sparse soft ripples and faint caustic highlights, slightly blurred so the board remains dominant
Constraints: background layer only; seamless-looking edge-to-edge water; no horizon; no shoreline; no sand; no rocks; no islands; no objects; no text; no symbols; no frame; no border; no watermark; no UI; no hexagons
Avoid: photorealism, noisy wave texture, sharp highlights, dark navy patches, busy center, vignette, land in corners
```

## ui/port-skiff-v1.png

Generated with OpenAI's built-in image generation tool on a flat `#ff00ff` background, then converted to RGBA with the image-generation skill's chroma-removal helper using a soft matte, despill, and a one-pixel edge contraction.

```text
Use case: stylized-concept
Asset type: reusable ColonistSaga board-game port marker cutout
Input images: the supplied board UI with sailing port markers is a composition reference only; the polished clay board screenshot is a material/style reference; the newly generated turquoise ocean is a palette reference. None is an edit target.
Primary request: Create one original tiny friendly island trading skiff used as a harbor marker around a hex board.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local removal; one uniform color with no shadow, gradient, texture, reflection, floor plane, water, or lighting variation.
Subject: one compact front-three-quarter wooden skiff with a rounded warm-wood hull, tiny teal trim, one short mast, and one broad blank cream sail; the boat points upward and slightly right. Keep the middle of the sail quiet and empty because a live resource icon will be overlaid there in code.
Style/medium: polished casual strategy-game 3D clay token; softly rounded handcrafted shapes; friendly, premium, high readability at 56 px.
Composition/framing: centered isolated boat, complete silhouette, generous even padding, upright portrait footprint.
Lighting/mood: bright soft upper-left studio light on subject only; restrained internal ambient occlusion.
Color palette: honey wood, cream sail, teal trim, tiny golden accents; do not use #ff00ff in the subject.
Constraints: single opaque boat only; blank sail; no letters, numbers, resource icons, anchor, flag text, logo, watermark, ocean, dock, rope extending outside silhouette, exterior cast shadow, or extra objects.
Avoid: pirate ship, realistic ship rigging, thin fragile lines, photorealism, dark mood, cropped sail or hull.
```

## ui/market-trade-v1.png

Generated with OpenAI's built-in image generation tool on a flat `#ff00ff` background, then converted to a normalized 256×256 RGBA PNG with the chroma-removal helper.

```text
Use case: stylized-concept
Asset type: ColonistSaga action-dock game UI icon, transparent cutout source
Input images: Image 1 is a resource-card hierarchy reference; Image 2 is an action-dock composition reference; Image 3 is a player-banner hierarchy reference; Image 4 is a turn-banner and dice reference. All are references only, not edit targets, and their artwork must not be copied.
Primary request: Create one original compact MARKET TRADE action icon for a friendly multiplayer island strategy game.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local removal; one uniform color with no shadow, gradient, texture, reflection, floor plane, or lighting variation.
Subject: a small teal-and-gold merchant satchel with a rolled cream map tucked inside and two bold curved exchange arrows crossing on the front; one cohesive fused icon silhouette.
Style/medium: polished casual-game 3D clay icon matching ColonistSaga's rounded terrain and resource assets; tactile, cheerful, premium, immediately readable at 48–64 px.
Composition/framing: centered isolated icon, front three-quarter view, square footprint, complete silhouette, 12% even padding.
Lighting/mood: bright soft upper-left studio light on subject only; restrained internal ambient occlusion.
Color palette: teal, sea-glass blue, honey gold, warm cream; do not use #ff00ff in the subject.
Constraints: one icon only; no card frame, no button background, no hands, no characters, no letters, no numbers, no logo, no watermark, no island scenery, no exterior cast shadow, no extra objects.
Avoid: copying reference icons, photorealism, thin arrows, dark colors, tiny detail, cropped silhouette.
```

## ui/end-turn-hourglass-v1.png

Generated with OpenAI's built-in image generation tool on a flat `#ff00ff` background, then converted to a normalized 256×256 RGBA PNG with the chroma-removal helper.

```text
Use case: stylized-concept
Asset type: ColonistSaga action-dock game UI icon, transparent cutout source
Input images: the four supplied UI screenshots are hierarchy and action-dock references only; the newly generated market satchel is the authoritative style, material, camera, padding, lighting, and palette reference. None is an edit target.
Primary request: Create one original compact END TURN icon for a friendly multiplayer island strategy game.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local removal; one uniform color with no shadow, gradient, texture, reflection, floor plane, or lighting variation.
Subject: one chunky upright hourglass with a honey-gold rounded frame, teal glass chambers, and warm cream sand mostly collected in the bottom chamber; strong simple silhouette.
Style/medium: same polished casual-game 3D clay icon as the market satchel; rounded handcrafted forms, tactile, cheerful, premium, immediately readable at 48–64 px.
Composition/framing: centered isolated icon, front three-quarter view, square footprint, complete silhouette, 12% even padding.
Lighting/mood: bright soft upper-left studio light on subject only; restrained internal ambient occlusion.
Color palette: honey gold, teal, sea-glass blue, warm cream; do not use #ff00ff in the subject.
Constraints: one icon only; no card frame, no button background, no hands, no characters, no letters, no numbers, no arrows, no logo, no watermark, no scenery, no exterior cast shadow, no extra objects.
Avoid: copying reference icons, photorealism, thin fragile frame, dark colors, tiny detail, cropped silhouette.
```

## pieces/road.png

Generated with OpenAI's built-in image generation tool in `stylized-concept`
mode on a pure `#ff00ff` chroma-key background. The selected source was
converted to a transparent, tightly padded 512 × 512 PNG with the
image-generation skill's soft-matte chroma removal helper.

```text
Create one ultra-minimal board-game ROAD token only: a single short, straight,
horizontal wooden beam made from exactly three broad joined rectangular
segments with gently rounded corners. Use a chunky physical-pawn silhouette,
warm ivory wood, one amber side face, a thin dark navy-brown outline, flat
polished 3D shading, and almost no texture. It must remain readable at 16 px.
Center the complete object with 16% empty margin on a perfectly flat #ff00ff
background. No curve, cobblestones, planks, grain, cracks, bolts, scenery,
shadow, text, logo, watermark, or extra objects.
```

## pieces/settlement.png

Generated and normalized with the same `stylized-concept`, chroma-key, soft
matte, padding, and 512 × 512 workflow as `road.png`.

```text
Create one ultra-minimal board-game SETTLEMENT token only: exactly two primary
shapes, a compact square body and one simple steep triangular roof, plus one
small centered arched doorway. Use a chunky physical-pawn silhouette, warm
ivory front, one amber side face, a thin dark navy-brown outline, flat polished
3D shading, and no surface texture. Center the complete object on a perfectly
flat #ff00ff background. No porch, windows, chimney, fence, steps, shingles,
bricks, scenery, cast shadow, text, logo, watermark, or extra objects.
```

## pieces/city.png

Generated and normalized with the same `stylized-concept`, chroma-key, soft
matte, padding, and 512 × 512 workflow as the other minimalist piece tokens.

```text
Create one ultra-minimal board-game CITY token only: exactly three simple fused
blocks, one taller central house block with a triangular roof and two shorter
side blocks. Use a compact upgraded-settlement silhouette, warm ivory fronts,
amber side faces, a thin dark navy-brown outline, flat polished 3D shading, and
almost no detail. Center the complete object on a perfectly flat #ff00ff
background. No towers, spires, battlements, windows, chimney, bricks, scenery,
cast shadow, text, logo, watermark, or extra objects.
```
