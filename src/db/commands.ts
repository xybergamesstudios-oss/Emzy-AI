import { getDb } from '../db';

export function getDynamicCommand(trigger: string) {
  const db = getDb();
  try {
    const row = db.prepare('SELECT trigger, category, response, enabled FROM commands WHERE trigger = ?').get(trigger);
    if (!row) return null;
    if (!row.enabled) return null;
    return { trigger: row.trigger, category: row.category, response: row.response };
  } catch (e) {
    return null;
  }
}

export function insertCommandsBulk(commands: Array<{ trigger: string; category: string; response: string; metadata?: any }>) {
  const db = getDb();
  const insert = db.prepare('INSERT INTO commands (trigger, category, response, metadata, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (trigger) DO UPDATE SET response = EXCLUDED.response, category = EXCLUDED.category, metadata = EXCLUDED.metadata');
  const txn = db.transaction((rows: any[]) => {
    for (const r of rows) {
      insert.run(r.trigger, r.category, r.response, JSON.stringify(r.metadata || {}), Date.now());
    }
  });
  txn(commands);
}
