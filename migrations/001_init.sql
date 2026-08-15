-- 001_init.sql (updated)
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

CREATE TABLE IF NOT EXISTS groups (
  id SERIAL PRIMARY KEY,
  group_id TEXT UNIQUE,
  name TEXT,
  anti_link BOOLEAN DEFAULT TRUE,
  anti_status BOOLEAN DEFAULT TRUE,
  warn_limit INTEGER DEFAULT 6,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS warnings (
  id SERIAL PRIMARY KEY,
  whatsapp_id TEXT,
  group_id TEXT,
  count INTEGER DEFAULT 0,
  last_warn_at BIGINT
);

CREATE TABLE IF NOT EXISTS training_examples (
  id SERIAL PRIMARY KEY,
  source_whatsapp TEXT,
  input_text TEXT,
  response_text TEXT,
  created_at BIGINT
);
