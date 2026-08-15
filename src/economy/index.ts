import { getDb } from '../db';

export async function getUser(whatsappId: string) {
  // Works with either sqlite getDb or postgres approach (postgres not returned here)
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE whatsapp_id = ?').get(whatsappId);
  return row;
}

export async function ensureUser(whatsappId: string) {
  const db = getDb();
  let row = db.prepare('SELECT * FROM users WHERE whatsapp_id = ?').get(whatsappId);
  if (!row) {
    db.prepare('INSERT INTO users (whatsapp_id, created_at) VALUES (?, ?)').run(whatsappId, Date.now());
    row = db.prepare('SELECT * FROM users WHERE whatsapp_id = ?').get(whatsappId);
  }
  return row;
}

export async function getBalance(whatsappId: string) {
  const user = await ensureUser(whatsappId);
  return user.cash || 0;
}

export async function addCash(whatsappId: string, amount: number) {
  const db = getDb();
  await ensureUser(whatsappId);
  db.prepare('UPDATE users SET cash = cash + ? WHERE whatsapp_id = ?').run(amount, whatsappId);
}

export async function claimDaily(whatsappId: string) {
  const db = getDb();
  await ensureUser(whatsappId);
  const row = db.prepare('SELECT last_daily, cash FROM users WHERE whatsapp_id = ?').get(whatsappId);
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  if (now - (row.last_daily || 0) < DAY) {
    const next = new Date((row.last_daily || 0) + DAY);
    return { ok: false, message: `You already claimed daily. Next claim: ${next.toISOString()}` };
  }
  const reward = Math.floor(2500 + Math.random() * 1000);
  db.prepare('UPDATE users SET cash = cash + ?, last_daily = ? WHERE whatsapp_id = ?').run(reward, now, whatsappId);
  return { ok: true, message: `📅 Daily reward: +$${reward} — enjoy!` };
}
