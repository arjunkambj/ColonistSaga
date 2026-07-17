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
