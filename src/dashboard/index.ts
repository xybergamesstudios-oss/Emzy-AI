import { Request, Response, Router } from 'express';
import { CONFIG } from '../config';

export const dashboardRouter = Router();

// Simple token auth middleware
function auth(req: Request, res: Response, next: any) {
  const token = req.header('x-owner-token') || req.query.token;
  if (!token || token !== CONFIG.OWNER_TOKEN) return res.status(401).send('Unauthorized');
  next();
}

// Minimal dashboard endpoints
dashboardRouter.get('/', auth, (req, res) => {
  res.json({ name: 'EMZY AI Dashboard', status: 'ok' });
});

dashboardRouter.get('/pairings', auth, (req, res) => {
  // Placeholder: list pairings
  res.json({ pairings: [] });
});
