import { Hono } from 'hono';

export const contacts = new Hono();

contacts.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM contacts ORDER BY id'
  ).all();
  return c.json(results);
});

contacts.get('/:id', async (c) => {
  const contact = await c.env.DB.prepare(
    'SELECT * FROM contacts WHERE id = ?'
  ).bind(c.req.param('id')).first();
  if (!contact) return c.json({ error: 'Contact not found' }, 404);
  return c.json(contact);
});

contacts.post('/', async (c) => {
  let body = {};
  try { body = await c.req.json(); } catch { /* empty body */ }
  const { name, email, phone, address } = body;
  if (!name?.trim()) return c.json({ error: 'name is required' }, 400);

  const result = await c.env.DB.prepare(
    'INSERT INTO contacts (name, email, phone, address) VALUES (?, ?, ?, ?)'
  ).bind(name.trim(), email ?? null, phone ?? null, address ?? null).run();

  const contact = await c.env.DB.prepare(
    'SELECT * FROM contacts WHERE id = ?'
  ).bind(result.meta.last_row_id).first();
  return c.json(contact, 201);
});

contacts.put('/:id', async (c) => {
  const existing = await c.env.DB.prepare(
    'SELECT id FROM contacts WHERE id = ?'
  ).bind(c.req.param('id')).first();
  if (!existing) return c.json({ error: 'Contact not found' }, 404);

  let body = {};
  try { body = await c.req.json(); } catch { /* empty body */ }
  const { name, email, phone, address } = body;
  if (!name?.trim()) return c.json({ error: 'name is required' }, 400);

  await c.env.DB.prepare(
    `UPDATE contacts
        SET name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
  ).bind(name.trim(), email ?? null, phone ?? null, address ?? null, c.req.param('id')).run();

  const contact = await c.env.DB.prepare(
    'SELECT * FROM contacts WHERE id = ?'
  ).bind(c.req.param('id')).first();
  return c.json(contact);
});

contacts.delete('/:id', async (c) => {
  const existing = await c.env.DB.prepare(
    'SELECT id FROM contacts WHERE id = ?'
  ).bind(c.req.param('id')).first();
  if (!existing) return c.json({ error: 'Contact not found' }, 404);

  await c.env.DB.prepare('DELETE FROM contacts WHERE id = ?')
    .bind(c.req.param('id')).run();
  return c.body(null, 204);
});
