import { registerCommand } from './loader';
import { addWarning, getWarnings, resetWarnings } from '../db/warnings';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

// Warn command (owner/staff)
registerCommand('.warn', async (from, args) => {
  // .warn @user <groupId> (this is a simplified placeholder)
  const target = args[0];
  const groupId = args[1] || 'global';
  if (!target) return 'Usage: .warn <whatsappId> <groupId?>';
  const count = addWarning(target, groupId);
  if (count >= 6) {
    // auto-kick placeholder
    logger.info(`Auto-kick ${target} from group ${groupId} after ${count} warnings`);
    return `⚠️ ${target} has reached ${count} warnings and will be removed from the group.`;
  }
  return `⚠️ ${target} has been warned. Current warnings: ${count}`;
});

registerCommand('.warnings', async (from, args) => {
  const target = args[0] || from;
  const groupId = args[1] || 'global';
  const w = getWarnings(target, groupId);
  return `Warnings for ${target} in ${groupId}: ${w.count}`;
});

registerCommand('.resetwarn', async (from, args) => {
  const target = args[0];
  const groupId = args[1] || 'global';
  if (!target) return 'Usage: .resetwarn <whatsappId> <groupId?>';
  resetWarnings(target, groupId);
  return `✅ Warnings reset for ${target} in ${groupId}`;
});

// Train command: record example to training_examples table (local storage)
registerCommand('.train', async (from, args) => {
  const example = args.join(' ');
  if (!example) return 'Usage: .train <example input> | response in next message with .respond <response>'; 
  // Save the input for later pairing with response via simple file storage
  const p = path.join(process.cwd(), 'data');
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  const file = path.join(p, 'training_queue.txt');
  fs.appendFileSync(file, JSON.stringify({ from, input: example, created_at: Date.now() }) + '\n');
  return '🧠 Training example stored. Send .respond <response> to attach the response to the last example.';
});

registerCommand('.respond', async (from, args) => {
  const resp = args.join(' ');
  const p = path.join(process.cwd(), 'data', 'training_queue.txt');
  if (!fs.existsSync(p)) return 'No training example to respond to.';
  const lines = fs.readFileSync(p, 'utf-8').trim().split('\n');
  if (lines.length === 0) return 'No training example to respond to.';
  const last = JSON.parse(lines[lines.length - 1]);
  // save to training_examples table
  const { getDb } = await import('../db');
  const db = getDb();
  db.prepare('INSERT INTO training_examples (source_whatsapp, input_text, response_text, created_at) VALUES (?, ?, ?, ?)').run(last.from, last.input, resp, Date.now());
  // remove last line
  const remaining = lines.slice(0, -1).join('\n');
  fs.writeFileSync(p, remaining + (remaining ? '\n' : ''));
  return '✅ Training example saved.';
});
