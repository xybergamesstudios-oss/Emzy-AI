# EMZY AI

This repository contains a scaffolded EMZY AI WhatsApp bot ready to deploy to Render (and Heroku). It uses the Meta WhatsApp Cloud API (no QR) and Groq for AI when GROQ_API_KEY is provided.

Quick start (local development)
- cp .env.example .env and fill values
- npm ci
- npm run dev

Build & run (production)
- npm ci
- npm run build
- npm start

Render deployment
- Connect this repo in Render as a Web Service
- Build command: npm ci && npm run build
- Start command: npm start
- Set environment variables in Render as in .env.example (META_WHATSAPP_TOKEN, META_PHONE_NUMBER_ID, GROQ_API_KEY, OWNER_WHATSAPP, OWNER_TOKEN, DATABASE_URL, PUBLIC_URL)
- Set webhook in Facebook/Meta Console to: POST {PUBLIC_URL}/webhook

Branding
All AI replies include the branding/footer: "EMZY AI — Creator: xybertelster — Train XYBERTECH" as requested.

Notes
- Database: production expects PostgreSQL (DATABASE_URL). For local dev a SQLite file is used by default.
- This is an initial scaffold: commands, games, and economy modules are modular and can be extended in src/commands, src/games, src/economy.
