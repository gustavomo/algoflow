import { createHash } from 'node:crypto';
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, {}>({ max: 250, ttl: 1000 * 60 * 15 });

export function hashCacheKey(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export async function memo<T extends {}>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = cache.get(key) as T | undefined;
  if (cached !== undefined) return cached;
  const value = await fn();
  cache.set(key, value);
  return value;
}

export async function memoWithStatus<T extends {}>(
  key: string,
  fn: () => Promise<T>,
) {
  const cached = cache.get(key) as T | undefined;
  if (cached !== undefined) return { value: cached, cached: true };
  const value = await fn();
  cache.set(key, value);
  return { value, cached: false };
}
