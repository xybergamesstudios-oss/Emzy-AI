import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config';
import { sendMedia } from '../utils/metaSender';
import { logger } from '../utils/logger';

const GRAPH_BASE = 'https://graph.facebook.com';

export async function handleViewOnceMessage(msg: any, from: string) {
  try {
    // Try to find a media id on the message for common types
    const mediaId = msg?.image?.id || msg?.document?.id || msg?.video?.id || msg?.audio?.id || msg?.sticker?.id || null;
    if (!mediaId) return null;

    // Fetch the media URL from Meta Graph API
    const resp = await axios.get(`${GRAPH_BASE}/v17.0/${mediaId}`, {
      params: { access_token: CONFIG.META_WHATSAPP_TOKEN }
    });

    const mediaUrl: string = resp.data?.url;
    if (!mediaUrl) return null;

    // Make a downloadable link; append access token if needed
    let downloadable = mediaUrl;
    try {
      const u = new URL(mediaUrl);
      u.searchParams.set('access_token', CONFIG.META_WHATSAPP_TOKEN);
      downloadable = u.toString();
    } catch (e) {
      // ignore URL parsing errors
    }

    // Attempt to send the media back to the user (as normal media)
    // Infer media type
    const mediaType = msg?.image ? 'image' : msg?.video ? 'video' : msg?.audio ? 'audio' : msg?.document ? 'document' : 'image';

    await sendMedia(from, downloadable, mediaType as any);

    // Optionally save a local copy for audit (persist in data/viewonce)
    try {
      const dlResp = await axios.get(downloadable, { responseType: 'arraybuffer' });
      const ext = (msg?.image && 'jpg') || (msg?.video && 'mp4') || (msg?.audio && 'ogg') || (msg?.document && 'bin') || 'dat';
      const p = path.join(process.cwd(), 'data', 'viewonce');
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      const filePath = path.join(p, `${mediaId}.${ext}`);
      fs.writeFileSync(filePath, Buffer.from(dlResp.data));
      logger.info('Saved view-once media to', filePath);
    } catch (err) {
      logger.warn('Could not save view-once media locally', err);
    }

    return true;
  } catch (err) {
    logger.error('Error handling view-once message', err);
    return null;
  }
}
