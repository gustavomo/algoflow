export async function withTimer<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[otel] ${name} took ${duration}ms`);
  }
  return result;
}
