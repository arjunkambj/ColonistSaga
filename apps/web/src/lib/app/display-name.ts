export function cleanDisplayName(displayName: string): string {
  return displayName.trim().slice(0, 24) || "Explorer";
}
