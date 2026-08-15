// RPS game module
import { registerCommand } from '../commands/loader';
import { sendText } from '../utils/metaSender';

const choices = ['rock', 'paper', 'scissors'];

registerCommand('.rps', async (from, args) => {
  // usage: .rps or .rps rock
  const pick = args[0] ? args[0].toLowerCase() : null;
  if (!pick) {
    return 'Usage: .rps <rock|paper|scissors> — example: .rps rock';
  }
  if (!choices.includes(pick)) return 'Invalid choice. Use rock/paper/scissors.';
  const botPick = choices[Math.floor(Math.random() * choices.length)];
  let result = 'Draw';
  if (pick === botPick) result = 'Draw';
  else if ((pick === 'rock' && botPick === 'scissors') || (pick === 'paper' && botPick === 'rock') || (pick === 'scissors' && botPick === 'paper')) result = 'You win!';
  else result = 'You lose.';
  return `🎮 ROCK PAPER SCISSORS\nYou: ${pick}\nEmzy: ${botPick}\nResult: ${result}`;
});
