-- 002_commands.sql
CREATE TABLE IF NOT EXISTS commands (
  id SERIAL PRIMARY KEY,
  trigger TEXT UNIQUE NOT NULL,
  category TEXT,
  response TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at BIGINT
);
