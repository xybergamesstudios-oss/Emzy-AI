import { registerCommand } from '../commands/loader';
import { getDb } from '../db';

function checkWin(board: string) {
  const b = board.split('');
  const lines = [
    [0,1,2],[3,4,5],[6,7,8], // rows
    [0,3,6],[1,4,7],[2,5,8], // cols
    [0,4,8],[2,4,6] // diags
  ];
  for (const [i,j,k] of lines) {
    if (b[i] !== '-' && b[i] === b[j] && b[j] === b[k]) return b[i];
  }
  if (b.every(c => c !== '-')) return 'draw';
  return null;
}

registerCommand('.tictactoe', async (from, args) => {
  // Subcommands: start | join <id> | board <id> | move <id> <pos>
  const sub = args[0];
  const db = getDb();

  if (!sub || sub === 'start') {
    const gameId = Math.random().toString(36).slice(2, 10);
    const board = '---------';
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
    const b = row.board.split('').map((c: string, i: number) => (c === '-' ? (i + 1).toString() : c));
    const boardStr = `\n${b[0]} | ${b[1]} | ${b[2]}\n- + - + -\n${b[3]} | ${b[4]} | ${b[5]}\n- + - + -\n${b[6]} | ${b[7]} | ${b[8]}`;
    return `Game ${gameId} board:${boardStr}`;
  }

  if (sub === 'move') {
    const gameId = args[1];
    const pos = parseInt(args[2], 10);
    if (!gameId || !pos || pos < 1 || pos > 9) return 'Usage: .tictactoe move <gameid> <position 1-9>';
    const row = db.prepare('SELECT * FROM ttt_games WHERE game_id = ?').get(gameId);
    if (!row) return 'Game not found.';
    if (row.status === 'waiting') return 'Game waiting for second player to join.';
    if (row.status === 'finished') return 'Game already finished.';
    const board = row.board.split('');
    const idx = pos - 1;
    if (board[idx] !== '-') return 'That position is already taken.';
    // determine player marker
    let marker = null;
    if (from === row.player_x) marker = 'X';
    else if (from === row.player_o) marker = 'O';
    else return 'You are not a player in this game.';
    if (row.next_turn !== from) return "It's not your turn.";

    board[idx] = marker;
    const newBoard = board.join('');
    // determine next turn
    const nextTurn = (row.player_x === from) ? row.player_o : row.player_x;
    // check win
    const winner = checkWin(newBoard);
    if (winner === 'draw') {
      db.prepare('UPDATE ttt_games SET board = ?, status = ? WHERE game_id = ?').run(newBoard, 'finished', gameId);
      return `Board updated. It's a draw!`; 
    }
    if (winner) {
      // winner is 'X' or 'O'
      const winnerId = (winner === 'X') ? row.player_x : row.player_o;
      db.prepare('UPDATE ttt_games SET board = ?, status = ? WHERE game_id = ?').run(newBoard, 'finished', gameId);
      return `Board updated. ${winnerId} (${winner}) has won the game!`;
    }
    // continue game
    db.prepare('UPDATE ttt_games SET board = ?, next_turn = ? WHERE game_id = ?').run(newBoard, nextTurn, gameId);
    const b = newBoard.split('').map((c: string, i: number) => (c === '-' ? (i + 1).toString() : c));
    const boardStr = `\n${b[0]} | ${b[1]} | ${b[2]}\n- + - + -\n${b[3]} | ${b[4]} | ${b[5]}\n- + - + -\n${b[6]} | ${b[7]} | ${b[8]}`;
    return `Move accepted. Next turn: ${nextTurn}${boardStr}`;
  }

  return 'Tic-Tac-Toe commands: .tictactoe start | .tictactoe join <id> | .tictactoe board <id> | .tictactoe move <id> <pos>';
});
