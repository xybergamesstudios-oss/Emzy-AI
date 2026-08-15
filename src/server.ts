import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import { initDb } from './db';
import { handleWebhook } from './webhook/meta';
import { dashboardRouter } from './dashboard';
import { logger } from './utils/logger';

// Load command modules
import './commands';

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

async function start() {
  await initDb();

  app.post('/webhook', async (req, res) => {
    try {
      await handleWebhook(req, res);
    } catch (err) {
      logger.error('Webhook error', err);
      res.sendStatus(500);
    }
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', name: 'EMZY AI', version: '0.2.0' });
  });

  // Serve dashboard UI static files
  app.use('/dashboard/app', express.static('src/dashboard/ui'));

  app.use('/dashboard', dashboardRouter);

  app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
}

start().catch(err => {
  logger.error('Startup error', err);
  process.exit(1);
});
