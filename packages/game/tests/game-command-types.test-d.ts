import type { GameCommand } from "../src/types";

type Expect<Value extends true> = Value;

export type DevelopmentCardPurchaseCommandExists = Expect<
  Extract<GameCommand, { kind: "buy_development_card" }> extends {
    kind: "buy_development_card";
  }
    ? true
    : false
>;
