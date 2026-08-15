import { getDb } from '../db';
import { logger } from '../utils/logger';

export function ensureUserSync(whatsappId: string) {
  const db = getDb();
  const row = db.prepare('SELECT id FROM users WHERE whatsapp_id = ?').get(whatsappId);
  if (!row) {
    db.prepare('INSERT INTO users (whatsapp_id, created_at) VALUES (?, ?)').run(whatsappId, Date.now());
  }
}

export function getBalanceSync(whatsappId: string) {
  const db = getDb();
  const row = db.prepare('SELECT cash FROM users WHERE whatsapp_id = ?').get(whatsappId);
  return (row && row.cash) ? row.cash : 0;
}

export function addCashAtomic(whatsappId: string, amount: number) {
  const db = getDb();
  ensureUserSync(whatsappId);
  const txn = db.transaction((amt: number) => {
    db.prepare('UPDATE users SET cash = cash + ? WHERE whatsapp_id = ?').run(amt, whatsappId);
  });
  try {
    txn(amount);
    logger.info(`addCashAtomic: ${whatsappId} +${amount}`);
    return true;
  } catch (err) {
    logger.error('addCashAtomic error', err);
    return false;
  }
}

export function subCashAtomic(whatsappId: string, amount: number) {
  const db = getDb();
  ensureUserSync(whatsappId);
  const row = db.prepare('SELECT cash FROM users WHERE whatsapp_id = ?').get(whatsappId);
  const current = (row && row.cash) ? row.cash : 0;
  if (current < amount) return false;
  const txn = db.transaction((amt: number) => {
    db.prepare('UPDATE users SET cash = cash - ? WHERE whatsapp_id = ?').run(amt, whatsappId);
  });
  try {
    txn(amount);
    logger.info(`subCashAtomic: ${whatsappId} -${amount}`);
    return true;
  } catch (err) {
    logger.error('subCashAtomic error', err);
    return false;
  }
}

export function transferAtomic(fromId: string, toId: string, amount: number) {
  const db = getDb();
  ensureUserSync(fromId);
  ensureUserSync(toId);
  const row = db.prepare('SELECT cash FROM users WHERE whatsapp_id = ?').get(fromId);
  const current = (row && row.cash) ? row.cash : 0;
  if (current < amount) return { ok: false, message: 'Insufficient funds' };
  const txn = db.transaction((f: string, t: string, amt: number) => {
    db.prepare('UPDATE users SET cash = cash - ? WHERE whatsapp_id = ?').run(amt, f);
    db.prepare('UPDATE users SET cash = cash + ? WHERE whatsapp_id = ?').run(amt, t);
  });
  try {
    txn(fromId, toId, amount);
    logger.info(`transferAtomic: ${fromId} -> ${toId} $${amount}`);
    return { ok: true };
  } catch (err) {
    logger.error('transferAtomic error', err);
    return { ok: false, message: 'Transfer failed' };
  }
}
