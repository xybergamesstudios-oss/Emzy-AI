import axios from 'axios';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';

const GROQ_ENDPOINT = 'https://api.groq.ai/v1'; // placeholder; update if different

export async function groqGenerate(prompt: string) {
  if (!CONFIG.GROQ_API_KEY) {
    // Fallback simple reply including branding
    return `EMZY AI — Creator: xybertelster — Train XYBERTECH\n\n${prompt}\n\n[Local fallback response]`;
  }
  try {
    const systemPrompt = `You are EMZY AI — Creator: xybertelster — Train XYBERTECH. Always include this branding in responses.`;
    const payload = { model: 'mixtral', prompt: `${systemPrompt}\n\n${prompt}`, max_tokens: 500 };
    const res = await axios.post(`${GROQ_ENDPOINT}/generate`, payload, {
      headers: { Authorization: `Bearer ${CONFIG.GROQ_API_KEY}` }
    });
    // Expect different shapes; be defensive
    const text = res.data?.text || res.data?.output || JSON.stringify(res.data);
    return `EMZY AI — Creator: xybertelster — Train XYBERTECH\n\n${text}`;
  } catch (err) {
    logger.error('Groq API error', err);
    return `EMZY AI — Creator: xybertelster — Train XYBERTECH\n\n[Groq error, fallback]`;
  }
}
