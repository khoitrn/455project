import express from 'express';
import { createContactsRouter } from './routes/contacts.js';

export function createApp(db) {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/contacts', createContactsRouter(db));

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
}
