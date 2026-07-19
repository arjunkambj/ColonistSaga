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
  description: "A category-by-category inventory of Catansaga's generated and planned assets.",
  title: "Asset Sheet · Catansaga",
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
    description: "Looping maritime menu soundtrack.",
    format: "MP3 · 256 kbps",
    kind: "audio",
    name: "Main lobby music",
    path: "/music/main-loby-music.mp3",
    status: "generated",
  },
] satisfies readonly AssetItem[];

const ASSET_CATEGORIES = [
  {
    name: "Brand & environments",
    description: "Large scene-setting artwork used behind the login, home, and game views.",
    assets: [
      {
        name: "Catansaga logo",
        description: "Primary illustrated wordmark for authentication screens.",
        format: "PNG · 1648×937",
        path: "/auth-assets/catansaga-logo-v1.png",
        status: "generated",
      },
      {
        name: "Catansaga mark",
        description: "Standalone hexagonal brand mark used for the app icon and favicon.",
        format: "PNG · 1024×1024",
        path: "/shared-assets/catansaga-mark.png",
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
      "Compare available music tracks and track the gameplay sound set still to produce.",
    assets: [
      ...MUSIC_ASSETS,
      {
        name: "Alternate lobby theme",
        description: "A second menu direction for side-by-side music testing.",
        format: "Target · MP3 runtime copy",
        kind: "audio",
        status: "needed",
      },
      {
        name: "In-game ambience",
        description: "A low-intensity loop for active board play.",
        format: "Target · MP3 runtime copy",
        kind: "audio",
        status: "needed",
      },
      ...[
        ["Dice roll", "Tactile two-dice roll and settle."],
        ["Place piece", "Short wood-and-clay placement sound."],
        ["Receive resources", "Warm resource reward flourish."],
        ["Trade complete", "Friendly market exchange confirmation."],
        ["Turn timer", "Low-pressure final-seconds cue."],
        ["Victory", "Bright end-of-game musical sting."],
      ].map(([name, description]) => ({
        name,
        description,
        format: "Target · WAV + runtime copy",
        kind: "audio" as const,
        status: "needed" as const,
      })),
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
