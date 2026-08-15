#!/usr/bin/env node
// scripts/import_commands.js
// Enhanced importer: if data/commands_bulk.json exists use it, otherwise if data/commands_manifest.json exists generate the bulk commands on-the-fly and import.

const fs = require('fs');
const path = require('path');

const bulkPath = path.join(process.cwd(), 'data', 'commands_bulk.json');
const manifestPath = path.join(process.cwd(), 'data', 'commands_manifest.json');

function generateFromManifest(manifest) {
  const alloc = manifest.allocations || {};
  const commands = [];
  Object.keys(alloc).forEach(cat => {
    const count = alloc[cat];
    for (let i = 1; i <= count; i++) {
      const trigger = `.${cat}_${String(i).padStart(5, '0')}`;
      const response = `[AUTO] ${cat.toUpperCase()} placeholder response #${i}. Replace with real implementation.`;
      commands.push({ trigger, category: cat, response, metadata: { generated: true, source: 'manifest' } });
    }
  });
  return commands;
}

async function main() {
  let commands = null;
  if (fs.existsSync(bulkPath)) {
    console.log('Loading existing commands_bulk.json...');
    commands = JSON.parse(fs.readFileSync(bulkPath, 'utf-8'));
  } else if (fs.existsSync(manifestPath)) {
    console.log('commands_bulk.json not found; generating from manifest...');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    commands = generateFromManifest(manifest);
    // Optionally write the generated bulk file for inspection
    try {
      fs.writeFileSync(bulkPath, JSON.stringify(commands, null, 2));
      console.log('Wrote generated data/commands_bulk.json (for inspection)');
    } catch (e) {
      console.warn('Could not write commands_bulk.json, continuing without writing:', e?.message || e);
    }
  } else {
    console.error('Neither commands_bulk.json nor commands_manifest.json found. Run generator or add a manifest.');
    process.exit(1);
  }

  const DATABASE_URL = process.env.DATABASE_URL || '';

  if (!commands || !Array.isArray(commands) || commands.length === 0) {
    console.error('No commands to import. Exiting.');
    process.exit(1);
  }

  // Import into desired DB
  if (DATABASE_URL) {
    console.log('Importing into Postgres...');
    const { Client } = require('pg');
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    await client.query(`CREATE TABLE IF NOT EXISTS commands (id SERIAL PRIMARY KEY, trigger TEXT UNIQUE, category TEXT, response TEXT, enabled BOOLEAN DEFAULT FALSE, metadata JSONB, created_at BIGINT)`);
    const batchSize = 500;
    for (let i = 0; i < commands.length; i += batchSize) {
      const batch = commands.slice(i, i + batchSize);
      const values = [];
      const params = [];
      let idx = 1;
      for (const b of batch) {
        values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
        params.push(b.trigger, b.category, b.response, false, JSON.stringify(b.metadata || {}));
      }
      const q = `INSERT INTO commands (trigger, category, response, enabled, metadata) VALUES ${values.join(', ')} ON CONFLICT (trigger) DO UPDATE SET response = EXCLUDED.response, category = EXCLUDED.category, metadata = EXCLUDED.metadata`;
      await client.query(q, params);
      console.log('Inserted batch', i, 'to', i + batch.length);
    }
    await client.end();
    console.log('Imported', commands.length, 'commands into Postgres');
  } else {
    console.log('Importing into SQLite...');
    const Database = require('better-sqlite3');
    const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
    const db = new Database(dbPath);
    db.prepare(`CREATE TABLE IF NOT EXISTS commands (id INTEGER PRIMARY KEY AUTOINCREMENT, trigger TEXT UNIQUE, category TEXT, response TEXT, enabled INTEGER DEFAULT 0, metadata TEXT, created_at INTEGER)`).run();
    const insert = db.prepare('INSERT OR REPLACE INTO commands (trigger, category, response, enabled, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    const txn = db.transaction((rows) => {
      for (const r of rows) {
        insert.run(r.trigger, r.category, r.response, 0, JSON.stringify(r.metadata || {}), Date.now());
      }
    });

    // Insert in batches to avoid huge transactions
    const batchSize = 1000;
    for (let i = 0; i < commands.length; i += batchSize) {
      const batch = commands.slice(i, i + batchSize);
      txn(batch);
      console.log('Inserted batch', i, 'to', i + batch.length);
    }
    console.log('Imported', commands.length, 'commands into SQLite at', dbPath);
  }
}

main().catch(err => { console.error('Import error', err); process.exit(1); });
