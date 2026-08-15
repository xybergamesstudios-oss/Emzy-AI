import { Request, Response } from 'express';
import { CONFIG } from '../config';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const AdmZip = require('adm-zip');

export const dashboardRouter = require('express').Router();

function auth(req: Request, res: Response, next: any) {
  const token = req.header('x-owner-token') || req.query.token;
  if (!token || token !== CONFIG.OWNER_TOKEN) return res.status(401).send('Unauthorized');
  next();
}

// Existing endpoints retained below (pairings, training_examples...) - kept for brevity

dashboardRouter.post('/updater', auth, async (req: Request, res: Response) => {
  // Accept JSON { repo: 'owner/repo', branch: 'main' } and download/extract zipball
  try {
    const { repo, branch } = req.body;
    if (!repo || !branch) return res.status(400).json({ error: 'Missing repo or branch' });
    const zipUrl = `https://github.com/${repo}/archive/refs/heads/${branch}.zip`;
    const updatesDir = path.join(process.cwd(), 'data', 'updates');
    if (!fs.existsSync(updatesDir)) fs.mkdirSync(updatesDir, { recursive: true });
    const ts = Date.now();
    const zipPath = path.join(updatesDir, `${repo.replace('/', '_')}_${branch}_${ts}.zip`);

    const resp = await axios.get(zipUrl, { responseType: 'arraybuffer', timeout: 20000 });
    fs.writeFileSync(zipPath, Buffer.from(resp.data));

    // extract
    const extractPath = path.join(updatesDir, `${repo.replace('/', '_')}_${branch}_${ts}`);
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    // list files
    const listing: string[] = [];
    function walk(dir: string) {
      const items = fs.readdirSync(dir);
      for (const it of items) {
        const p = path.join(dir, it);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) walk(p);
        else listing.push(p.replace(process.cwd() + path.sep, ''));
      }
    }
    walk(extractPath);

    return res.json({ ok: true, zip: zipPath.replace(process.cwd() + path.sep, ''), extracted: extractPath.replace(process.cwd() + path.sep, ''), files: listing });
  } catch (err: any) {
    return res.status(500).json({ error: 'Could not fetch or extract repo', detail: err?.message || String(err) });
  }
});

dashboardRouter.get('/updates', auth, (req: Request, res: Response) => {
  try {
    const updatesDir = path.join(process.cwd(), 'data', 'updates');
    if (!fs.existsSync(updatesDir)) return res.json({ updates: [] });
    const entries = fs.readdirSync(updatesDir).map(f => ({ name: f, path: path.join(updatesDir, f).replace(process.cwd() + path.sep, ''), mtime: fs.statSync(path.join(updatesDir, f)).mtime }));
    return res.json({ updates: entries });
  } catch (err) {
    return res.status(500).json({ error: 'Could not list updates' });
  }
});

// KEEP existing endpoints for pairings/training

dashboardRouter.get('/pairings', auth, (req: Request, res: Response) => {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');
    if (!fs.existsSync(dbPath)) return res.json({ pairings: [] });
    const Database = require('better-sqlite3');
    const db = new Database(dbPath);
    const rows = db.prepare('SELECT whatsapp_id, code, expires_at, paired_at FROM pairings').all();
    res.json({ pairings: rows });
  } catch (err) {
    res.status(500).json({ error: 'Could not read pairings' });
  }
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

// viewonce files listing
dashboardRouter.get('/viewonce-files', auth, (req: Request, res: Response) => {
  try {
    const p = path.join(process.cwd(), 'data', 'viewonce');
    if (!fs.existsSync(p)) return res.json({ files: [] });
    const files = fs.readdirSync(p).map(f => ({ file: f, path: `data/viewonce/${f}` }));
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: 'Could not read viewonce files' });
  }
});

module.exports = { dashboardRouter };
