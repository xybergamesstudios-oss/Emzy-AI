import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';
import { sendMedia } from '../utils/metaSender';
import { logger } from '../utils/logger';
import { saveBufferToS3 } from '../storage/s3';

const GRAPH_BASE = 'https://graph.facebook.com';

async function fetchMediaWithRetry(url: string, retries = 3) {
  let lastErr: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
      return Buffer.from(res.data);
    } catch (err) {
      lastErr = err;
      const backoff = Math.pow(2, i) * 500;
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

export async function handleViewOnceMessage(msg: any, from: string) {
  try {
    const mediaId = msg?.image?.id || msg?.document?.id || msg?.video?.id || msg?.audio?.id || msg?.sticker?.id || null;
    if (!mediaId) return null;

    // Fetch media metadata
    const resp = await axios.get(`${GRAPH_BASE}/v17.0/${mediaId}`, {
      params: { access_token: CONFIG.META_WHATSAPP_TOKEN }
    });
    const mediaUrl: string = resp.data?.url;
    if (!mediaUrl) return null;

    let downloadable = mediaUrl;
    try {
      const u = new URL(mediaUrl);
      u.searchParams.set('access_token', CONFIG.META_WHATSAPP_TOKEN);
      downloadable = u.toString();
    } catch (e) {
      // ignore
    }

    // Download bytes with retries
    const buffer = await fetchMediaWithRetry(downloadable, 4);

    // Save locally
    const ext = (msg?.image && 'jpg') || (msg?.video && 'mp4') || (msg?.audio && 'ogg') || (msg?.document && 'bin') || 'dat';
    const p = path.join(process.cwd(), 'data', 'viewonce');
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    const filePath = path.join(p, `${mediaId}.${ext}`);
    fs.writeFileSync(filePath, buffer);
    logger.info('Saved view-once media to', filePath);

    // Upload to S3 if configured
    let s3url: string | null = null;
    try {
      s3url = await saveBufferToS3(buffer, `viewonce/${mediaId}.${ext}`);
      if (s3url) logger.info('Uploaded view-once media to S3, signed URL:', s3url);
    } catch (e) {
      logger.warn('Could not upload to S3', e);
    }

    // Attempt to send media back to the user using downloadable URL or S3 URL if available
    const mediaToSend = s3url || downloadable;
    const mediaType = msg?.image ? 'image' : msg?.video ? 'video' : msg?.audio ? 'audio' : msg?.document ? 'document' : 'image';
    await sendMedia(from, mediaToSend, mediaType as any);

    return { saved: filePath, s3: s3url };
  } catch (err) {
    logger.error('Error handling view-once message', err);
    return null;
  }
}
