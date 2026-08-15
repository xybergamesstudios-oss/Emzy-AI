import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

let sqliteDb: Database.Database | null = null;

export async function initDb() {
  const dbPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });

  // If DATABASE_URL looks like postgres, initialize Postgres instead
  if (CONFIG.DATABASE_URL && CONFIG.DATABASE_URL.startsWith('postgres')) {
    // Lazy: create tables using node-postgres
    const { initPostgres } = await import('./postgres');
    await initPostgres(CONFIG.DATABASE_URL);
    logger.info('Using Postgres database');
    return;
  }

  const sqlitePath = path.join(dbPath, 'database.sqlite');
  sqliteDb = new Database(sqlitePath);

  // Create tables if not exist
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS pairings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      whatsapp_id TEXT UNIQUE,
      code TEXT,
      expires_at INTEGER,
      paired_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      whatsapp_id TEXT UNIQUE,
      name TEXT,
      cash INTEGER DEFAULT 20000,
      bank INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      last_daily INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS ttt_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT UNIQUE,
      board TEXT,
      player_x TEXT,
      player_o TEXT,
      next_turn TEXT,
      status TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS trivia_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT UNIQUE,
      question_index INTEGER,
      player_id TEXT,
      score INTEGER,
      created_at INTEGER
    );
  `);

  logger.info('SQLite database initialized at ' + sqlitePath);
}

export function getDb() {
  if (!sqliteDb) throw new Error('SQLite DB not initialized or running Postgres');
  return sqliteDb;
}
