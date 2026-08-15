import fs from 'fs';
import path from 'path';

// CONFIG now supports reading GROQ_API_KEY from disk if env not set
const env = process.env;
let groqFromFile = '';
try {
  const p = path.join(process.cwd(), 'data', 'groq.key');
  if (fs.existsSync(p)) groqFromFile = fs.readFileSync(p, 'utf-8').trim();
} catch (err) {
  // ignore
}

export const CONFIG = {
  PUBLIC_URL: env.PUBLIC_URL || '',
  META_WHATSAPP_TOKEN: env.META_WHATSAPP_TOKEN || '',
  META_PHONE_NUMBER_ID: env.META_PHONE_NUMBER_ID || '',
  GROQ_API_KEY: env.GROQ_API_KEY || groqFromFile || '',
  OWNER_WHATSAPP: env.OWNER_WHATSAPP || '',
  OWNER_TOKEN: env.OWNER_TOKEN || 'change_me',
  DATABASE_URL: env.DATABASE_URL || ''
};
