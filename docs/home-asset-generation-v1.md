# Home Asset Generation V1

The Catansaga home artwork was generated with OpenAI's built-in image generation tool, then prepared locally for the web UI. The Twosheep screenshot was used only as a broad mood reference for an inviting scenic game menu; its scenery, composition, branding, and menu layout were explicitly excluded.

## Shipped Assets

- `apps/web/public/home-assets/island-bay-v1.webp` — original 1920 × 1080 coastal home backdrop
- `apps/web/public/home-assets/menu/quick-match.png` — transparent dice, road, and island illustration
- `apps/web/public/home-assets/menu/host-island.png` — transparent lighthouse illustration
- `apps/web/public/home-assets/menu/join-crew.png` — transparent island map and compass illustration
- `docs/game-asset-previews/home-menu-v1.png` — review sheet
- `docs/game-asset-previews/home-screen-v1.png` — implemented desktop UI preview

## Background Prompt

```text
Use case: stylized-concept
Asset type: Catansaga full-screen home background
Input images: Image 1 is a broad mood reference only for an inviting scenic game-menu backdrop; do not reproduce its mountains, houses, layout, logo area, menu positions, or identifiable scenery. Image 2 is Catansaga's authoritative reference for light pastel color, rounded modeling, honey-gold accents, smooth clay/plastic material, and friendly casual-game polish.
Primary request: Create an original wide sunlit island-coast landscape for Catansaga's home screen.
Scene/backdrop: a sweeping turquoise bay between two low rounded green islands, distant warm cream sea cliffs, tiny terracotta-roof settlement shapes far in the background, curved meadow terraces in the foreground, a winding pale path toward the water, and a bright airy sky with a few soft rounded clouds. This is a coastal island setting, not an alpine valley.
Style/medium: polished light casual-mobile-game environment illustration; painterly 3D with broad rounded clay-like forms, simplified vegetation, smooth gradients, restrained detail, and the same cheerful material family as the Catansaga reference.
Composition/framing: wide cinematic landscape intended to crop responsively to 16:9. Keep the middle-left sky and meadow visually calm for a headline; keep the middle-right bay and sky calm for translucent menu cards. Place richer scenery mainly along the lower edge and distant horizon. Strong depth but no single central emblem.
Lighting/mood: bright soft morning light, welcoming and adventurous, gentle peach-gold highlights, cool clean atmospheric haze.
Color palette: sky cyan, turquoise water, spring and emerald greens, warm cream cliffs, honey gold, small coral accents, pale lavender shadows.
Constraints: fully original scenery; no interface; no menu tiles; no logo; no mascot; no people; no readable signs; no text; no numbers; no watermark; no frame.
Avoid: copying the mood reference's composition, snow mountains, chalet, dramatic sharp peaks, photorealism, dark shadows, heavy texture, dense clutter behind UI, board-game pieces floating in the sky.
```

## Menu Illustration Prompt

Each illustration was generated separately with this shared prompt and one subject line.

```text
Use case: stylized-concept
Asset type: Catansaga home-menu illustration
Input images: Image 1 is the authoritative Catansaga asset reference for rounded modeling, honey-gold accents, pastel surfaces, smooth clay/plastic materials, lighting, and small-scale readability. Image 2 is the new Catansaga home landscape reference for palette and atmosphere only.
Primary request: Create {subject}.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for local background removal; one uniform color with no shadow, gradient, texture, reflection, floor plane, or lighting variation.
Style/medium: original polished light casual-mobile-game 3D icon; broad rounded toy-like forms; smooth matte clay/plastic; minimal texture; bright upper-left light and friendly proportions.
Composition/framing: one centered isolated compact icon group, three-quarter front view, balanced silhouette, fills about 72% of a square canvas, at least 12% clear padding, fully visible.
Lighting/mood: bright, cheerful, adventurous; shallow internal ambient shading only.
Color palette: spring green, turquoise, warm cream, honey gold, coral accents, pale lavender shadows; never use #ff00ff in the subject.
Constraints: completely original; no menu card; no surrounding hex frame; no label; no letters; no text; no number; no logo; no watermark; no cast or contact shadow outside the subject; no extra objects.
Avoid: copying the reference menu icons, dark realistic materials, noisy detail, heavy outlines, photorealism, duplicate objects, cluttered silhouettes.
```

Subject lines:

- Quick Match: `two rounded ivory dice with teal and coral pips resting beside one short coral road on a tiny spring-green hexagonal island base; energetic but compact`
- Host Island: `one friendly cream lighthouse with a honey-gold roof and small teal pennant standing on a compact rounded grassy islet; simple strong silhouette`
- Join Crew: `one folded turquoise island map with a warm honey-gold compass overlapping the lower corner and a short coral dotted route with two round markers; adventurous and immediately readable`

## Processing

The icon backgrounds were removed with the image-generation skill's chroma-key helper using border key detection, a soft matte, and despill. Visible artwork was cropped, centered, and resized onto a 512 × 512 transparent canvas. The background was cropped to 16:9, resized to 1920 × 1080, and encoded as WebP.
