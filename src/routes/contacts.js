import { Router } from 'express';

export function createContactsRouter(db) {
  const router = Router();

  // GET /contacts
  router.get('/', (_req, res) => {
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY id').all();
    res.json(contacts);
  });

  // GET /contacts/:id
  router.get('/:id', (req, res) => {
    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    res.json(contact);
  });

  // POST /contacts
  router.post('/', (req, res) => {
    const { name, email, phone, address } = req.body ?? {};
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    const result = db.prepare(
      'INSERT INTO contacts (name, email, phone, address) VALUES (?, ?, ?, ?)'
    ).run(name.trim(), email ?? null, phone ?? null, address ?? null);

    const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contact);
  });

  // PUT /contacts/:id
  router.put('/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM contacts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Contact not found' });

    const { name, email, phone, address } = req.body ?? {};
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    db.prepare(
      `UPDATE contacts
          SET name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
    ).run(name.trim(), email ?? null, phone ?? null, address ?? null, req.params.id);

    res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id));
  });

  // DELETE /contacts/:id
  router.delete('/:id', (req, res) => {
    const existing = db.prepare('SELECT id FROM contacts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Contact not found' });

    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    res.status(204).end();
  });

  return router;
}
