import { createPairCode, verifyPairCode, unpair as dbUnpair } from '../db/sqlite';
import { registerCommand } from './loader';
import * as economy from '../economy';

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

// Economy commands
registerCommand('.bal', async (from) => {
  const bal = await economy.getBalance(from);
  return `💰 Balance: $${bal}`;
});
registerCommand('.daily', async (from) => {
  const res = await economy.claimDaily(from);
  return res.message;
});
