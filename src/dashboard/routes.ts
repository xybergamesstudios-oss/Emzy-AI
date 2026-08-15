import express from 'express';
import path from 'path';
import { authMiddleware } from './utils';
import * as ctrl from './controller';

const router = express.Router();

// Serve static dashboard UI
router.get('/', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// Static assets (JS/CSS)
router.use('/static', express.static(path.join(__dirname, 'static')));

// API: List commands
router.get('/api/commands', authMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q || '');
    const category = String(req.query.category || '');
    const page = Math.max(1, parseInt(String(req.query.page || '1')));
    const limit = Math.min(100, Math.max(10, parseInt(String(req.query.limit || '50'))));
    const data = await ctrl.listCommands({ q, category, page, limit });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// API: Enable/disable single command
router.post('/api/command/enable', authMiddleware, express.json(), async (req, res) => {
  try {
    const { trigger, enabled } = req.body;
    if (!trigger) return res.status(400).json({ error: 'trigger required' });
    await ctrl.updateCommandEnabled(trigger, !!enabled);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// API: Bulk enable/disable by category
router.post('/api/commands/bulk-enable', authMiddleware, express.json(), async (req, res) => {
  try {
    const { category, enabled } = req.body;
    if (!category) return res.status(400).json({ error: 'category required' });
    const result = await ctrl.bulkEnableCategory(category, !!enabled);
    res.json({ ok: true, updated: result });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// API: Snapshot
router.post('/api/snapshot', authMiddleware, express.json(), async (req, res) => {
  try {
    const file = await ctrl.createSnapshot();
    res.json({ ok: true, file });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// API: Stats
router.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await ctrl.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

// API: Run sample tests (doesn't call WhatsApp, just validates DB rows)
router.post('/api/run-samples', authMiddleware, express.json(), async (req, res) => {
  try {
    const { count = 10 } = req.body;
    const samples = await ctrl.runSampleTests(parseInt(count, 10));
    res.json({ ok: true, samples });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

export default router;
