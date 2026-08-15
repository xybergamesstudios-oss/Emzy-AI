Dashboard README

This dashboard provides admin UI and API endpoints to review, preview, enable/disable, snapshot, and run sample tests for the dynamic commands imported into the bot.

Endpoints (all protected by OWNER_TOKEN via x-owner-token header or token query param):
- GET /dashboard/ -> static HTML admin page
- GET /dashboard/api/commands?q=&category=&page=&limit= -> list commands
- POST /dashboard/api/command/enable { trigger, enabled } -> enable/disable single
- POST /dashboard/api/commands/bulk-enable { category, enabled } -> bulk enable/disable
- POST /dashboard/api/snapshot -> create JSON snapshot file in data/ (returns path)
- GET /dashboard/api/stats -> total counts and per-category breakdown
- POST /dashboard/api/run-samples { count } -> returns random sample rows for quick checks

Mounting
In your Express app add:

import dashboardRoutes from './dashboard/routes';
app.use('/dashboard', dashboardRoutes);

Security
- Set OWNER_TOKEN env variable to a secure value and use x-owner-token header in requests.
- The UI expects you to paste the token into the Owner token input box; it will send it as x-owner-token on API requests.

Notes
- All imported commands are disabled by default (enabled = FALSE). Use the dashboard to preview and enable safely.
- Snapshot files are written to data/commands_snapshot_<timestamp>.json and should be backed up.
