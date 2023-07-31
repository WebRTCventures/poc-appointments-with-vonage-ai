export function moveElement<T>(
  collection: T[],
  orig: number,
  dest: number
): T[] {
  if (!collection.length) {
    return [];
  }

  const element = collection[orig];

  if (dest < 0) {
    return [element, ...collection];
  }

  if (dest >= collection.length) {
    return [...collection, element];
  }

  const filtered = collection.filter((_v, i) => i !== orig);
  const before = filtered.slice(0, dest);
  const after = filtered.slice(dest, collection.length);
  return [...before, element, ...after];
}
