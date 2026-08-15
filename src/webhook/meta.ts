import { Request, Response } from 'express';
import { askAI } from '../ai';
import { logger } from '../utils/logger';
import * as db from '../db/sqlite';

// Simplified Meta webhook handler
export async function handleWebhook(req: Request, res: Response) {
  // Minimal Meta WhatsApp webhook parsing
  const body = req.body;
  // Basic verification omitted; expect user to set up webhook in Meta console
  const entry = Array.isArray(body.entry) ? body.entry[0] : body;
  const changes = entry?.changes?.[0];
  const value = changes?.value || entry?.value;
  const messages = value?.messages;
  if (!messages || messages.length === 0) return res.sendStatus(200);
  const msg = messages[0];
  const from = msg.from; // whatsapp id
  const text = msg.text?.body || '';

  logger.info(`Incoming message from ${from}: ${text}`);

  // Simple command parsing: commands start with dot '.'
  if (text.startsWith('.')) {
    const parts = text.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    if (cmd === '.pair') {
      // generate code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = Date.now() + 5 * 60 * 1000;
      db.createPairCode(from, code, expires);
      // respond via Meta reply API - for now return 200 with JSON instructing how to reply
      res.json({ reply: `🔐 Code: ${code} — expires in 5 minutes. Send ".verify ${code}" to verify.` });
      return;
    }
    if (cmd === '.verify') {
      const code = parts[1];
      if (!code) return res.json({ reply: 'Usage: .verify <code>' });
      const ok = db.verifyPairCode(from, code);
      if (ok) return res.json({ reply: '✅ Paired! Welcome to EMZY AI!' });
      return res.json({ reply: '❌ Invalid or expired code.' });
    }
    if (cmd === '.unpair') {
      db.unpair(from);
      return res.json({ reply: '✅ Unpaired.' });
    }
    if (cmd === '.ai' || cmd === '.ask') {
      const question = parts.slice(1).join(' ');
      if (!question) return res.json({ reply: 'Usage: .ai <question>' });
      const answer = await askAI(question);
      return res.json({ reply: answer });
    }

    return res.json({ reply: 'Unknown command. Send .pair to get started.' });
  }

  // Non-command: optional auto-reply in DM via AI
  // If message is direct and not a group, optionally reply
  // For simplicity, respond with branding echo
  res.json({ reply: `EMZY AI — Creator: xybertelster — Train XYBERTECH\n\nYou said: ${text}` });
}
