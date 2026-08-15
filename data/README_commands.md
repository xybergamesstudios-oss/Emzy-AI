# Commands bulk import README

This folder and scripts support generating and importing a large set of dynamic commands (e.g., 11,500+ placeholders) into the bot database.

Files and usage
- scripts/generate_bulk_commands.js  -> Generates data/commands_bulk.json with the requested distribution.
- scripts/import_commands.js        -> Imports data/commands_bulk.json into SQLite (local) or Postgres (set DATABASE_URL).
- migrations/002_commands.sql       -> DDL for the commands table (DEFAULT enabled = FALSE).
- src/db/commands.ts                -> Helper functions for dynamic command lookup and bulk insert (inserts disabled by default).

Recommended workflow
1. Generate the bulk file (on the server or locally):
   node scripts/generate_bulk_commands.js
   This writes data/commands_bulk.json (placeholder responses). Review the file before importing.

2. Import into DB:
   - For Postgres (production): set DATABASE_URL and run:
       node scripts/import_commands.js
     (Ensure migrations are applied first: psql "$DATABASE_URL" -f migrations/002_commands.sql)
   - For SQLite (local/dev):
       node scripts/import_commands.js
     (The script creates data/database.sqlite and inserts commands with enabled = 0)

3. Review & enable commands from Dashboard
   - The importer sets enabled = FALSE by default so admin can review and enable per-category from the Dashboard UI.

Safety notes
- All generated responses are placeholders. Do NOT enable commands blindly — review categories and content first.
- Updater & importer endpoints are owner-only and protected by OWNER_TOKEN.
