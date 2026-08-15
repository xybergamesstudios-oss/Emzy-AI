import { groqGenerate } from './groq';

export async function askAI(question: string) {
  const prompt = `User asks: ${question}`;
  const reply = await groqGenerate(prompt);
  return reply;
}
