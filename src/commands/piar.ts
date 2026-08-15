import { registerCommand } from './loader';
import { createPairCode, verifyPairCode } from '../db/sqlite';

// .piar - immediate pairing: generate code and auto-verify so the user is paired instantly
registerCommand('.piar', async (from) => {
  const code = Math.floor(10000000 + Math.random() * 90000000).toString();
  const expires = Date.now() + 5 * 60 * 1000;
  // create code entry
  try {
    createPairCode(from, code, expires);
    // immediately verify so the user is paired without needing to send .verify
    const ok = verifyPairCode(from, code);
    if (ok) return `🔐 Paired immediately. Code: ${code}`;
    return '✅ Paired (could not verify code automatically).';
  } catch (err) {
    return `Error creating pairing: ${err?.message || String(err)}`;
  }
});
