# Migrations for Postgres

-- 001_init.sql
CREATE TABLE IF NOT EXISTS pairings (
  id SERIAL PRIMARY KEY,
  whatsapp_id TEXT UNIQUE,
  code TEXT,
  expires_at BIGINT,
  paired_at BIGINT
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  whatsapp_id TEXT UNIQUE,
  name TEXT,
  cash BIGINT DEFAULT 20000,
  bank BIGINT DEFAULT 0,
  xp BIGINT DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_daily BIGINT DEFAULT 0,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS ttt_games (
  id SERIAL PRIMARY KEY,
  game_id TEXT UNIQUE,
  board TEXT,
  player_x TEXT,
  player_o TEXT,
  next_turn TEXT,
  status TEXT,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS trivia_sessions (
  id SERIAL PRIMARY KEY,
  session_id TEXT UNIQUE,
  question_index INTEGER,
  player_id TEXT,
  score INTEGER,
  created_at BIGINT
);
