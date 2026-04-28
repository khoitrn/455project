import { describe, it, expect, beforeEach } from 'vitest';
import app from '../src/index.js';
import { createMockD1, seedDb } from './d1-mock.js';

// Each test gets a fresh seeded DB so tests are fully independent.
let env;

beforeEach(async () => {
  const DB = createMockD1();
  await seedDb(DB);
  env = { DB };
});

const req = (path, init = {}) => app.request(path, init, env);
const json = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// ── GET /contacts ─────────────────────────────────────────────────────────────

describe('GET /contacts', () => {
  it('returns 200 with all 10 seeded contacts', async () => {
    const res = await req('/contacts');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(10);
  });

  it('each contact has the expected fields', async () => {
    const res = await req('/contacts');
    const [c] = await res.json();
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
    const res = await req('/contacts/1');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(1);
    expect(data.name).toBe('Alice Johnson');
  });

  it('returns 404 for a non-existent ID', async () => {
    const res = await req('/contacts/99999');
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

// ── POST /contacts ────────────────────────────────────────────────────────────

describe('POST /contacts', () => {
  it('creates a contact and returns 201 with the record', async () => {
    const res = await req('/contacts', {
      ...json({ name: 'Test User', email: 'test@example.com', phone: '555-9999', address: '1 Test Ave' }),
      method: 'POST',
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('Test User');
    expect(data.email).toBe('test@example.com');
  });

  it('creates a contact with name only (optional fields null)', async () => {
    const res = await req('/contacts', { ...json({ name: 'No Extras' }), method: 'POST' });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('No Extras');
    expect(data.email).toBeNull();
    expect(data.phone).toBeNull();
    expect(data.address).toBeNull();
  });

  it('returns 400 when name is missing', async () => {
    const res = await req('/contacts', { ...json({ email: 'noname@example.com' }), method: 'POST' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('returns 400 when name is blank whitespace', async () => {
    const res = await req('/contacts', { ...json({ name: '   ' }), method: 'POST' });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

// ── PUT /contacts/:id ─────────────────────────────────────────────────────────

describe('PUT /contacts/:id', () => {
  it('updates a contact and returns the updated record', async () => {
    const res = await req('/contacts/2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob Updated', email: 'bob.new@example.com' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(2);
    expect(data.name).toBe('Bob Updated');
    expect(data.email).toBe('bob.new@example.com');
  });

  it('returns 404 for a non-existent ID', async () => {
    const res = await req('/contacts/99999', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ghost' }),
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('returns 400 when name is missing', async () => {
    const res = await req('/contacts/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'oops@example.com' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

// ── DELETE /contacts/:id ──────────────────────────────────────────────────────

describe('DELETE /contacts/:id', () => {
  it('deletes a contact and returns 204', async () => {
    const created = await (await req('/contacts', { ...json({ name: 'To Delete' }), method: 'POST' })).json();
    const del = await req(`/contacts/${created.id}`, { method: 'DELETE' });
    expect(del.status).toBe(204);

    const check = await req(`/contacts/${created.id}`);
    expect(check.status).toBe(404);
  });

  it('returns 404 for a non-existent ID', async () => {
    const res = await req('/contacts/99999', { method: 'DELETE' });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });
});

// ── GET /health ───────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const res = await req('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
