import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || '';

async function withPgClient(cb: (client: any) => Promise<any>) {
  const { Client } = require('pg');
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    return await cb(client);
  } finally {
    await client.end();
  }
}

function withSqlite(cb: (db: any) => any) {
  const Database = require('better-sqlite3');
  const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
  const db = new Database(dbPath);
  try {
    return cb(db);
  } finally {
    db.close();
  }
}

export async function listCommands({ q, category, page, limit }: { q: string; category: string; page: number; limit: number; }) {
  const offset = (page - 1) * limit;
  if (DATABASE_URL) {
    return await withPgClient(async (client) => {
      const where: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (q) { where.push(`(trigger ILIKE $${idx} OR response ILIKE $${idx})`); params.push(`%${q}%`); idx++; }
      if (category) { where.push(`category = $${idx}`); params.push(category); idx++; }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const totalRes = await client.query(`SELECT COUNT(*) AS cnt FROM commands ${whereSql}`, params);
      const total = parseInt(totalRes.rows[0].cnt, 10);
      const rows = await client.query(`SELECT trigger, category, response, enabled FROM commands ${whereSql} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`, params);
      return { total, page, limit, rows: rows.rows };
    });
  } else {
    return withSqlite((db) => {
      const where: string[] = [];
      const params: any[] = [];
      if (q) { where.push('(trigger LIKE ? OR response LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
      if (category) { where.push('category = ?'); params.push(category); }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const total = db.prepare(`SELECT COUNT(*) AS cnt FROM commands ${whereSql}`).get(...params).cnt;
      const rows = db.prepare(`SELECT trigger, category, response, enabled FROM commands ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
      return { total, page, limit, rows };
    });
  }
}

export async function updateCommandEnabled(trigger: string, enabled: boolean) {
  if (DATABASE_URL) {
    return await withPgClient(async (client) => {
      await client.query('UPDATE commands SET enabled = $1 WHERE trigger = $2', [enabled, trigger]);
      return true;
    });
  } else {
    return withSqlite((db) => {
      db.prepare('UPDATE commands SET enabled = ? WHERE trigger = ?').run(enabled ? 1 : 0, trigger);
      return true;
    });
  }
}

export async function bulkEnableCategory(category: string, enabled: boolean) {
  if (DATABASE_URL) {
    return await withPgClient(async (client) => {
      const res = await client.query('UPDATE commands SET enabled = $1 WHERE category = $2 RETURNING trigger', [enabled, category]);
      return res.rowCount || res.rows.length;
    });
  } else {
    return withSqlite((db) => {
      const info = db.prepare('UPDATE commands SET enabled = ? WHERE category = ?').run(enabled ? 1 : 0, category);
      return info.changes;
    });
  }
}

export async function createSnapshot() {
  const outPath = path.join(process.cwd(), 'data', `commands_snapshot_${Date.now()}.json`);
  if (DATABASE_URL) {
    return await withPgClient(async (client) => {
      const res = await client.query('SELECT id, trigger, category, response, enabled, metadata, created_at FROM commands ORDER BY id');
      fs.writeFileSync(outPath, JSON.stringify(res.rows, null, 2));
      return outPath;
    });
  } else {
    return withSqlite((db) => {
      const rows = db.prepare('SELECT id, trigger, category, response, enabled, metadata, created_at FROM commands ORDER BY id').all();
      fs.writeFileSync(outPath, JSON.stringify(rows, null, 2));
      return outPath;
    });
  }
}

export async function getStats() {
  if (DATABASE_URL) {
    return await withPgClient(async (client) => {
      const total = (await client.query('SELECT COUNT(*) AS cnt FROM commands')).rows[0].cnt;
      const enabled = (await client.query('SELECT COUNT(*) AS cnt FROM commands WHERE enabled = TRUE')).rows[0].cnt;
      const byCategory = (await client.query('SELECT category, COUNT(*) AS cnt FROM commands GROUP BY category ORDER BY cnt DESC')).rows;
      return { total: parseInt(total, 10), enabled: parseInt(enabled, 10), byCategory };
    });
  } else {
    return withSqlite((db) => {
      const total = db.prepare('SELECT COUNT(*) AS cnt FROM commands').get().cnt;
      const enabled = db.prepare('SELECT COUNT(*) AS cnt FROM commands WHERE enabled = 1').get().cnt;
      const byCategory = db.prepare('SELECT category, COUNT(*) AS cnt FROM commands GROUP BY category ORDER BY cnt DESC').all();
      return { total, enabled, byCategory };
    });
  }
}

export async function runSampleTests(count = 10) {
  if (DATABASE_URL) {
    return await withPgClient(async (client) => {
      const res = await client.query('SELECT trigger, category, response, enabled FROM commands ORDER BY random() LIMIT $1', [count]);
      return res.rows;
    });
  } else {
    return withSqlite((db) => {
      const rows = db.prepare('SELECT trigger, category, response, enabled FROM commands ORDER BY RANDOM() LIMIT ?').all(count);
      return rows;
    });
  }
}
