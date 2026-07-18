# Catansaga Player Portraits V1

Generated July 18, 2026 with OpenAI's built-in image generation tool. These
opaque 1:1 portraits give each player seat a recognizable character while all
names, status, scores, and controls remain code-rendered.

## Shared Prompt

```text
Use case: stylized-concept
Asset type: Catansaga player HUD portrait, square 1:1 raster badge
Style/medium: polished original casual-game 3D clay illustration, rounded handcrafted forms, warm soft upper-left lighting, crisp silhouette and facial readability at 48px
Composition/framing: centered shoulders-up portrait, facing slightly toward camera, generous breathing room, no crop through head, simple circular island-sky backdrop contained inside the square
Constraints: one original adult island explorer, friendly confident expression, no text, no letters, no logo, no watermark, no weapons, no board-game pieces, no copyrighted character or franchise likeness, opaque finished background, cohesive with bright honey-gold and turquoise Catansaga UI
```

## Seat Variants

- Red navigator: a warm, adventurous woman harbor navigator with dark wavy
  hair, a subtle red scarf, and a practical ivory sailing jacket.
- Blue cartographer: a calm, inventive man island cartographer with short black
  hair, round spectacles, a subtle blue neckerchief, and an ivory field jacket.
- Orange builder: a cheerful, capable woman village builder with warm brown
  skin, braided hair tied back, a subtle orange bandana, and an ivory work
  jacket.
- Green botanist: a thoughtful, optimistic man island botanist with auburn hair
  and a short beard, a subtle green scarf, and an ivory explorer jacket.

## Project Files

- `apps/web/public/game-assets/players/red-navigator-v1.png`
- `apps/web/public/game-assets/players/blue-cartographer-v1.png`
- `apps/web/public/game-assets/players/orange-builder-v1.png`
- `apps/web/public/game-assets/players/green-botanist-v1.png`

Each selected source was resized to 256 × 256 PNG for the HUD. The original
generated sources remain in the Codex generated-images directory.

## Bot Portraits V2

The bot seats now use unmistakably robotic portraits so players can distinguish
people from automated opponents at a glance. These were generated with
OpenAI's built-in image generation tool in `stylized-concept` mode as opaque
512 × 512 PNGs.

```text
Create one square, polished painterly maritime board-game portrait containing
one unmistakably friendly robot character. Keep the face near 68% of the frame,
use a strong color-coded circular ring and simple matching background, and make
the silhouette readable at 48 px. No text, logo, watermark, human character,
weapon, or background clutter.
```

- `apps/web/public/game-assets/players/bot-blue-v2.png`: blue navigator robot.
- `apps/web/public/game-assets/players/bot-orange-v2.png`: orange shipwright robot.
- `apps/web/public/game-assets/players/bot-green-v2.png`: green botanist robot.
