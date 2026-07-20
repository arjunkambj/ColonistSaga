import type { DiceRoll } from "./types";

interface RandomValue {
  nextIndex: number;
  value: number;
}

function hash32(value: string) {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2_246_822_507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3_266_489_909);
  hash ^= hash >>> 16;

  return hash >>> 0;
}

export function deterministicInteger(
  seed: string,
  randomIndex: number,
  maximum: number,
): RandomValue {
  if (!Number.isInteger(maximum) || maximum <= 0) {
    throw new Error("maximum must be a positive integer");
  }

  return {
    nextIndex: randomIndex + 1,
    value: hash32(`${seed}:${randomIndex}`) % maximum,
  };
}

export function deterministicShuffle<Value>(values: readonly Value[], seed: string): Value[] {
  const shuffled = [...values];
  let randomIndex = 0;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const draw = deterministicInteger(seed, randomIndex, index + 1);
    randomIndex = draw.nextIndex;
    const target = draw.value;
    const currentValue = shuffled[index];
    const targetValue = shuffled[target];

    if (currentValue === undefined || targetValue === undefined) {
      throw new Error("Values could not be shuffled");
    }

    shuffled[index] = targetValue;
    shuffled[target] = currentValue;
  }

  return shuffled;
}

export function createBalancedDiceBag(seed: string, randomIndex: number) {
  const bag: DiceRoll[] = Array.from({ length: 6 }, (_, firstIndex) =>
    Array.from({ length: 6 }, (_, secondIndex) => ({
      first: firstIndex + 1,
      second: secondIndex + 1,
      sum: firstIndex + secondIndex + 2,
    })),
  ).flat();
  let nextIndex = randomIndex;

  for (let index = bag.length - 1; index > 0; index -= 1) {
    const draw = deterministicInteger(seed, nextIndex, index + 1);
    nextIndex = draw.nextIndex;
    const target = draw.value;
    const currentRoll = bag[index];
    const targetRoll = bag[target];

    if (!currentRoll || !targetRoll) {
      throw new Error("Balanced dice bag could not be shuffled");
    }

    bag[index] = targetRoll;
    bag[target] = currentRoll;
  }

  return { bag, nextIndex };
}
