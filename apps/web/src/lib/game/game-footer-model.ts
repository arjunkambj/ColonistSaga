export type TurnControlKind = "end_turn" | "required_action" | "roll" | "waiting";

export function getTurnControlKind({
  canRoll,
  isRequiredActor,
  phaseKind,
}: {
  canRoll: boolean;
  isRequiredActor: boolean;
  phaseKind: string;
}): TurnControlKind {
  if (!isRequiredActor) {
    return "waiting";
  }
  if (canRoll) {
    return "roll";
  }
  if (phaseKind === "build_and_trade") {
    return "end_turn";
  }
  return "required_action";
}
