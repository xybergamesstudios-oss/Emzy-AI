import { registerCommand } from './loader';
import * as gambling from '../economy/gambling';
import * as transactions from '../economy/transactions';

registerCommand('.slots', async (from, args) => {
  const bet = parseInt(args[0], 10);
  if (!bet || bet <= 0) return 'Usage: .slots <bet amount>'; 
  // Attempt to substract bet atomically
  const ok = transactions.subCashAtomic(from, bet);
  if (!ok) return 'Insufficient funds.';
  const result = await gambling.playSlots(from, bet);
  if (result.payout > 0) transactions.addCashAtomic(from, result.payout);
  return result.message;
});

registerCommand('.roulette', async (from, args) => {
  const bet = parseInt(args[0], 10);
  const choice = (args[1] || '').toLowerCase();
  if (!bet || !choice) return 'Usage: .roulette <bet> <red|black>'; 
  const ok = transactions.subCashAtomic(from, bet);
  if (!ok) return 'Insufficient funds.';
  const result = await gambling.playRoulette(from, bet, choice);
  if (result.payout > 0) transactions.addCashAtomic(from, result.payout);
  return result.message;
});

registerCommand('.blackjack', async (from, args) => {
  const bet = parseInt(args[0], 10);
  if (!bet) return 'Usage: .blackjack <bet>'; 
  const ok = transactions.subCashAtomic(from, bet);
  if (!ok) return 'Insufficient funds.';
  const result = await gambling.playBlackjack(from, bet);
  if (result.payout > 0) transactions.addCashAtomic(from, result.payout);
  return result.message;
});
