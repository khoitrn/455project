// D1-compatible in-memory database for Vitest.
// Wraps node:sqlite (via the shim) with D1's async PreparedStatement API
// so the same route handlers work in tests without a real Cloudflare runtime.
import { DatabaseSync } from '../src/sqlite-shim.js';

export function createMockD1() {
  const db = new DatabaseSync(':memory:');

  function makeStatement(sql, initialParams = []) {
    let boundParams = [...initialParams];

    const stmt = {
      bind(...params) {
        return makeStatement(sql, params);
      },
      async run() {
        const s = db.prepare(sql);
        const result = s.run(...boundParams);
        return {
          success: true,
          meta: { last_row_id: result.lastInsertRowid, changes: result.changes },
        };
      },
      async first() {
        const s = db.prepare(sql);
        return s.get(...boundParams) ?? null;
      },
      async all() {
        const s = db.prepare(sql);
        return { results: s.all(...boundParams), success: true };
      },
    };

    return stmt;
  }

  return {
    prepare(sql) {
      return makeStatement(sql);
    },
    async exec(sql) {
      db.exec(sql);
      return { count: 1, duration: 0 };
    },
    async batch(statements) {
      return Promise.all(statements.map((s) => s.run()));
    },
  };
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS contacts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT,
    phone      TEXT,
    address    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

const SEED = [
  { name: 'Alice Johnson',  email: 'alice@example.com',  phone: '555-0101', address: '123 Maple St, Austin TX' },
  { name: 'Bob Smith',      email: 'bob@example.com',    phone: '555-0102', address: '456 Oak Ave, Dallas TX' },
  { name: 'Carol Williams', email: 'carol@example.com',  phone: '555-0103', address: '789 Pine Rd, Houston TX' },
  { name: 'David Brown',    email: 'david@example.com',  phone: '555-0104', address: '321 Elm St, San Antonio TX' },
  { name: 'Emma Davis',     email: 'emma@example.com',   phone: '555-0105', address: '654 Cedar Blvd, Plano TX' },
  { name: 'Frank Miller',   email: 'frank@example.com',  phone: '555-0106', address: '987 Birch Ln, Irving TX' },
  { name: 'Grace Wilson',   email: 'grace@example.com',  phone: '555-0107', address: '147 Walnut Dr, Garland TX' },
  { name: 'Henry Moore',    email: 'henry@example.com',  phone: '555-0108', address: '258 Spruce Ct, Lubbock TX' },
  { name: 'Iris Taylor',    email: 'iris@example.com',   phone: '555-0109', address: '369 Willow Way, Amarillo TX' },
  { name: 'Jack Anderson',  email: 'jack@example.com',   phone: '555-0110', address: '741 Ash Pl, College Station TX' },
];

export async function seedDb(mockDb) {
  await mockDb.exec(SCHEMA);
  const stmt = mockDb.prepare(
    'INSERT INTO contacts (name, email, phone, address) VALUES (?, ?, ?, ?)'
  );
  for (const c of SEED) {
    await stmt.bind(c.name, c.email, c.phone, c.address).run();
  }
}
