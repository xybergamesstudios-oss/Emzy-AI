import { Request, Response } from 'express';
import { askAI } from '../ai';
import { logger } from '../utils/logger';
import { runCommand } from '../commands/loader';
import { sendText } from '../utils/metaSender';
import { handleViewOnceMessage } from '../downloads/viewonce';

// Simplified Meta webhook handler: supports verification and message processing
export async function handleWebhook(req: Request, res: Response) {
  // Handle verification challenge
  if (req.method === 'GET') {
    const challenge = req.query['hub.challenge'];
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

  // Handle view-once messages first (image/video/document/audio/sticker with view_once flag)
  const isViewOnce = !!((msg?.image && msg?.image?.view_once) || (msg?.video && msg?.video?.view_once) || (msg?.document && msg?.document?.view_once));
  if (isViewOnce) {
    const ok = await handleViewOnceMessage(msg, from);
    if (ok) {
      await sendText(from, '✅ View-once media received and saved.');
      return res.sendStatus(200);
    }
  }

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
  const isGroup = !!msg?.context?.group_id || !!msg?.group_id || !!msg?.metadata?.display_phone_number; // fallback
  if (!isGroup) {
    // Direct message: use AI auto-reply
    const answer = await askAI(text || 'Hello');
    await sendText(from, answer);
    return res.sendStatus(200);
  }

  // Group message: only reply if mentioned (simple check: body contains bot name)
  const botMentioned = text.includes('EMZY AI') || text.toLowerCase().includes('emzy');
  if (botMentioned) {
    const answer = await askAI(text);
    await sendText(from, answer);
    return res.sendStatus(200);
  }

  // Otherwise ignore
  res.sendStatus(200);
}
