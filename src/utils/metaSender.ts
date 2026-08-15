import axios from 'axios';
import { CONFIG } from '../config';
import { logger } from './logger';

const GRAPH_BASE = 'https://graph.facebook.com';

export async function sendText(to: string, message: string) {
  // to must be in whatsapp:+{number} format without spaces
  if (!CONFIG.META_WHATSAPP_TOKEN || !CONFIG.META_PHONE_NUMBER_ID) {
    logger.warn('META_WHATSAPP_TOKEN or META_PHONE_NUMBER_ID not configured — skipping send');
    return;
  }
  try {
    const url = `${GRAPH_BASE}/v17.0/${CONFIG.META_PHONE_NUMBER_ID}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      to: to.replace('whatsapp:', ''),
      type: 'text',
      text: { body: message }
    };
    const res = await axios.post(url, body, {
      headers: { Authorization: `Bearer ${CONFIG.META_WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' }
    });
    logger.info('Sent message via Meta', res.data);
  } catch (err: any) {
    logger.error('Error sending message via Meta', err?.response?.data || err.message || err);
  }
}
