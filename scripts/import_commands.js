#!/usr/bin/env node
// scripts/import_commands.js
// Imports data/commands_bulk.json into the local SQLite DB (data/database.sqlite) or Postgres if DATABASE_URL is set.

const fs = require('fs');
const path = require('path');

const bulkPath = path.join(process.cwd(), 'data', 'commands_bulk.json');
if (!fs.existsSync(bulkPath)) { console.error('commands_bulk.json not found. Run scripts/generate_bulk_commands.js first.'); process.exit(1); }
const commands = JSON.parse(fs.readFileSync(bulkPath, 'utf-8'));

const DATABASE_URL = process.env.DATABASE_URL || '';

async function importToSqlite() {
  const Database = require('better-sqlite3');
  const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
  const db = new Database(dbPath);
  db.prepare(`CREATE TABLE IF NOT EXISTS commands (id INTEGER PRIMARY KEY AUTOINCREMENT, trigger TEXT UNIQUE, category TEXT, response TEXT, enabled INTEGER DEFAULT 1, metadata TEXT, created_at INTEGER)`).run();
  const insert = db.prepare('INSERT OR REPLACE INTO commands (trigger, category, response, enabled, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)');
  const txn = db.transaction((rows) => {
    for (const r of rows) {
      insert.run(r.trigger, r.category, r.response, 1, JSON.stringify(r.metadata || {}), Date.now());
    }
  });
  txn(commands);
  console.log('Imported', commands.length, 'commands into SQLite at', dbPath);
}

async function importToPostgres() {
  const { Client } = require('pg');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  await client.query(`CREATE TABLE IF NOT EXISTS commands (id SERIAL PRIMARY KEY, trigger TEXT UNIQUE, category TEXT, response TEXT, enabled BOOLEAN DEFAULT TRUE, metadata JSONB, created_at BIGINT)`);
  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < commands.length; i += batchSize) {
    const batch = commands.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let idx = 1;
    for (const b of batch) {
      values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      params.push(b.trigger, b.category, b.response, true, JSON.stringify(b.metadata || {}));
    }
    const q = `INSERT INTO commands (trigger, category, response, enabled, metadata) VALUES ${values.join(', ')} ON CONFLICT (trigger) DO UPDATE SET response = EXCLUDED.response, category = EXCLUDED.category, metadata = EXCLUDED.metadata`;
    await client.query(q, params);
    console.log('Inserted batch', i, 'to', i + batch.length);
  }
  await client.end();
  console.log('Imported', commands.length, 'commands into Postgres');
}

(async () => {
  if (DATABASE_URL) {
    console.log('Importing into Postgres...');
    await importToPostgres();
  } else {
    console.log('Importing into SQLite...');
    await importToSqlite();
  }
})();
