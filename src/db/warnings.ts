import { getDb } from './index';

export function addWarning(whatsappId: string, groupId: string) {
  const db = getDb();
  const row = db.prepare('SELECT id, count FROM warnings WHERE whatsapp_id = ? AND group_id = ?').get(whatsappId, groupId);
  if (row) {
    db.prepare('UPDATE warnings SET count = count + 1, last_warn_at = ? WHERE id = ?').run(Date.now(), row.id);
    const updated = db.prepare('SELECT count FROM warnings WHERE id = ?').get(row.id);
    return updated.count;
  }
  db.prepare('INSERT INTO warnings (whatsapp_id, group_id, count, last_warn_at) VALUES (?, ?, ?, ?)').run(whatsappId, groupId, 1, Date.now());
  return 1;
}

export function getWarnings(whatsappId: string, groupId: string) {
  const db = getDb();
  const row = db.prepare('SELECT count, last_warn_at FROM warnings WHERE whatsapp_id = ? AND group_id = ?').get(whatsappId, groupId);
  if (!row) return { count: 0, last_warn_at: null };
  return { count: row.count, last_warn_at: row.last_warn_at };
}

export function resetWarnings(whatsappId: string, groupId: string) {
  const db = getDb();
  db.prepare('DELETE FROM warnings WHERE whatsapp_id = ? AND group_id = ?').run(whatsappId, groupId);
}
