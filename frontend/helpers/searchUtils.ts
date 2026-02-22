export function computeBlurIndices(n: number, ratio = 0.4, seed: string) {
  const count = Math.max(0, Math.min(n, Math.round(n * ratio)));
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  const rand = () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return Math.abs(h) / 0x7fffffff;
  };
  const indices = new Set<number>();
  while (indices.size < count && indices.size < n) {
    indices.add(Math.floor(rand() * n));
  }
  return indices;
}

export function shouldThrottle(last: { current: number }, windowMs = 1200) {
  const now = Date.now();
  if (now - last.current < windowMs) return true;
  last.current = now;
  return false;
}
