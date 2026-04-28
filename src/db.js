import { DatabaseSync } from './sqlite-shim.js';

const SEED_CONTACTS = [
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

export function createDb(dbPath = ':memory:') {
  const db = new DatabaseSync(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT,
      phone      TEXT,
      address    TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { count } = db.prepare('SELECT COUNT(*) AS count FROM contacts').get();
  if (count === 0) {
    const stmt = db.prepare(
      'INSERT INTO contacts (name, email, phone, address) VALUES (?, ?, ?, ?)'
    );
    db.exec('BEGIN');
    for (const c of SEED_CONTACTS) stmt.run(c.name, c.email, c.phone, c.address);
    db.exec('COMMIT');
  }

  return db;
}
