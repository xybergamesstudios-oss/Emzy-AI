import { Request, Response } from 'express';
import { CONFIG } from '../config';
import fs from 'fs';
import path from 'path';
import { insertCommandsBulk } from '../db/commands';

export const dashboardRouter = require('express').Router();

function auth(req: Request, res: Response, next: any) {
  const token = req.header('x-owner-token') || req.query.token;
  if (!token || token !== CONFIG.OWNER_TOKEN) return res.status(401).send('Unauthorized');
  next();
}

// POST /dashboard/import-commands  -> reads data/commands_bulk.json and imports to DB (owner-only)
dashboardRouter.post('/import-commands', auth, (req: Request, res: Response) => {
  try {
    const bulkPath = path.join(process.cwd(), 'data', 'commands_bulk.json');
    if (!fs.existsSync(bulkPath)) return res.status(400).json({ error: 'commands_bulk.json not found. Generate first.' });
    const arr = JSON.parse(fs.readFileSync(bulkPath, 'utf-8'));
    insertCommandsBulk(arr);
    return res.json({ ok: true, imported: arr.length });
  } catch (err) {
    return res.status(500).json({ error: 'Import failed', detail: err?.message || String(err) });
  }
});

module.exports = { dashboardRouter };
