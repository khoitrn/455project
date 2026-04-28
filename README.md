# Contacts Book API — CSCE 455

A minimal REST API for managing contacts, built with Node.js, Express, and SQLite. Served over HTTPS with a self-signed certificate.

---

## Tech Stack

| Layer       | Technology              |
|-------------|-------------------------|
| Runtime     | Node.js 20 (ESM)        |
| Framework   | Express 4               |
| Database    | SQLite via better-sqlite3 |
| Testing     | Vitest + Supertest      |
| Container   | Docker + Docker Compose |
| TLS         | Self-signed (OpenSSL)   |

---

## Project Structure

```
455project/
├── src/
│   ├── server.js          # HTTPS/HTTP entry point
│   ├── app.js             # Express app factory
│   ├── db.js              # SQLite setup + seeding
│   └── routes/
│       └── contacts.js    # CRUD route handlers
├── tests/
│   └── contacts.test.js   # Vitest test suite
├── Dockerfile
├── docker-compose.yml
├── vitest.config.js
└── package.json
```

---

## Setup

### Prerequisites

- Node.js 20+
- npm 9+
- OpenSSL (for TLS certificate)
- Docker & Docker Compose (optional)

### Install

```bash
git clone https://github.com/khoitrn/455project.git
cd 455project
npm install
```

### Generate `server.pem` (HTTPS certificate)

```bash
openssl req -x509 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem \
  -days 365 -nodes \
  -subj "/CN=455project.khoitrn.com"

cat key.pem cert.pem > server.pem
rm key.pem cert.pem
```

> Without `server.pem` the server falls back to HTTP automatically.

---

## npm Commands

| Command              | Description                          |
|----------------------|--------------------------------------|
| `npm start`          | Start the server (HTTPS on port 3443)|
| `npm test`           | Run Vitest tests once                |
| `npm run test:watch` | Run Vitest in watch mode             |
| `npm run build`      | Install production dependencies      |
| `npm run docker:up`  | Build image and start container      |
| `npm run docker:down`| Stop and remove container            |
| `npm run docker:logs`| Tail container logs                  |

---

## Running Locally

```bash
npm start
# HTTPS server listening on https://localhost:3443
```

---

## Docker

The Docker image automatically generates a self-signed certificate at build time.

```bash
# Build and start
npm run docker:up

# View logs
npm run docker:logs

# Stop
npm run docker:down
```

The SQLite database is persisted in a named Docker volume (`db-data`).

---

## API Endpoints

Base URL: `https://localhost:3443` (or `https://455project.khoitrn.com`)

### Health Check

| Method | Path      | Description |
|--------|-----------|-------------|
| GET    | `/health` | Service health |

```bash
curl -k https://localhost:3443/health
# {"status":"ok"}
```

### Contacts

| Method | Path             | Description           |
|--------|------------------|-----------------------|
| GET    | `/contacts`      | List all contacts     |
| GET    | `/contacts/:id`  | Get one contact       |
| POST   | `/contacts`      | Create a contact      |
| PUT    | `/contacts/:id`  | Update a contact      |
| DELETE | `/contacts/:id`  | Delete a contact      |

#### Request body (POST / PUT)

```json
{
  "name":    "Jane Doe",
  "email":   "jane@example.com",
  "phone":   "555-1234",
  "address": "1 Main St, College Station TX"
}
```

`name` is required. All other fields are optional.

#### Examples

```bash
# List all
curl -k https://localhost:3443/contacts

# Get one
curl -k https://localhost:3443/contacts/1

# Create
curl -k -X POST https://localhost:3443/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","phone":"555-1234"}'

# Update
curl -k -X PUT https://localhost:3443/contacts/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Smith","email":"jane.smith@example.com"}'

# Delete
curl -k -X DELETE https://localhost:3443/contacts/1
```

#### Response shape

```json
{
  "id":         1,
  "name":       "Alice Johnson",
  "email":      "alice@example.com",
  "phone":      "555-0101",
  "address":    "123 Maple St, Austin TX",
  "created_at": "2024-01-01 00:00:00",
  "updated_at": "2024-01-01 00:00:00"
}
```

---

## Testing

```bash
npm test
```

The test suite uses an in-memory SQLite database (no side effects on your local `contacts.db`).

### Coverage

| Suite                | Tests |
|----------------------|-------|
| GET /contacts        | 2     |
| GET /contacts/:id    | 2     |
| POST /contacts       | 4     |
| PUT /contacts/:id    | 4     |
| DELETE /contacts/:id | 2     |
| GET /health          | 1     |
| **Total**            | **15**|

---

## Cloudflare Subdomain

To point `455project.khoitrn.com` at your server:

1. Go to **Cloudflare Dashboard → khoitrn.com → DNS**.
2. Add an **A record**:
   - Name: `455project`
   - IPv4: `<your server IP>`
   - Proxy: **Proxied** (orange cloud) — Cloudflare handles TLS for you.
3. If running on a non-standard port, use a **Cloudflare Tunnel** or configure a **Page Rule** / **Origin Rule** to forward to `https://<ip>:3443`.

> With Cloudflare proxying, the self-signed cert on the origin is trusted by Cloudflare internally; visitors see a valid Cloudflare-issued cert.
