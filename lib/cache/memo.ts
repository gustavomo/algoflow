import LRU from 'lru-cache';

const cache = new LRU<string, string>({ max: 100 });

export function memo(key: string, fn: () => Promise<string>) {
  const v = cache.get(key);
  if (v) return Promise.resolve(v);
  return fn().then((res) => {
    cache.set(key, res);
    return res;
  });
}
