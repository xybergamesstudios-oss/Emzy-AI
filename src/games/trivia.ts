import { registerCommand } from '../commands/loader';

const questions = [
  { q: 'What is the capital of Kenya?', options: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'], a: 0 },
  { q: 'What is 5 + 7?', options: ['10', '11', '12', '13'], a: 2 }
];

const active: Record<string, { index: number, score: number }> = {};

registerCommand('.trivia', async (from, args) => {
  // Start a trivia session for the user
  active[from] = { index: 0, score: 0 };
  const q = questions[0];
  const opts = q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n');
  return `🎮 TRIVIA — Question 1:\n${q.q}\n${opts}\nReply with .answer <A|B|C|D>`;
});

registerCommand('.answer', async (from, args) => {
  const sess = active[from];
  if (!sess) return 'No active trivia. Start with .trivia';
  const ans = args[0]?.toUpperCase();
  if (!ans) return 'Usage: .answer <A|B|C|D>';
  const index = sess.index;
  const q = questions[index];
  const chosen = ans.charCodeAt(0) - 65;
  let msg = '';
  if (chosen === q.a) {
    sess.score += 1;
    msg = '✅ Correct!';
  } else {
    msg = `❌ Wrong. Correct: ${String.fromCharCode(65 + q.a)}`;
  }
  sess.index += 1;
  if (sess.index >= questions.length) {
    const final = sess.score;
    delete active[from];
    return `${msg}\nTrivia finished. Score: ${final}/${questions.length}`;
  }
  const next = questions[sess.index];
  const opts = next.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n');
  return `${msg}\nNext question:\n${next.q}\n${opts}\nReply with .answer <A|B|C|D>`;
});
