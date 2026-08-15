import { getDb } from './index';

export function createPairCode(whatsappId: string, code: string, expiresAt: number) {
  const db = getDb();
  const now = Date.now();
  const stmt = db.prepare('INSERT OR REPLACE INTO pairings (whatsapp_id, code, expires_at, paired_at) VALUES (?, ?, ?, NULL)');
  stmt.run(whatsappId, code, expiresAt);
}

export function verifyPairCode(whatsappId: string, code: string) {
  const db = getDb();
  const row = db.prepare('SELECT code, expires_at FROM pairings WHERE whatsapp_id = ?').get(whatsappId);
  if (!row) return false;
  if (row.code !== code) return false;
  if (Date.now() > row.expires_at) return false;
  // mark paired
  db.prepare('UPDATE pairings SET paired_at = ? WHERE whatsapp_id = ?').run(Date.now(), whatsappId);
  // ensure user exists
  const userRow = db.prepare('SELECT id FROM users WHERE whatsapp_id = ?').get(whatsappId);
  if (!userRow) {
    db.prepare('INSERT INTO users (whatsapp_id, created_at) VALUES (?, ?)').run(whatsappId, Date.now());
  }
  return true;
}

export function unpair(whatsappId: string) {
  const db = getDb();
  db.prepare('DELETE FROM pairings WHERE whatsapp_id = ?').run(whatsappId);
}

export function isPaired(whatsappId: string) {
  const db = getDb();
  const row = db.prepare('SELECT paired_at FROM pairings WHERE whatsapp_id = ?').get(whatsappId);
  return !!(row && row.paired_at);
}
