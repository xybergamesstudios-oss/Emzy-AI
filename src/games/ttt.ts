import { registerCommand } from '../commands/loader';
import { getDb } from '../db';

// Simple Tic-Tac-Toe commands using DB table ttt_games
registerCommand('.tictactoe', async (from, args) => {
  // .tictactoe start OR .tictactoe join <gameid> OR .tictactoe board
  const sub = args[0];
  const db = getDb();
  if (!sub || sub === 'start') {
    const gameId = Math.random().toString(36).slice(2, 10);
    const board = '---------'; // 9 chars
    const stmt = db.prepare('INSERT INTO ttt_games (game_id, board, player_x, player_o, next_turn, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(gameId, board, from, null, from, 'waiting', Date.now());
    return `Tic-Tac-Toe created. Game ID: ${gameId}. Another player can join with .tictactoe join ${gameId}`;
  }
  if (sub === 'join') {
    const gameId = args[1];
    if (!gameId) return 'Usage: .tictactoe join <gameid>';
    const row = db.prepare('SELECT * FROM ttt_games WHERE game_id = ?').get(gameId);
    if (!row) return 'Game not found.';
    if (row.player_o) return 'Game already has two players.';
    db.prepare('UPDATE ttt_games SET player_o = ?, status = ? WHERE game_id = ?').run(from, 'playing', gameId);
    return `Joined game ${gameId}. It's ${row.next_turn === from ? 'your' : "player X's"} turn.`;
  }
  if (sub === 'board') {
    const gameId = args[1];
    if (!gameId) return 'Usage: .tictactoe board <gameid>';
    const row = db.prepare('SELECT * FROM ttt_games WHERE game_id = ?').get(gameId);
    if (!row) return 'Game not found.';
    const b = row.board.split('').map((c: string, i: number) => (c === '-' ? (i + 1).toString() : c)).reduce((acc: string[], cur: string, idx: number) => { acc.push(cur); return acc; }, []);
    const boardStr = `\n${b[0]} | ${b[1]} | ${b[2]}\n- + - + -\n${b[3]} | ${b[4]} | ${b[5]}\n- + - + -\n${b[6]} | ${b[7]} | ${b[8]}`;
    return `Game ${gameId} board:${boardStr}`;
  }
  return 'Tic-Tac-Toe commands: .tictactoe start | .tictactoe join <id> | .tictactoe board <id>';
});
