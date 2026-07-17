# Catansaga light V6 asset generation

Generated July 17, 2026 with the built-in image generation tool. The supplied
screens 1–5 were style-only references; screen 6 was the current board and
composition reference. No reference was treated as an edit target.

Every source used a perfectly flat `#ff00ff` chroma background with no floor,
shadow, gradient, texture, or reflection. Sources were processed with the
installed chroma-removal helper using border auto-key, soft matte, threshold
12, opaque threshold 220, and despill.

## Shared art direction

```text
Use case: stylized-concept
Style/medium: original light polished casual-mobile-game 3D illustration;
broad rounded forms; smooth matte clay/plastic; gentle pastel highlights;
minimal texture; bright soft upper-left studio light; cheerful, readable,
clean silhouettes; no text, numbers, UI, logos, watermarks, or exterior shadow.
```

## Terrain prompt set

The desert was generated first as the master. Every other terrain prompt used
that master as the exact geometry, rim, camera, lighting, padding, material,
and composition reference.

```text
desert: pale creamy sand, a slim honey-gold raised rim, two shallow rounded
dune impressions, three tiny pebbles, and one compact cactus in the upper
third. Keep the center and lower two-thirds smooth and empty.

fields: soft harvest-yellow surface, two compact rounded wheat sheaves, and
three shallow curved harvest marks in the upper third.

forest: fresh medium emerald surface, three compact rounded evergreen trees,
and two tiny grass tufts in the upper third.

hills: light coral/terracotta surface, two shallow rounded clay ridges, and one
small three-brick stack in the upper third.

mountains: light cool blue-gray surface, one compact cluster of three low
rounded boulders, and two shallow stone ridges in the upper third.

pasture: light spring-green surface, two small rounded ivory sheep with beige
faces, and two tiny grass tufts in the upper third.
```

Shared terrain constraints: centered regular flat-top hex, exact shared outer
geometry, all six corners visible, no perspective skew, quiet center, no
central circle, token, road, building, port, or content outside the rim.

## Resource prompt set

Each resource used its matching generated terrain as the authoritative palette,
material, lighting, and detail reference.

```text
tree: one evergreen with a short brown trunk and three rounded green tiers.
brick: exactly three rounded coral bricks, two below and one above.
sheep: one full-body ivory sheep with beige face, ears, and four short legs.
wheat: one tied sheaf of five golden stalks with broad rounded kernels.
stone: exactly three low rounded blue-gray stones with broad soft facets.
```

Shared resource constraints: one centered isolated object, three-quarter view,
about 72% canvas fill, at least 12% padding, readable at 40–64 px, no card,
tile, frame, badge, text, label, or extra objects.

## Piece prompt set

```text
road: one perfectly straight horizontal segment made from three tightly joined
rounded ivory wooden planks on a single centerline; identical rounded ends.

settlement: one compact ivory cottage with square base, centered door, pitched
roof, and tiny chimney.

city: one compact upgraded token with a shared low base, one two-story hall,
one attached shorter house, two pitched roofs, one door, and two tiny windows;
only slightly larger than the settlement; no castle, towers, flags, or plinth.

robber: one compact charcoal/slate hooded pawn with a rounded head, narrow neck,
wide tapered cloak base, no face, and no limbs.
```

Shared piece constraints: one centered isolated toy-like token, strong small-
scale silhouette, no terrain, frame, badge, text, number, UI, logo, watermark,
extra object, or exterior shadow.

## Final normalization

- Terrain: 512×512 RGBA, exact alpha bounds `x=50–461`, `y=77–434`.
- Resources: 256×256 RGBA, contained within a 204×204 center box.
- Road: 256×256 RGBA, exact horizontal bounds `x=12–243`, `y=101–154`.
- Settlement/city/robber: 256×256 RGBA, centered and size-normalized.
