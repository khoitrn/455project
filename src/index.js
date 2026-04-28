import { Hono } from 'hono';
import { contacts } from './routes/contacts.js';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/contacts', contacts);
app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;
