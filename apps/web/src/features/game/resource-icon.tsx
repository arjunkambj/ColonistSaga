import type { ResourceType } from "@catansaga/game";

export const RESOURCE_LABELS: Readonly<Record<ResourceType, string>> = {
  brick: "Brick",
  sheep: "Sheep",
  stone: "Stone",
  tree: "Tree",
  wheat: "Wheat",
};

export function ResourceIcon({
  decorative = false,
  resource,
  size = 38,
}: {
  decorative?: boolean;
  resource: ResourceType;
  size?: number;
}) {
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
