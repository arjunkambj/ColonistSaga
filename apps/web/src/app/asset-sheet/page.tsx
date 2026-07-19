import arrowLeftIcon from "@iconify-icons/solar/arrow-left-line-duotone";
import checkIcon from "@iconify-icons/solar/check-circle-bold-duotone";
import clockIcon from "@iconify-icons/solar/clock-circle-bold-duotone";
import imageIcon from "@iconify-icons/solar/gallery-bold-duotone";
import { Icon } from "@iconify/react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { LiquidGlass } from "@/components/ui/liquid-glass";

import { AssetCard, type AssetCardItem } from "./asset-card";
import styles from "./asset-sheet.module.css";
import { ThemeToggle } from "./theme-toggle";

export const metadata: Metadata = {
  description: "A category-by-category inventory of ColonistSaga's generated and planned assets.",
  title: "Asset Sheet · ColonistSaga",
};

interface AssetItem extends AssetCardItem {
  description: string;
  format: string;
}

interface AssetCategory {
  assets: readonly AssetItem[];
  description: string;
  name: string;
}

const MUSIC_ASSETS = [
  {
    description: "Current looping maritime soundtrack for the home and lobby screens.",
    format: "MP3 · 256 kbps",
    kind: "audio",
    name: "Main lobby music",
    path: "/music/main-loby-music.mp3",
    status: "generated",
  },
  {
    description: "Second lobby loop for side-by-side music testing.",
    format: "Target · 48 kHz WAV + runtime copy",
    kind: "audio",
    name: "Alternate lobby theme",
    status: "needed",
  },
  {
    description: "Focused loop for snake-order settlement and road placement.",
    format: "Target · 48 kHz WAV + runtime copy",
    kind: "audio",
    name: "Opening placement music",
    status: "needed",
  },
  {
    description: "Low-fatigue loop for ordinary dice, resource, building, and trade turns.",
    format: "Target · 48 kHz WAV + runtime copy",
    kind: "audio",
    name: "In-game ambience",
    status: "needed",
  },
  {
    description: "More active companion loop for later rounds; crossfade from in-game ambience.",
    format: "Target · 48 kHz WAV + runtime copy",
    kind: "audio",
    name: "In-game momentum theme",
    status: "needed",
  },
  {
    description: "Short danger sting when a seven activates the robber.",
    format: "Target · 48 kHz WAV + runtime copy",
    kind: "audio",
    name: "Seven revealed sting",
    status: "needed",
  },
  {
    description: "Warm end-of-game music for the local winner.",
    format: "Target · 48 kHz WAV + runtime copy",
    kind: "audio",
    name: "Victory music",
    status: "needed",
  },
  {
    description: "Respectful result cue when another player wins.",
    format: "Target · 48 kHz WAV + runtime copy",
    kind: "audio",
    name: "Other player victory music",
    status: "needed",
  },
  {
    description: "Neutral result cue for a draw.",
    format: "Target · 48 kHz WAV + runtime copy",
    kind: "audio",
    name: "Draw music",
    status: "needed",
  },
] satisfies readonly AssetItem[];

const SOUND_EFFECT_ASSETS = [
  ["Button press", "Tactile feedback for ordinary buttons, tabs, and build-mode controls."],
  [
    "Primary action",
    "Confident confirmation for Roll Dice, Start Game, discard, and trade actions.",
  ],
  ["Action accepted", "Generic success feedback when no more specific gameplay cue applies."],
  ["Action rejected", "Gentle validation or connection error feedback."],
  ["Modal open", "Paper-and-canvas transition for trade, setup, and information panels."],
  ["Modal close", "Short counterpart for closing or cancelling a panel."],
  ["Stepper and toggle", "Quiet repeatable feedback for resource counts and game settings."],
  ["Copy room code", "Small confirmation when a private room code is copied."],
  ["Room joined", "Welcoming cue when the local player enters a room."],
  ["Player joined", "Social cue when another player takes a visible lobby seat."],
  ["Player left", "Neutral cue when a lobby seat becomes empty."],
  ["Bot joined", "Warm clockwork cue when a bot fills a seat."],
  ["Build the island", "Transition from the room into the playable board."],
  ["Your turn", "Once-per-handoff notification that the viewer can act."],
  ["Turn passes", "Subtle feedback when the local player successfully ends a turn."],
  ["Dice shake", "Loopable two-dice texture from roll press until the server result arrives."],
  ["Dice land", "Tactile settle when the confirmed dice total appears."],
  ["Receive resources", "One bundle reward for the viewer after production or setup."],
  ["Tree resource accent", "Optional quiet texture when selecting or receiving timber."],
  ["Brick resource accent", "Optional quiet texture when selecting or receiving brick."],
  ["Sheep resource accent", "Optional quiet texture when selecting or receiving wool."],
  ["Wheat resource accent", "Optional quiet texture when selecting or receiving grain."],
  ["Stone resource accent", "Optional quiet texture when selecting or receiving ore."],
  [
    "Legal target selected",
    "Precise feedback when a valid road, settlement, or city target is chosen.",
  ],
  ["Road placed", "Confirmed board sound for a newly placed road."],
  ["Settlement placed", "Confirmed board sound for a newly placed settlement."],
  ["City upgraded", "Meaningful, non-victory cue for upgrading a settlement."],
  ["Discard required", "Alert for players required to discard after a seven."],
  ["Cards discarded", "Confirmed resource-card discard into the supply."],
  ["Robber moved", "Dark pawn movement when the robber relocates to a tile."],
  ["Resource stolen", "Private positive feedback for the player who successfully steals."],
  ["Resource lost", "Private, restrained feedback for the robbed player."],
  ["Market opens", "Friendly opening cue for the bank and player trade center."],
  ["Trade offer sent", "Social feedback when a player trade proposal is confirmed."],
  ["Trade offer received", "Notice for an invited player to respond to a trade."],
  ["Trade complete", "Shared confirmation when a player trade is accepted."],
  ["Trade declined", "Private feedback when an invited player declines an offer."],
  ["Trade cancelled", "Quiet feedback when the proposer withdraws an offer."],
  ["Bank or harbor trade", "Resource exchange confirmation using the best available bank rate."],
  ["Turn timer", "Low-pressure countdown tick for the final ten seconds."],
  ["Final timer tick", "Slightly more urgent final-three-seconds countdown tick."],
  ["Time expired", "Clear but non-punitive cue when the action deadline passes."],
  ["Connection interrupted", "Recoverable real-time connection warning."],
  ["Reconnected", "Reassuring cue when the game session is restored."],
  ["Victory transition", "Brief transition into the local winner result screen."],
  ["Return home", "Quiet exit from results back to the home screen."],
].map(([name, description]) => ({
  name,
  description,
  format: "Target · 48 kHz WAV + runtime copy",
  kind: "audio" as const,
  status: "needed" as const,
}));

const ASSET_CATEGORIES = [
  {
    name: "Brand & environments",
    description: "Large scene-setting artwork used behind the login, home, and game views.",
    assets: [
      {
        name: "ColonistSaga logo",
        description: "Primary illustrated wordmark for authentication screens.",
        format: "PNG · 1666×944",
        path: "/auth-assets/colonistsaga-logo-v1.png",
        status: "generated",
      },
      {
        name: "ColonistSaga mark",
        description: "Standalone hexagonal brand mark used for the app icon and favicon.",
        format: "PNG · 1024×1024",
        path: "/shared-assets/colonistsaga-mark.png",
        status: "generated",
      },
      {
        name: "Harbor at dusk",
        description: "Full-width authentication background.",
        fit: "cover",
        format: "WebP · 1672×941",
        path: "/auth-assets/island-harbor-dusk-v1.webp",
        status: "generated",
      },
      {
        name: "Island bay",
        description: "Bright coastal background for the home screen.",
        fit: "cover",
        format: "WebP · 1920×1080",
        path: "/home-assets/island-bay-v1.webp",
        status: "generated",
      },
      {
        name: "Blue archipelago",
        description: "Alternate home and lobby panorama.",
        fit: "cover",
        format: "WebP · 1748×899",
        path: "/home-assets/blue-archipelago-v2.webp",
        status: "generated",
      },
      {
        name: "Coastal cove",
        description: "Shared daytime coastal panorama.",
        fit: "cover",
        format: "JPG · 1672×941",
        path: "/shared-assets/coastal-cove-day-v1.jpg",
        status: "generated",
      },
      {
        name: "Castle island",
        description: "Floating login centerpiece with transparent edges.",
        format: "AVIF · transparent",
        path: "/shared-assets/login-castle-island-v1.avif",
        status: "generated",
      },
      {
        name: "Ocean board canvas",
        description: "Water backdrop beneath the playable board.",
        fit: "cover",
        format: "WebP · 1672×941",
        path: "/game-assets/ui/ocean-board-canvas-v1.webp",
        status: "generated",
      },
    ],
  },
  {
    name: "Home menu",
    description: "Illustrations and navigation artwork used by the main menu.",
    assets: [
      {
        name: "Quick match",
        description: "Dice, road, and island illustration.",
        format: "PNG · 512×512",
        path: "/home-assets/menu/quick-match.png",
        status: "generated",
      },
      {
        name: "Host island",
        description: "Lighthouse illustration for room creation.",
        format: "PNG · 512×512",
        path: "/home-assets/menu/host-island.png",
        status: "generated",
      },
      {
        name: "Join crew",
        description: "Map and compass illustration for joining a room.",
        format: "PNG · 512×512",
        path: "/home-assets/menu/join-crew.png",
        status: "generated",
      },
    ],
  },
  {
    name: "Terrain tiles",
    description: "The six top-down hex illustrations in the base board pack.",
    assets: [
      ["Fields", "Wheat-producing farmland hex.", "/game-assets/terrain/fields.png"],
      ["Forest", "Tree-producing woodland hex.", "/game-assets/terrain/forest.png"],
      ["Hills", "Brick-producing clay hills hex.", "/game-assets/terrain/hills.png"],
      ["Mountains", "Stone-producing mountain hex.", "/game-assets/terrain/mountains.png"],
      ["Pasture", "Sheep-producing grassland hex.", "/game-assets/terrain/pasture.png"],
      ["Desert", "Non-producing robber hex.", "/game-assets/terrain/desert.png"],
    ].map(([name, description, path]) => ({
      name,
      description,
      format: "PNG · 512×512",
      path,
      status: "generated" as const,
    })),
  },
  {
    name: "Bottom resource icons",
    description: "Compact symbols used in the bottom HUD, counters, costs, and trade controls.",
    assets: [
      ["Tree icon", "Timber symbol for the bottom HUD.", "/game-assets/resources/tree.png"],
      ["Brick icon", "Brick symbol for the bottom HUD.", "/game-assets/resources/brick.png"],
      ["Sheep icon", "Sheep symbol for the bottom HUD.", "/game-assets/resources/sheep.png"],
      ["Wheat icon", "Wheat symbol for the bottom HUD.", "/game-assets/resources/wheat.png"],
      ["Stone icon", "Stone symbol for the bottom HUD.", "/game-assets/resources/stone.png"],
    ].map(([name, description, path]) => ({
      name,
      description,
      format: "PNG · 256×256",
      path,
      status: "generated" as const,
    })),
  },
  {
    name: "Resource cards",
    description: "Full portrait card artwork paired with the compact bottom resource icons.",
    assets: [
      ["Tree card", "Forest-and-timber card artwork."],
      ["Brick card", "Clay-hills-and-brick card artwork."],
      ["Sheep card", "Pasture-and-sheep card artwork."],
      ["Wheat card", "Golden-fields-and-wheat card artwork."],
      ["Stone card", "Mountain-and-stone card artwork."],
    ].map(([name, description]) => ({
      name,
      description: `${description} Labels and counts remain code-rendered.`,
      format: "Target · 512×768 RGBA",
      status: "needed" as const,
    })),
  },
  {
    name: "Placement & action icons",
    description: "Compact artwork used inside board-placement and bottom action controls.",
    assets: [
      {
        name: "Road icon",
        description: "Road placement icon and player-tintable board piece.",
        format: "PNG · 512×512",
        path: "/game-assets/pieces/road.png",
        status: "generated",
      },
      {
        name: "Settlement icon",
        description: "House placement icon and player-tintable board piece.",
        format: "PNG · 512×512",
        path: "/game-assets/pieces/settlement.png",
        status: "generated",
      },
      {
        name: "City icon",
        description: "City upgrade icon and player-tintable board piece.",
        format: "PNG · 512×512",
        path: "/game-assets/pieces/city.png",
        status: "generated",
      },
      {
        name: "Robber icon",
        description: "Robber movement icon and neutral board pawn.",
        format: "PNG · 256×256",
        path: "/game-assets/pieces/robber.png",
        status: "generated",
      },
      {
        name: "Trade icon",
        description: "Market artwork for domestic and bank trading controls.",
        format: "PNG · 256×256",
        path: "/game-assets/ui/market-trade-v1.png",
        status: "generated",
      },
      {
        name: "End turn icon",
        description: "Hourglass artwork for the end-turn control.",
        format: "PNG · 256×256",
        path: "/game-assets/ui/end-turn-hourglass-v1.png",
        status: "generated",
      },
    ],
  },
  {
    name: "Placement & action cards",
    description: "Full card artwork for the bottom action dock, beyond the compact icons.",
    assets: [
      ["Trade card", "Market scene for opening bank or player trade."],
      ["Road card", "Road-building card for edge placement."],
      ["Settlement card", "House card for settlement placement."],
      ["City card", "City-upgrade card for replacing a settlement."],
      ["End turn card", "Hourglass card for completing the active turn."],
    ].map(([name, description]) => ({
      name,
      description: `${description} Title, cost, count, and state remain code-rendered.`,
      format: "Target · 512×768 RGBA",
      status: "needed" as const,
    })),
  },
  {
    name: "Board utility art",
    description: "Supporting illustrations that do not belong to the placement-card set.",
    assets: [
      {
        name: "Development deck",
        description: "Disabled deck action tile illustration.",
        format: "AVIF · transparent",
        path: "/game-assets/ui/development-deck-v1.avif",
        status: "generated",
      },
      {
        name: "Port skiff",
        description: "Small boat used to dress board ports.",
        format: "PNG · 384×512",
        path: "/game-assets/ui/port-skiff-v1.png",
        status: "generated",
      },
      {
        name: "Trade caravan",
        description: "Domestic trade modal illustration.",
        format: "PNG · 1672×941",
        path: "/game-assets/ui/trade-caravan.png",
        status: "generated",
      },
    ],
  },
  {
    name: "Player portraits",
    description: "Human portraits designed to remain readable in the compact HUD.",
    assets: [
      [
        "Red navigator",
        "Human red-seat portrait.",
        "/game-assets/players/red-navigator-v1.png",
        "PNG · 256×256",
      ],
      [
        "Blue cartographer",
        "Human blue-seat portrait.",
        "/game-assets/players/blue-cartographer-v1.png",
        "PNG · 256×256",
      ],
      [
        "Orange builder",
        "Human orange-seat portrait.",
        "/game-assets/players/orange-builder-v1.png",
        "PNG · 256×256",
      ],
      [
        "Green botanist",
        "Human green-seat portrait.",
        "/game-assets/players/green-botanist-v1.png",
        "PNG · 256×256",
      ],
    ].map(([name, description, path, format]) => ({
      name,
      description,
      format,
      path,
      status: "generated" as const,
    })),
  },
  {
    name: "Development cards",
    description: "Planned card illustrations for when development-card rules are enabled.",
    assets: [
      ["Knight", "Armored island guardian illustration."],
      ["Road building", "Road-building expedition illustration."],
      ["Year of plenty", "Abundant island harvest illustration."],
      ["Monopoly", "Merchant treasury illustration."],
      ["Victory point", "Hidden victory achievement illustration."],
      ["Hidden card back", "Shared concealed development-card back."],
    ].map(([name, description]) => ({
      name,
      description,
      format: "Target · portrait RGBA",
      status: "needed" as const,
    })),
  },
  {
    name: "Awards & results",
    description: "Milestone and end-of-game art planned for the results experience.",
    assets: [
      {
        name: "Longest Road",
        description: "Award illustration for the longest connected route.",
        format: "Target · square RGBA",
        status: "needed",
      },
      {
        name: "Largest Army",
        description: "Award illustration for the strongest knight force.",
        format: "Target · square RGBA",
        status: "needed",
      },
      {
        name: "Victory flourish",
        description: "Celebratory crown, rays, and confetti treatment.",
        format: "Target · wide RGBA",
        status: "needed",
      },
      {
        name: "Result scene",
        description: "End-of-game island tableau behind the scoreboard.",
        format: "Target · 16:9 WebP",
        status: "needed",
      },
    ],
  },
  {
    name: "Board ambience",
    description: "Optional details that add life without affecting board readability.",
    assets: [
      {
        name: "Coastal rocks",
        description: "Small isolated rock clusters for open ocean spaces.",
        format: "Target · transparent PNG",
        status: "needed",
      },
      {
        name: "Foam accents",
        description: "Subtle shoreline and wake accent set.",
        format: "Target · transparent PNG",
        status: "needed",
      },
      {
        name: "Coastal plants",
        description: "Compact flowers and grasses for board edges.",
        format: "Target · transparent PNG",
        status: "needed",
      },
    ],
  },
  {
    name: "Audio",
    description:
      "Production checklist for the current Catan-style rules: turns, dice, resources, building, the seven/discard/robber flow, trade, timers, and results.",
    assets: [...MUSIC_ASSETS, ...SOUND_EFFECT_ASSETS],
  },
  {
    name: "Brand foundations",
    description:
      "The implemented visual system behind every screen. These are code-defined foundations, so no artwork generation is required.",
    assets: [
      {
        name: "Display typography",
        description:
          "Georgia anchors game titles, the logo lockup, and card headings with a warm, tabletop-editorial voice.",
        format: "Georgia · 700–900 · system serif",
        kind: "brand",
        previewText: "Build your island",
        status: "generated",
      },
      {
        name: "Interface typography",
        description:
          "Inter is the legible workhorse for rules, room status, resources, and quick in-turn decisions; system sans fallbacks keep it resilient.",
        format: "Inter · 400–900 · system sans fallback",
        kind: "brand",
        previewText: "Roll dice · Trade · Build",
        status: "generated",
      },
      {
        name: "Island light palette",
        description:
          "Paper-white surfaces, slate ink, harvest gold, and lagoon cyan provide the clear daytime board and action hierarchy.",
        format: "#F4F9FF · #33405A · #F5AD3F · #25BFCA",
        kind: "brand",
        status: "generated",
        swatches: ["#F4F9FF", "#33405A", "#F5AD3F", "#25BFCA"],
      },
      {
        name: "Ocean dark palette",
        description:
          "Deep ocean blue, cloud-white type, warm token gold, and bright cyan feedback preserve contrast around the board at night.",
        format: "#063A78 · #F4F9FF · #FFD15A · #54D8FF",
        kind: "brand",
        status: "generated",
        swatches: ["#063A78", "#F4F9FF", "#FFD15A", "#54D8FF"],
      },
      {
        name: "Player seat colors",
        description:
          "Red, blue, orange, and green remain reserved for player ownership across pieces, HUDs, and activity states.",
        format: "#F04F49 · #2F8EE8 · #F18C2C · #2FB86A",
        kind: "brand",
        status: "generated",
        swatches: ["#F04F49", "#2F8EE8", "#F18C2C", "#2FB86A"],
      },
    ],
  },
] satisfies readonly AssetCategory[];

const assetTotals = ASSET_CATEGORIES.reduce(
  (totals, category) =>
    category.assets.reduce(
      (categoryTotals, asset) => ({
        ...categoryTotals,
        [asset.status]: categoryTotals[asset.status] + 1,
      }),
      totals,
    ),
  { generated: 0, needed: 0 },
);

export default function AssetSheetPage() {
  return (
    <main className={styles.page} id="main-content">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerActions}>
            <Link className={styles.backLink} href="/">
              <Icon aria-hidden="true" icon={arrowLeftIcon} width={16} />
              Back to game
            </Link>
            <ThemeToggle />
          </div>

          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Production inventory</p>
            <h1>Game asset sheet</h1>
          </div>

          <div className={styles.summary} aria-label="Asset totals">
            <SummaryItem
              icon={<Icon aria-hidden="true" icon={checkIcon} />}
              label="Generated"
              tone="ready"
              value={assetTotals.generated}
            />
            <SummaryItem
              icon={<Icon aria-hidden="true" icon={clockIcon} />}
              label="Need to generate"
              tone="needed"
              value={assetTotals.needed}
            />
            <SummaryItem
              icon={<Icon aria-hidden="true" icon={imageIcon} />}
              label="Categories"
              tone="neutral"
              value={ASSET_CATEGORIES.length}
            />
          </div>
        </header>

        <div className={styles.categories}>
          {ASSET_CATEGORIES.map((category) => (
            <AssetCategoryRow category={category} key={category.name} />
          ))}
        </div>
      </div>
    </main>
  );
}

function SummaryItem({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: "needed" | "neutral" | "ready";
  value: number;
}) {
  return (
    <LiquidGlass className={styles.summaryItem} data-tone={tone} kind="control" radius="sm">
      <span className={styles.summaryIcon}>{icon}</span>
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </LiquidGlass>
  );
}

function AssetCategoryRow({ category }: { category: AssetCategory }) {
  const generatedCount = category.assets.filter((asset) => asset.status === "generated").length;

  return (
    <section className={styles.category} aria-labelledby={`category-${toId(category.name)}`}>
      <div className={styles.categoryHeader}>
        <div>
          <h2 id={`category-${toId(category.name)}`}>{category.name}</h2>
          <p>{category.description}</p>
        </div>
        <span className={styles.categoryCount}>
          {generatedCount}/{category.assets.length} ready
        </span>
      </div>

      <div className={styles.assetRow}>
        {category.assets.map((asset) => (
          <AssetCard asset={asset} key={`${category.name}-${asset.name}`} />
        ))}
      </div>
    </section>
  );
}

function toId(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
}
