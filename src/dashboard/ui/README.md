# Dashboard UI (React) - placeholder

This folder will contain the React-based admin dashboard for EMZY AI. It will include:

- Login using OWNER_TOKEN (x-owner-token header)
- Settings page (GROQ key, toggles for anti-link, gambling enable/disable)
- Pairings list and pairing code generator
- View-once files browser (preview + signed URL from S3)
- Training examples review & accept/reject
- Broadcast settings to apply to all bots (SSE and polling)

For now the server serves a minimal HTML UI at /dashboard; the full React UI will be added in the next commits.
