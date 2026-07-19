import type { ResourceType } from "@colonistsaga/game";

export const RESOURCE_LABELS: Readonly<Record<ResourceType, string>> = {
  brick: "Brick",
  sheep: "Sheep",
  stone: "Stone",
  tree: "Wood",
  wheat: "Wheat",
};

interface ResourceIconProps {
  decorative?: boolean;
  resource: ResourceType;
  size?: number;
}

export function ResourceIcon({ decorative = false, resource, size = 38 }: ResourceIconProps) {
  return (
    <img
      alt={decorative ? "" : RESOURCE_LABELS[resource]}
      className="resource-icon"
      draggable={false}
      height={size}
      src={`/game-assets/resources/${resource}.png`}
      width={size}
    />
  );
}
