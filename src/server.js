import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PORT     = process.env.PORT     || 3443;
const DB_PATH  = process.env.DB_PATH  || path.join(ROOT, 'contacts.db');
const CERT_PATH = process.env.CERT_PATH || path.join(ROOT, 'server.pem');

const db  = createDb(DB_PATH);
const app = createApp(db);

let server;
if (fs.existsSync(CERT_PATH)) {
  const pem = fs.readFileSync(CERT_PATH);
  server = https.createServer({ key: pem, cert: pem }, app);
  server.listen(PORT, () =>
    console.log(`HTTPS server listening on https://localhost:${PORT}`)
  );
} else {
  console.warn('[warn] server.pem not found — falling back to HTTP');
  server = http.createServer(app);
  server.listen(PORT, () =>
    console.log(`HTTP server listening on http://localhost:${PORT}`)
  );
}

export default server;
