import type { GameCommand } from "../src/types";

type Expect<Value extends true> = Value;
type IsNever<Value> = [Value] extends [never] ? true : false;

export type DevelopmentCardCommandIsRemoved = Expect<
  IsNever<Extract<GameCommand, { kind: "buy_development_card" }>>
>;
