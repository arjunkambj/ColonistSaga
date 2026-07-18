import { Card, Chip } from "@heroui/react";
import { ArrowLeft, CheckCircle2, Clock3, ImageIcon, Music2, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./asset-sheet.module.css";

export const metadata: Metadata = {
  description: "A category-by-category inventory of Catansaga's generated and planned assets.",
  title: "Asset Sheet · Catansaga",
};

type AssetStatus = "generated" | "needed";
type AssetKind = "audio" | "image";

interface AssetItem {
  description: string;
  fit?: "contain" | "cover";
  format: string;
  kind?: AssetKind;
  name: string;
  path?: string;
  status: AssetStatus;
}

interface AssetCategory {
  assets: readonly AssetItem[];
  description: string;
  name: string;
}

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
      {
        name: "Destination icons",
        description: "Five-cell navigation strip for secondary destinations.",
        fit: "cover",
        format: "JPG · 1774×887",
        path: "/shared-assets/destination-icons-v1.jpg",
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
    name: "Resource icons",
    description: "Compact inventory and trading symbols for the five resources.",
    assets: [
      ["Tree", "Timber resource icon.", "/game-assets/resources/tree.png"],
      ["Brick", "Brick resource icon.", "/game-assets/resources/brick.png"],
      ["Sheep", "Sheep resource icon.", "/game-assets/resources/sheep.png"],
      ["Wheat", "Wheat resource icon.", "/game-assets/resources/wheat.png"],
      ["Stone", "Stone resource icon.", "/game-assets/resources/stone.png"],
    ].map(([name, description, path]) => ({
      name,
      description,
      format: "PNG · 256×256",
      path,
      status: "generated" as const,
    })),
  },
  {
    name: "Board pieces",
    description: "Neutral, player-tintable pieces plus the robber pawn.",
    assets: [
      {
        name: "Road V2",
        description: "Current detailed road source used by the action dock.",
        format: "PNG · 512×512",
        path: "/game-assets/pieces/road-v2.png",
        status: "generated",
      },
      {
        name: "Settlement V2",
        description: "Current detailed settlement source.",
        format: "PNG · 512×512",
        path: "/game-assets/pieces/settlement-v2.png",
        status: "generated",
      },
      {
        name: "City V2",
        description: "Current detailed city source.",
        format: "PNG · 512×512",
        path: "/game-assets/pieces/city-v2.png",
        status: "generated",
      },
      {
        name: "Road V1",
        description: "Normalized legacy road asset retained in the pack.",
        format: "PNG · 256×256",
        path: "/game-assets/pieces/road.png",
        status: "generated",
      },
      {
        name: "Settlement V1",
        description: "Normalized legacy settlement asset retained in the pack.",
        format: "PNG · 256×256",
        path: "/game-assets/pieces/settlement.png",
        status: "generated",
      },
      {
        name: "City V1",
        description: "Normalized legacy city asset retained in the pack.",
        format: "PNG · 256×256",
        path: "/game-assets/pieces/city.png",
        status: "generated",
      },
      {
        name: "Robber",
        description: "Neutral robber pawn for the desert and blocked tiles.",
        format: "PNG · 256×256",
        path: "/game-assets/pieces/robber.png",
        status: "generated",
      },
    ],
  },
  {
    name: "Player portraits",
    description: "Human and bot portraits designed to remain readable in the compact HUD.",
    assets: [
      ...[
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
        [
          "Blue bot",
          "Robot navigator portrait.",
          "/game-assets/players/bot-blue-v2.png",
          "PNG · 512×512",
        ],
        [
          "Orange bot",
          "Robot shipwright portrait.",
          "/game-assets/players/bot-orange-v2.png",
          "PNG · 512×512",
        ],
        [
          "Green bot",
          "Robot botanist portrait.",
          "/game-assets/players/bot-green-v2.png",
          "PNG · 512×512",
        ],
      ].map(([name, description, path, format]) => ({
        name,
        description,
        format,
        path,
        status: "generated" as const,
      })),
      {
        name: "Red bot",
        description: "Dedicated robot portrait so red no longer reuses orange art.",
        format: "Target · 512×512 PNG",
        status: "needed" as const,
      },
    ],
  },
  {
    name: "Game UI illustrations",
    description: "Standalone art placed inside code-rendered cards, controls, and modals.",
    assets: [
      {
        name: "Market trade",
        description: "Trade action tile illustration.",
        format: "PNG · 256×256",
        path: "/game-assets/ui/market-trade-v1.png",
        status: "generated",
      },
      {
        name: "Development deck",
        description: "Disabled deck action tile illustration.",
        format: "AVIF · transparent",
        path: "/game-assets/ui/development-deck-v1.avif",
        status: "generated",
      },
      {
        name: "End turn",
        description: "Hourglass action tile illustration.",
        format: "PNG · 256×256",
        path: "/game-assets/ui/end-turn-hourglass-v1.png",
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
    description: "Current menu music and the gameplay sound set still to be produced.",
    assets: [
      {
        name: "Main lobby music",
        description: "Looping maritime menu soundtrack.",
        format: "MP3 · 256 kbps",
        kind: "audio",
        path: "/music/main-loby-music.mp3",
        status: "generated",
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
          <div className={styles.headerCopy}>
            <Link className={styles.backLink} href="/">
              <ArrowLeft aria-hidden="true" size={16} />
              Back to game
            </Link>
            <p className={styles.eyebrow}>Production inventory</p>
            <h1>Game asset sheet</h1>
            <p className={styles.intro}>
              Every current visual and audio asset, grouped by category, with the remaining
              generation work shown in the same rows.
            </p>
          </div>

          <div className={styles.summary} aria-label="Asset totals">
            <SummaryItem
              icon={<CheckCircle2 aria-hidden="true" />}
              label="Generated"
              tone="ready"
              value={assetTotals.generated}
            />
            <SummaryItem
              icon={<Clock3 aria-hidden="true" />}
              label="Need to generate"
              tone="needed"
              value={assetTotals.needed}
            />
            <SummaryItem
              icon={<ImageIcon aria-hidden="true" />}
              label="Categories"
              tone="neutral"
              value={ASSET_CATEGORIES.length}
            />
          </div>
        </header>

        <aside className={styles.note}>
          <Sparkles aria-hidden="true" size={18} />
          <p>
            CSS and SVG-native items such as number tokens, dice faces, borders, buttons, and
            legal-action glows are intentionally excluded because they do not require generated
            artwork.
          </p>
        </aside>

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
    <div className={styles.summaryItem} data-tone={tone}>
      <span className={styles.summaryIcon}>{icon}</span>
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </div>
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

      <div className={styles.assetRow} tabIndex={0}>
        {category.assets.map((asset) => (
          <AssetCard asset={asset} key={`${category.name}-${asset.name}`} />
        ))}
      </div>
    </section>
  );
}

function AssetCard({ asset }: { asset: AssetItem }) {
  const isGenerated = asset.status === "generated";

  return (
    <Card className={styles.assetCard} data-status={asset.status} variant="transparent">
      <Card.Content className={styles.cardContent}>
        <div className={styles.preview} data-fit={asset.fit ?? "contain"}>
          {asset.path && asset.kind !== "audio" ? (
            <img
              alt={`${asset.name} asset preview`}
              decoding="async"
              draggable={false}
              loading="lazy"
              src={asset.path}
            />
          ) : (
            <div className={styles.placeholder}>
              {asset.kind === "audio" ? (
                <Music2 aria-hidden="true" />
              ) : (
                <Sparkles aria-hidden="true" />
              )}
              <span>{isGenerated ? "Audio asset" : "Generation needed"}</span>
            </div>
          )}
        </div>

        <div className={styles.cardBody}>
          <Chip color={isGenerated ? "success" : "warning"} size="sm" variant="soft">
            {isGenerated ? (
              <CheckCircle2 aria-hidden="true" size={12} />
            ) : (
              <Clock3 aria-hidden="true" size={12} />
            )}
            <Chip.Label>{isGenerated ? "Generated" : "Need to generate"}</Chip.Label>
          </Chip>
          <h3>{asset.name}</h3>
          <p>{asset.description}</p>
          <span className={styles.format}>{asset.format}</span>
          {asset.path ? <code>{asset.path}</code> : null}
        </div>
      </Card.Content>
    </Card>
  );
}

function toId(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
}
