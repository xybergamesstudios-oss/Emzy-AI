import fs from 'fs';
import path from 'path';

type CommandHandler = (from: string, args: string[]) => Promise<string> | string;

const commands: Record<string, CommandHandler> = {};

export function registerCommand(name: string, handler: CommandHandler) {
  commands[name] = handler;
}

export async function runCommand(from: string, text: string) {
  if (!text.startsWith('.')) return null;
  const parts = text.trim().split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);
  const handler = commands[cmd];
  if (!handler) return 'Unknown command';
  const res = await handler(from, args);
  return res;
}

// Register built-in commands dynamically
import { createPairCode, verifyPairCode, unpair as dbUnpair } from '../db/sqlite';
registerCommand('.pair', async (from) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000;
  createPairCode(from, code, expires);
  return `🔐 Code: ${code} — expires in 5 minutes. Send ".verify ${code}" to verify.`;
});
registerCommand('.verify', async (from, args) => {
  const code = args[0];
  if (!code) return 'Usage: .verify <code>';
  const ok = verifyPairCode(from, code);
  return ok ? '✅ Paired! Welcome to EMZY AI!' : '❌ Invalid or expired code.';
});
registerCommand('.unpair', async (from) => {
  dbUnpair(from);
  return '✅ Unpaired.';
});
