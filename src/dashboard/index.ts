import { Router, Request, Response } from 'express';
import { CONFIG } from '../config';
import fs from 'fs';
import path from 'path';

export const dashboardRouter = Router();

function auth(req: Request, res: Response, next: any) {
  const token = req.header('x-owner-token') || req.query.token;
  if (!token || token !== CONFIG.OWNER_TOKEN) return res.status(401).send('Unauthorized');
  next();
}

dashboardRouter.get('/', auth, (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'src', 'dashboard', 'index.html'));
});

dashboardRouter.get('/pairings', auth, (req: Request, res: Response) => {
  // read pairings from DB file directly (sqlite) for now
  try {
    const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
    if (!fs.existsSync(dbPath)) return res.json({ pairings: [] });
    // simple approach: open sqlite and query
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);
    const rows = db.prepare('SELECT whatsapp_id, code, expires_at, paired_at FROM pairings').all();
    res.json({ pairings: rows });
  } catch (err) {
    res.status(500).json({ error: 'Could not read pairings' });
  }
});

// Store GROQ key to data/groq.key for convenience (only if owner)
dashboardRouter.post('/set-groq', auth, (req: Request, res: Response) => {
  const key = req.body.key;
  if (!key) return res.status(400).send('Missing key');
  const p = path.join(process.cwd(), 'data');
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  fs.writeFileSync(path.join(p, 'groq.key'), key);
  res.json({ ok: true, message: 'GROQ key saved to data/groq.key (also set GROQ_API_KEY in environment for production)' });
});
