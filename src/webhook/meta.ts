import { Request, Response } from 'express';
import { askAI } from '../ai';
import { logger } from '../utils/logger';
import * as db from '../db/sqlite';
import { runCommand } from '../commands/loader';
import { sendText } from '../utils/metaSender';

// Simplified Meta webhook handler: supports verification and message processing
export async function handleWebhook(req: Request, res: Response) {
  // Handle verification challenge
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const challenge = req.query['hub.challenge'];
    const token = req.query['hub.verify_token'];
    // Accept any token for now — recommend setting VERIFY_TOKEN in env and verifying
    if (challenge) return res.send(challenge as string);
    return res.sendStatus(200);
  }

  const body = req.body;
  const entry = Array.isArray(body.entry) ? body.entry[0] : body;
  const changes = entry?.changes?.[0];
  const value = changes?.value || entry?.value;
  const messages = value?.messages;
  if (!messages || messages.length === 0) return res.sendStatus(200);
  const msg = messages[0];
  const from = `whatsapp:${msg.from}`;
  const text = msg.text?.body || '';

  logger.info(`Incoming message from ${from}: ${text}`);

  // Try command handler
  if (text.startsWith('.')) {
    const reply = await runCommand(from, text);
    if (reply) {
      await sendText(from, reply.toString());
      return res.sendStatus(200);
    }
  }

  // Non-command messages: auto AI reply in DM or when bot is mentioned in groups
  // Determine if this is a group message
  const isGroup = !!msg?.context?.group_id || !!msg?.group_id;
  if (!isGroup) {
    // Direct message: use AI auto-reply
    const answer = await askAI(text || 'Hello');
    await sendText(from, answer);
    return res.sendStatus(200);
  }

  // Group message: only reply if mentioned (simple check: body contains bot id or @)
  const botMentioned = text.includes('EMZY AI') || text.includes('@emzy');
  if (botMentioned) {
    const answer = await askAI(text);
    await sendText(from, answer);
    return res.sendStatus(200);
  }

  // Otherwise ignore
  res.sendStatus(200);
}
