// Economy gambling skeleton - to be completed with atomic DB transactions and configurable house edge
import { getDb } from '../db';
import { logger } from '../utils/logger';

export interface GambleResult {
  success: boolean;
  payout: number;
  message: string;
}

// Play slots - placeholder logic using crypto RNG and DB transaction
export async function playSlots(whatsappId: string, bet: number): Promise<GambleResult> {
  // TODO: implement DB transaction, house edge, ticketing, jackpot funding
  const symbols = ['🍒','🍋','🔔','⭐','7'];
  const a = symbols[Math.floor(Math.random()*symbols.length)];
  const b = symbols[Math.floor(Math.random()*symbols.length)];
  const c = symbols[Math.floor(Math.random()*symbols.length)];
  let payout = 0;
  let msg = `${a} ${b} ${c}`;
  if (a===b && b===c) { payout = Math.floor(bet*3); msg += `\n🎉 JACKPOT! Payout: $${payout}`; }
  else if (a===b||b===c||a===c) { payout = Math.floor(bet*1.5); msg += `\n✅ Small win: $${payout}`; }
  else { msg += `\n❌ You lost $${bet}`; }
  logger.info(`Slots: ${whatsappId} bet ${bet} -> payout ${payout}`);
  return { success: payout>0, payout, message: msg };
}

export async function playRoulette(whatsappId:string, bet:number, choice:string): Promise<GambleResult> {
  // TODO: implement numeric bets, color/odd-even, payout multipliers
  const roll = Math.floor(Math.random()*36)+1;
  const color = (roll%2===0)?'black':'red';
  let payout=0; let win=false;
  if (choice==='red' && color==='red') { payout = bet*2; win=true; }
  if (choice==='black' && color==='black') { payout = bet*2; win=true; }
  const msg = `🎡 Roll: ${roll} (${color})\n${win?`✅ You win $${payout}`:`❌ You lose $${bet}`}`;
  return { success: win, payout, message: msg };
}

export async function playBlackjack(whatsappId:string, bet:number): Promise<GambleResult> {
  // Placeholder: simple 50/50 outcome
  const win = Math.random() < 0.5;
  const payout = win ? Math.floor(bet*2) : 0;
  const msg = win ? `🃏 Blackjack! You win $${payout}` : `🃏 Dealer wins. You lose $${bet}`;
  return { success: win, payout, message: msg };
}
