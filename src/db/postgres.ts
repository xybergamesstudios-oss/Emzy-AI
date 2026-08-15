import { Client } from 'pg';
import { logger } from '../utils/logger';

export async function initPostgres(databaseUrl: string) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  // Create necessary tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS pairings (
      id SERIAL PRIMARY KEY,
      whatsapp_id TEXT UNIQUE,
      code TEXT,
      expires_at BIGINT,
      paired_at BIGINT
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      whatsapp_id TEXT UNIQUE,
      name TEXT,
      cash BIGINT DEFAULT 20000,
      bank BIGINT DEFAULT 0,
      xp BIGINT DEFAULT 0,
      level INTEGER DEFAULT 1,
      last_daily BIGINT DEFAULT 0,
      created_at BIGINT
    );
  `);

  logger.info('Postgres tables ensured');
  await client.end();
}
