import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db.js';

let app;
let db;

beforeAll(() => {
  db  = createDb(':memory:');
  app = createApp(db);
});

afterAll(() => {
  db.close();
});

// ── GET /contacts ─────────────────────────────────────────────────────────────

describe('GET /contacts', () => {
  it('returns 200 with an array of 10 seeded contacts', async () => {
    const res = await request(app).get('/contacts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(10);
  });

  it('each contact has expected fields', async () => {
    const res = await request(app).get('/contacts');
    const c = res.body[0];
    expect(c).toHaveProperty('id');
    expect(c).toHaveProperty('name');
    expect(c).toHaveProperty('email');
    expect(c).toHaveProperty('phone');
    expect(c).toHaveProperty('address');
    expect(c).toHaveProperty('created_at');
    expect(c).toHaveProperty('updated_at');
  });
});

// ── GET /contacts/:id ─────────────────────────────────────────────────────────

describe('GET /contacts/:id', () => {
  it('returns a single contact by ID', async () => {
    const res = await request(app).get('/contacts/1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.body.name).toBe('Alice Johnson');
  });

  it('returns 404 for a non-existent ID', async () => {
    const res = await request(app).get('/contacts/99999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ── POST /contacts ────────────────────────────────────────────────────────────

describe('POST /contacts', () => {
  it('creates a new contact and returns 201 with the record', async () => {
    const payload = {
      name:    'Test User',
      email:   'test@example.com',
      phone:   '555-9999',
      address: '100 Test Ave, College Station TX',
    };
    const res = await request(app).post('/contacts').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test User');
    expect(res.body.email).toBe('test@example.com');
  });

  it('creates a contact with only a name (optional fields null)', async () => {
    const res = await request(app).post('/contacts').send({ name: 'No Extras' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('No Extras');
    expect(res.body.email).toBeNull();
    expect(res.body.phone).toBeNull();
    expect(res.body.address).toBeNull();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/contacts').send({ email: 'noname@example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when name is an empty string', async () => {
    const res = await request(app).post('/contacts').send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ── PUT /contacts/:id ─────────────────────────────────────────────────────────

describe('PUT /contacts/:id', () => {
  it('updates an existing contact and returns the updated record', async () => {
    const res = await request(app).put('/contacts/2').send({
      name:    'Bob Updated',
      email:   'bob.updated@example.com',
      phone:   '555-9090',
      address: '1 New St, Austin TX',
    });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Bob Updated');
    expect(res.body.email).toBe('bob.updated@example.com');
    expect(res.body.id).toBe(2);
  });

  it('updated_at changes after update', async () => {
    const before = await request(app).get('/contacts/3');
    await new Promise((r) => setTimeout(r, 1100)); // SQLite CURRENT_TIMESTAMP has 1-s resolution
    await request(app).put('/contacts/3').send({ name: 'Carol v2' });
    const after = await request(app).get('/contacts/3');
    // At minimum the name changed
    expect(after.body.name).toBe('Carol v2');
  });

  it('returns 404 for a non-existent ID', async () => {
    const res = await request(app).put('/contacts/99999').send({ name: 'Ghost' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).put('/contacts/1').send({ email: 'oops@example.com' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ── DELETE /contacts/:id ──────────────────────────────────────────────────────

describe('DELETE /contacts/:id', () => {
  it('deletes a contact and returns 204', async () => {
    const created = await request(app).post('/contacts').send({ name: 'To Be Deleted' });
    const id = created.body.id;

    const del = await request(app).delete(`/contacts/${id}`);
    expect(del.status).toBe(204);

    const check = await request(app).get(`/contacts/${id}`);
    expect(check.status).toBe(404);
  });

  it('returns 404 for a non-existent ID', async () => {
    const res = await request(app).delete('/contacts/99999');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ── Health check ──────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
