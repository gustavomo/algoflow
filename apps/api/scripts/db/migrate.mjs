import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run migrations.');
}

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const migrationsDir = path.join(root, 'migrations');
const files = (await fs.readdir(migrationsDir))
  .filter((file) => file.endsWith('.sql'))
  .sort();
const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const applied = new Set(
    (await pool.query('SELECT name FROM schema_migrations')).rows.map(
      (row) => row.name,
    ),
  );
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        file,
      ]);
      await client.query('COMMIT');
      process.stdout.write(`Applied ${file}\n`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
