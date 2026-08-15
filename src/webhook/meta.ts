import { Request, Response } from 'express';
import { askAI } from '../ai';
import { logger } from '../utils/logger';
import { runCommand } from '../commands/loader';
import { sendText } from '../utils/metaSender';
import { handleViewOnceMessage } from '../downloads/viewonce';

// Simplified Meta webhook handler with verification token and rate limiting
export async function handleWebhook(req: Request, res: Response) {
  // Verify token (optional)
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || '';
  if (req.method === 'GET') {
    const challenge = req.query['hub.challenge'];
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    if (challenge) {
      if (VERIFY_TOKEN && token !== VERIFY_TOKEN) return res.sendStatus(403);
      return res.send(challenge as string);
    }
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

  // Handle view-once
  const isViewOnce = !!((msg?.image && msg?.image?.view_once) || (msg?.video && msg?.video?.view_once) || (msg?.document && msg?.document?.view_once));
  if (isViewOnce) {
    const ok = await handleViewOnceMessage(msg, from);
    if (ok) {
      await sendText(from, '✅ View-once media received and saved.');
      return res.sendStatus(200);
    }
  }

  // Command handling
  if (text.startsWith('.')) {
    try {
      const reply = await runCommand(from, text);
      if (reply) {
        await sendText(from, reply.toString());
        return res.sendStatus(200);
      }
    } catch (err) {
      logger.error('Command handler error', err);
      await sendText(from, '⚠️ An error occurred processing your command.');
      return res.sendStatus(200);
    }
  }

  // Auto AI
  const isGroup = !!msg?.context?.group_id || !!msg?.group_id || !!msg?.metadata?.display_phone_number;
  if (!isGroup) {
    const answer = await askAI(text || 'Hello');
    await sendText(from, answer);
    return res.sendStatus(200);
  }
  const botMentioned = text.includes('EMZY AI') || text.toLowerCase().includes('emzy');
  if (botMentioned) {
    const answer = await askAI(text);
    await sendText(from, answer);
    return res.sendStatus(200);
  }

  res.sendStatus(200);
}
