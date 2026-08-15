import path from 'path';

export const CONFIG = {
  PUBLIC_URL: process.env.PUBLIC_URL || '',
  META_WHATSAPP_TOKEN: process.env.META_WHATSAPP_TOKEN || '',
  META_PHONE_NUMBER_ID: process.env.META_PHONE_NUMBER_ID || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  OWNER_WHATSAPP: process.env.OWNER_WHATSAPP || '',
  OWNER_TOKEN: process.env.OWNER_TOKEN || 'change_me',
  DATABASE_URL: process.env.DATABASE_URL || `sqlite:${path.join(process.cwd(), 'data', 'database.sqlite')}`,
};
