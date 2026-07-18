import type { CSSProperties } from "react";

export type PieceAsset = "city" | "road" | "settlement";
export type PieceTheme = "blue" | "green" | "orange" | "red";

const PIECE_ASSET_PATHS: Readonly<Record<PieceAsset, string>> = {
  city: "/game-assets/pieces/city-v2.png",
  road: "/game-assets/pieces/road-v2.png",
  settlement: "/game-assets/pieces/settlement-v2.png",
};

export function getPieceAssetPath(asset: PieceAsset): string {
  return PIECE_ASSET_PATHS[asset];
}

export function PieceIcon({
  asset,
  className = "",
  theme,
}: {
  asset: PieceAsset;
  className?: string;
  theme: PieceTheme;
}) {
  const assetPath = getPieceAssetPath(asset);

  return (
    <span
      aria-hidden="true"
      className={`piece-icon piece-icon-${asset} player-${theme} ${className}`.trim()}
    >
      <img alt="" draggable={false} height={512} src={assetPath} width={512} />
      <span
        className="piece-color"
        style={{ "--piece-mask": `url(${assetPath})` } as CSSProperties}
      />
    </span>
  );
}
