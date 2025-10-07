
export const mapObjectValues = <I, O, K extends string>(obj: Record<K, I>, fn: (value: I) => O): Record<K, O> => {
  const res: Partial<Record<K, O>> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      res[key] = fn(obj[key]);
    }
  }
  return res as Record<K, O>;
};

export const RESOLVED = Promise.resolve();
