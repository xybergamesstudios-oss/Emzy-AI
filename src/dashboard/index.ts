import { Request, Response } from 'express';
import { CONFIG } from '../config';
import fs from 'fs';
import path from 'path';
import { addClient, broadcastUpdate } from './broadcast';

export const dashboardRouter = require('express').Router();

function auth(req: Request, res: Response, next: any) {
  const token = req.header('x-owner-token') || req.query.token;
  if (!token || token !== CONFIG.OWNER_TOKEN) return res.status(401).send('Unauthorized');
  next();
}

dashboardRouter.post('/broadcast-settings', auth, (req: Request, res: Response) => {
  const settings = req.body;
  const p = path.join(process.cwd(), 'data');
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  const filePath = path.join(p, 'settings.json');
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));

  // Broadcast to SSE clients
  try {
    broadcastUpdate(settings);
  } catch (e) {
    // ignore
  }

  return res.json({ ok: true, message: 'Settings saved and broadcast to connected bot instances.' });
});

dashboardRouter.get('/stream', auth, (req: Request, res: Response) => {
  // Register SSE client
  addClient(res);
});

dashboardRouter.get('/training_examples', auth, (req: Request, res: Response) => {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
    if (!fs.existsSync(dbPath)) return res.json({ examples: [] });
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);
    const rows = db.prepare('SELECT id, source_whatsapp, input_text, response_text, created_at FROM training_examples ORDER BY created_at DESC LIMIT 200').all();
    res.json({ examples: rows });
  } catch (err) {
    res.status(500).json({ error: 'Could not read training examples' });
  }
});
