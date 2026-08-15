import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

let db: Database.Database;

export async function initDb() {
  const dbPath = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
  const sqlitePath = path.join(dbPath, 'database.sqlite');
  db = new Database(sqlitePath);

  // Create tables if not exist
  db.exec(`
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
      created_at INTEGER
    );
  `);

  logger.info('Database initialized at ' + sqlitePath);
}

export function getDb() {
  if (!db) throw new Error('DB not initialized');
  return db;
}
