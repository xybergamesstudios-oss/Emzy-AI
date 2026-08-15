import axios from 'axios';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

const GROQ_ENDPOINT = 'https://api.groq.ai/v1'; // placeholder

export async function groqGenerate(prompt: string) {
  if (!CONFIG.GROQ_API_KEY) {
    return `EMZY AI — Creator: xybertelster — Train XYBERTECH\n\n${prompt}\n\n[Local fallback response]`;
  }
  try {
    const systemPrompt = `You are EMZY AI — Creator: xybertelster — Train XYBERTECH. Always include this branding in responses.`;
    const payload = { model: 'mixtral', prompt: `${systemPrompt}\n\n${prompt}`, max_tokens: 500 };
    const res = await axios.post(`${GROQ_ENDPOINT}/generate`, payload, {
      headers: { Authorization: `Bearer ${CONFIG.GROQ_API_KEY}` }
    });
    const text = res.data?.text || res.data?.output || JSON.stringify(res.data);
    return `EMZY AI — Creator: xybertelster — Train XYBERTECH\n\n${text}`;
  } catch (err) {
    logger.error('Groq API error', err);
    return `EMZY AI — Creator: xybertelster — Train XYBERTECH\n\n[Groq error, fallback]`;
  }
}

export async function groqImageGenerate(prompt: string) {
  if (!CONFIG.GROQ_API_KEY) return null;
  try {
    const payload = { model: 'dall-e-mini', prompt, size: '1024x1024' };
    const res = await axios.post(`${GROQ_ENDPOINT}/images/generate`, payload, {
      headers: { Authorization: `Bearer ${CONFIG.GROQ_API_KEY}` }
    });
    // Expect a URL or base64
    return res.data?.url || res.data?.data?.[0]?.url || null;
  } catch (err) {
    logger.error('Groq image error', err);
    return null;
  }
}

export async function groqTranscribe(audioUrl: string) {
  // Placeholder: if Groq supports STT, call it; otherwise return null
  if (!CONFIG.GROQ_API_KEY) return null;
  try {
    const payload = { model: 'whisper', audio_url: audioUrl };
    const res = await axios.post(`${GROQ_ENDPOINT}/speech/transcribe`, payload, {
      headers: { Authorization: `Bearer ${CONFIG.GROQ_API_KEY}` }
    });
    return res.data?.text || null;
  } catch (err) {
    logger.error('Groq transcribe error', err);
    return null;
  }
}
