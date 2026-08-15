# Deployment checklist & env vars

This file lists the environment variables and steps to deploy EMZY AI to Render.

Required env vars:
- META_WHATSAPP_TOKEN
- META_PHONE_NUMBER_ID
- GROQ_API_KEY
- OWNER_WHATSAPP (format: whatsapp:+254...) 
- OWNER_TOKEN (set to the generated token below or supply your own)
- DATABASE_URL (postgres://...) - recommended for production
- PUBLIC_URL (https://your-service.onrender.com)
- SECRET_KEY
- VERIFY_TOKEN (optional but recommended)

Optional for durable media storage:
- AWS_S3_BUCKET
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- S3_REGION

Generated OWNER_TOKEN (copy this value and set OWNER_TOKEN in Render):
OWNER_TOKEN=b3f9a7e2-4d1c-4e2b-9f1a-3c5b7d8e9f0a

Deployment steps (Render):
1. Connect repo xybergamesstudios-oss/Emzy-AI and use branch emzy-ai/initial.
2. Build command: npm ci && npm run build
3. Start command: npm start
4. Set env vars in Render as above.
5. Deploy and set webhook in Meta Console to POST {PUBLIC_URL}/webhook

Notes:
- After you set DATABASE_URL on Render, run scripts/run_migrations.sh to apply migrations, or run psql commands manually.
- Do not commit real secrets to the repo. Use Render env settings.
