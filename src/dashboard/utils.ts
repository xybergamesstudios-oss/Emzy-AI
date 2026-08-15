// Simple auth middleware reused by dashboard routes
import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.header('x-owner-token') || req.query.token || req.cookies?.owner_token;
  const OWNER_TOKEN = process.env.OWNER_TOKEN || '';
  if (!OWNER_TOKEN) return res.status(401).send('OWNER_TOKEN not configured');
  if (!token || token !== OWNER_TOKEN) return res.status(401).send('Unauthorized');
  next();
}
