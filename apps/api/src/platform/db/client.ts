import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __algoflowPool: Pool | undefined;
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!globalThis.__algoflowPool) {
    globalThis.__algoflowPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 4,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return globalThis.__algoflowPool;
}
