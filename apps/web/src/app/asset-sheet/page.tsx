import arrowLeftIcon from "@iconify-icons/solar/arrow-left-line-duotone";
import checkIcon from "@iconify-icons/solar/check-circle-bold-duotone";
import clockIcon from "@iconify-icons/solar/clock-circle-bold-duotone";
import imageIcon from "@iconify-icons/solar/gallery-bold-duotone";
import { Icon } from "@iconify/react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { getPieceAssetPath } from "@/components/game/piece-icon";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import {
  ACTION_CARD_ASSET_PATHS,
  DEVELOPMENT_CARD_ASSETS,
  DEVELOPMENT_CARD_BACK_ASSET_PATH,
  RESOURCE_CARD_ASSET_PATHS,
} from "@/constants/game/card-assets";
import {
  getTerrainAssetPath,
  ISLAND_SHELF_ASSET_PATH,
  OCEAN_BOARD_ASSET_PATH,
  PORT_SKIFF_ASSET_PATH,
} from "@/constants/game/board-assets";

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
  assets?: readonly AssetItem[];
  description: string;
  name: string;
  subcategories?: readonly AssetSubcategory[];
}

interface AssetSubcategory {
  assets: readonly AssetItem[];
  name: string;
}

const MUSIC_ASSETS = [
  {
    description: "The single optional loop used on the signed-in home screen.",
    format: "MP3 · 256 kbps",
    kind: "audio",
    name: "Home music",
    path: "/music/main-loby-music.mp3",
    status: "generated",
  },
  {
    description: "One low-fatigue loop for ordinary turns, resources, building, and trade.",
    format: "Target · 48 kHz WAV + runtime copy",
    kind: "audio",
    name: "In-game ambience",
    status: "needed",
  },
] satisfies readonly AssetItem[];

const SOUND_EFFECT_ASSETS = [
  ["Interface press", "Shared tactile feedback for buttons, tabs, steppers, and toggles."],
  ["Action feedback", "A restrained confirmation or invalid-action response."],
  ["Your turn", "One notification when the required actor changes to the viewer."],
  ["Dice result", "One compact roll-and-settle cue after the server confirms the total."],
  ["Resource change", "One bundled cue for the viewer gaining or losing resources."],
  ["Piece placed", "Shared placement cue for roads, settlements, and cities."],
  ["Robber alert", "Brief interruption for the seven, discard, and robber sequence."],
  ["Trade resolved", "Shared confirmation when a bank or player trade completes."],
].map(([name, description]) => ({
  name,
  description,
  format: "Target · 48 kHz WAV + runtime copy",
  kind: "audio" as const,
  status: "needed" as const,
}));

const selectAssets = (assets: readonly AssetItem[], names: readonly string[]) =>
  assets.filter((asset) => names.includes(asset.name));

const TERRAIN_TYPES = [
  ["Fields", "fields", "Wheat-producing farmland hex."],
  ["Forest", "forest", "Tree-producing woodland hex."],
  ["Hills", "hills", "Brick-producing clay hills hex."],
  ["Mountains", "mountains", "Stone-producing mountain hex."],
  ["Pasture", "pasture", "Sheep-producing grassland hex."],
  ["Desert", "desert", "Non-producing robber hex."],
] as const;

const SOUND_EFFECT_SUBCATEGORIES = [
  {
    name: "Interface",
    assets: selectAssets(SOUND_EFFECT_ASSETS, ["Interface press", "Action feedback"]),
  },
  {
    name: "Game round",
    assets: selectAssets(SOUND_EFFECT_ASSETS, [
      "Your turn",
      "Dice result",
      "Resource change",
      "Piece placed",
    ]),
  },
  {
    name: "High-priority events",
    assets: selectAssets(SOUND_EFFECT_ASSETS, ["Robber alert", "Trade resolved"]),
  },
] satisfies readonly AssetSubcategory[];

const ASSET_CATEGORIES = [
  {
    name: "Brand & environments",
    description: "Large scene-setting artwork used behind the login, home, and game views.",
    assets: [
      {
        name: "Coastal cove",
        description:
          "Shared daytime coastal panorama used by the login, home, and end-of-game views.",
        fit: "cover",
        format: "PNG · 1672×941",
        path: "/shared-assets/coastal-island-kingdom-day.png",
        status: "generated",
      },
      {
        name: "Ocean board canvas",
        description: "Quiet turquoise water backdrop beneath the playable board.",
        fit: "cover",
        format: "WebP · 1586×992",
        path: OCEAN_BOARD_ASSET_PATH,
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
    description: "The six top-down hex illustrations used by the deterministic board renderer.",
    assets: TERRAIN_TYPES.map(([name, terrain, description]) => ({
      name,
      description,
      format: "PNG · 512×512",
      path: getTerrainAssetPath(terrain),
      status: "generated" as const,
    })),
  },
  {
    name: "Resource cards",
    description: "Full portrait card artwork used by the private resource hand.",
    assets: [
      ["Tree card", "Forest-and-timber card artwork.", RESOURCE_CARD_ASSET_PATHS.tree],
      ["Brick card", "Clay-hills-and-brick card artwork.", RESOURCE_CARD_ASSET_PATHS.brick],
      ["Sheep card", "Pasture-and-sheep card artwork.", RESOURCE_CARD_ASSET_PATHS.sheep],
      ["Wheat card", "Golden-fields-and-wheat card artwork.", RESOURCE_CARD_ASSET_PATHS.wheat],
      ["Stone card", "Mountain-and-stone card artwork.", RESOURCE_CARD_ASSET_PATHS.stone],
    ].map(([name, description, path]) => ({
      name,
      description: `${description} Labels and counts remain code-rendered.`,
      format: "PNG · 512×768",
      path,
      status: "generated" as const,
    })),
  },
  {
    name: "Placement & action icons",
    description:
      "Live board-piece artwork plus compact action alternatives retained as visual references.",
    assets: [
      {
        name: "Road icon",
        description: "Road placement icon and player-tintable board piece.",
        format: "PNG · 512×512",
        path: getPieceAssetPath("road"),
        status: "generated",
      },
      {
        name: "Settlement icon",
        description: "House placement icon and player-tintable board piece.",
        format: "PNG · 512×512",
        path: getPieceAssetPath("settlement"),
        status: "generated",
      },
      {
        name: "City icon",
        description: "City upgrade icon and player-tintable board piece.",
        format: "PNG · 512×512",
        path: getPieceAssetPath("city"),
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
        description: "Alternate compact market artwork; the live trade control uses its full card.",
        format: "PNG · 256×256",
        path: "/game-assets/ui/market-trade.png",
        status: "generated",
      },
      {
        name: "Bank icon",
        description: "Bank-building symbol for the resource market and bank controls.",
        format: "PNG · 256×256 · transparent",
        path: "/game-assets/ui/bank.png",
        status: "generated",
      },
      {
        name: "Development card icon",
        description: "Alternate stacked-card artwork retained for development-deck reference.",
        format: "AVIF · 512×512 · transparent",
        path: "/game-assets/ui/development-deck.avif",
        status: "generated",
      },
      {
        name: "End turn icon",
        description: "Alternate compact hourglass artwork; the live control uses its full card.",
        format: "PNG · 256×256",
        path: "/game-assets/ui/end-turn-hourglass.png",
        status: "generated",
      },
    ],
  },
  {
    name: "Placement & action cards",
    description: "Full card artwork for the bottom action dock, beyond the compact icons.",
    assets: [
      [
        "Trade card",
        "Market scene for opening bank or player trade.",
        ACTION_CARD_ASSET_PATHS.trade,
      ],
      ["Road card", "Road-building card for edge placement.", ACTION_CARD_ASSET_PATHS.road],
      [
        "Settlement card",
        "House card for settlement placement.",
        ACTION_CARD_ASSET_PATHS.settlement,
      ],
      ["City card", "City-upgrade card for replacing a settlement.", ACTION_CARD_ASSET_PATHS.city],
      [
        "End turn card",
        "Hourglass card for completing the active turn.",
        ACTION_CARD_ASSET_PATHS.endTurn,
      ],
    ].map(([name, description, path]) => ({
      name,
      description: `${description} Title, cost, count, and state remain code-rendered.`,
      format: "PNG · 512×768",
      path,
      status: "generated" as const,
    })),
  },
  {
    name: "Board utility art",
    description: "Supporting illustrations that do not belong to the placement-card set.",
    assets: [
      {
        name: "Port skiff",
        description: "Small boat used to dress board ports.",
        format: "PNG · 384×512",
        path: PORT_SKIFF_ASSET_PATH,
        status: "generated",
      },
      {
        name: "Island shelf",
        description: "Soft island silhouette beneath the playable terrain cluster.",
        format: "PNG · transparent",
        path: ISLAND_SHELF_ASSET_PATH,
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
    description: "Eight color-matched seat portraits for tables with up to eight players.",
    assets: [
      {
        name: "Red navigator",
        description: "Red-seat harbor navigator and default fallback portrait.",
        format: "PNG · 256×256",
        path: "/game-assets/players/red-navigator.png",
        status: "generated",
      },
      {
        name: "Blue cartographer",
        description: "Blue-seat island cartographer.",
        format: "PNG · 256×256",
        path: "/game-assets/players/blue-cartographer.png",
        status: "generated",
      },
      {
        name: "Orange builder",
        description: "Orange-seat village builder.",
        format: "PNG · 256×256",
        path: "/game-assets/players/orange-builder.png",
        status: "generated",
      },
      {
        name: "Green botanist",
        description: "Green-seat island botanist.",
        format: "PNG · 256×256",
        path: "/game-assets/players/green-botanist.png",
        status: "generated",
      },
      {
        name: "Purple astronomer",
        description: "Purple-seat island astronomer.",
        format: "PNG · 256×256",
        path: "/game-assets/players/purple-astronomer.png",
        status: "generated",
      },
      {
        name: "Teal shipwright",
        description: "Teal-seat harbor shipwright.",
        format: "PNG · 256×256",
        path: "/game-assets/players/teal-shipwright.png",
        status: "generated",
      },
      {
        name: "Yellow merchant",
        description: "Yellow-seat island merchant.",
        format: "PNG · 256×256",
        path: "/game-assets/players/yellow-merchant.png",
        status: "generated",
      },
      {
        name: "Pink pathfinder",
        description: "Pink-seat island pathfinder.",
        format: "PNG · 256×256",
        path: "/game-assets/players/pink-pathfinder.png",
        status: "generated",
      },
    ],
  },
  {
    name: "Development cards",
    description: "Full portrait illustrations used by the in-game development-deck reference.",
    assets: [
      ...DEVELOPMENT_CARD_ASSETS.map((card) => ({
        name: `${card.label} card`,
        description: card.description,
        format: "PNG · 512×768",
        path: card.path,
        status: "generated" as const,
      })),
      {
        name: "Hidden card back",
        description: "Shared concealed development-card back used by the hand reference trigger.",
        format: "PNG · 512×768",
        path: DEVELOPMENT_CARD_BACK_ASSET_PATH,
        status: "generated" as const,
      },
    ],
  },
  {
    name: "Awards & results",
    description: "Milestone and end-of-game art planned for the results experience.",
    assets: [
      {
        name: "Longest Road",
        description: "Award illustration for the longest connected route.",
        format: "PNG · 512×512 · transparent",
        path: "/game-assets/awards/longest-road.png",
        status: "generated",
      },
      {
        name: "Largest Army",
        description: "Award illustration for the strongest knight force.",
        format: "PNG · 512×512 · transparent",
        path: "/game-assets/awards/largest-army.png",
        status: "generated",
      },
      {
        name: "Victory flourish",
        description: "Celebratory crown, rays, and confetti treatment.",
        format: "PNG · 1536×512 · transparent",
        path: "/game-assets/results/victory-flourish.png",
        status: "generated",
      },
    ],
  },
  {
    name: "Board ambience",
    description: "Optional details that add life without affecting board readability.",
    assets: [
      {
        name: "Coastal rocks",
        description: "Optional isolated rock cluster kept out of the default live board.",
        format: "PNG · 384×384 · transparent",
        path: "/game-assets/ambience/coastal-rocks.png",
        status: "generated",
      },
      {
        name: "Foam accents",
        description: "Optional shoreline accent set kept out of the default live board.",
        format: "PNG · 384×384 · transparent",
        path: "/game-assets/ambience/foam-accents.png",
        status: "generated",
      },
      {
        name: "Coastal plants",
        description: "Optional flower-and-grass cluster kept out of the default live board.",
        format: "PNG · 384×384 · transparent",
        path: "/game-assets/ambience/coastal-plants.png",
        status: "generated",
      },
    ],
  },
  {
    name: "Music",
    description:
      "One optional home loop and one low-fatigue gameplay loop; lobby and results remain quiet.",
    assets: MUSIC_ASSETS,
  },
  {
    name: "Sound effects",
    description:
      "Eight reusable future cues cover the meaningful game-state changes; visual feedback remains complete without them.",
    subcategories: SOUND_EFFECT_SUBCATEGORIES,
  },
  {
    name: "Brand foundations",
    description:
      "The implemented visual system behind every screen. These are code-defined foundations, so no artwork generation is required.",
    assets: [
      {
        name: "Display typography",
        description:
          "DM Sans gives game titles, the logo lockup, and card headings a clean, friendly voice.",
        format: "DM Sans · 700–900 · sans serif",
        kind: "brand",
        previewText: "Build your island",
        status: "generated",
      },
      {
        name: "Interface typography",
        description:
          "DM Sans keeps rules, room status, resources, and quick in-turn decisions clear and consistent.",
        format: "DM Sans · 400–900 · system sans fallback",
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
          "Eight distinct seat colors remain reserved for ownership across pieces, HUDs, and activity states.",
        format: "#F04F49 · #2F8EE8 · #F18C2C · #2FB86A · #8357D9 · #0F9696 · #BD8100 · #D74786",
        kind: "brand",
        status: "generated",
        swatches: [
          "#F04F49",
          "#2F8EE8",
          "#F18C2C",
          "#2FB86A",
          "#8357D9",
          "#0F9696",
          "#BD8100",
          "#D74786",
        ],
      },
    ],
  },
] satisfies readonly AssetCategory[];

const assetTotals = ASSET_CATEGORIES.reduce(
  (totals, category) =>
    categoryAssets(category).reduce(
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
              label="Pending production"
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
  const assets = categoryAssets(category);
  const generatedCount = assets.filter((asset) => asset.status === "generated").length;

  return (
    <section className={styles.category} aria-labelledby={`category-${toId(category.name)}`}>
      <div className={styles.categoryHeader}>
        <div>
          <h2 id={`category-${toId(category.name)}`}>{category.name}</h2>
          <p>{category.description}</p>
        </div>
        <span className={styles.categoryCount}>
          {generatedCount}/{assets.length} ready
        </span>
      </div>

      {category.subcategories ? (
        <div className={styles.assetSubcategories}>
          {category.subcategories.map((subcategory) => (
            <section
              aria-labelledby={`subcategory-${toId(category.name)}-${toId(subcategory.name)}`}
              className={styles.assetSubcategory}
              key={subcategory.name}
            >
              <h3 id={`subcategory-${toId(category.name)}-${toId(subcategory.name)}`}>
                {subcategory.name}
              </h3>
              <div className={styles.assetRow}>
                {subcategory.assets.map((asset) => (
                  <AssetCard asset={asset} key={`${subcategory.name}-${asset.name}`} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={styles.assetRow}>
          {assets.map((asset) => (
            <AssetCard asset={asset} key={`${category.name}-${asset.name}`} />
          ))}
        </div>
      )}
    </section>
  );
}

function categoryAssets(category: AssetCategory) {
  return (
    category.assets ?? category.subcategories?.flatMap((subcategory) => subcategory.assets) ?? []
  );
}

function toId(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");
}
