export function createCachedValue<Options, Value>(
  hasSameOptions: (current: Options, next: Options) => boolean,
  createValue: (options: Options) => Value,
) {
  let cached: { options: Options; value: Value } | null = null;

  return (options: Options) => {
    if (cached && hasSameOptions(cached.options, options)) {
      return cached.value;
    }

    const value = createValue(options);
    cached = { options, value };
    return value;
  };
}
