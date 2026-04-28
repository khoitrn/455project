# Trivy Security Scan Report

**Project:** Contacts Book API — ISTM 455  
**Repo:** https://github.com/khoitrn/455project  
**Tool:** [Trivy](https://github.com/aquasecurity/trivy) v0.70.0  
**Scan Date:** 2026-04-28  
**Scanned By:** Khoi Tran  

---

## What is Trivy?

Trivy is an open-source vulnerability and misconfiguration scanner by Aqua Security. It can scan:
- **Container images** — OS packages and application dependencies
- **Filesystems** — source code, dependency manifests, and secrets
- **IaC configs** — Dockerfiles, Kubernetes manifests, Terraform files
- **Git repositories** — directly from a remote URL

It is widely used in CI/CD pipelines to catch security issues before they reach production.

---

## Scan 1 — Filesystem (`trivy fs .`)

Scans `package-lock.json` for known CVEs and all files for exposed secrets.

```
trivy fs .
```

### Results

| Target | Type | Vulnerabilities | Secrets |
|--------|------|----------------|---------|
| `package-lock.json` | npm | 0 | — |
| `server.pem` | text | — | 1 (HIGH) |

### Finding: Private Key Exposed — HIGH

**Rule:** `AsymmetricPrivateKey`  
**File:** `server.pem` (lines 2–27)  
**Description:**  
Trivy detected a plaintext RSA private key stored in `server.pem`. Private keys must never be stored in a repository or committed to version control. If a private key is exposed, an attacker can impersonate the server, decrypt TLS traffic, or sign fraudulent certificates.

**Root cause:**  
`server.pem` was generated locally for HTTPS testing but was present on disk during the scan. It was correctly listed in `.gitignore` so it was never committed to the repository.

**AI-assisted fix:**  
The file was deleted from the local filesystem since the project now uses Cloudflare Workers, which handles TLS at the edge — no local certificate is needed.

```bash
rm server.pem
```

**Verification:**  
Re-running `trivy fs .` after deletion shows 0 secrets detected.

---

## Scan 2 — IaC Configuration (`trivy config .`)

Scans `Dockerfile` and `docker-compose.yml` for security misconfigurations.

```
trivy config .
```

### Results

| Target | Type | Misconfigurations |
|--------|------|------------------|
| `Dockerfile` | dockerfile | 2 |

### Finding 1: Container Runs as Root — HIGH

**Rule:** `DS-0002`  
**File:** `Dockerfile`  
**Description:**  
The Dockerfile had no `USER` instruction, so the container process ran as `root` by default. Running as root inside a container is dangerous because a container escape vulnerability would give an attacker full root access to the host machine. This violates the principle of least privilege.

**AI-assisted fix:**  
Added a `USER node` instruction (the `node:alpine` base image ships with a built-in non-root `node` user) and set correct ownership of the `/app` directory:

```dockerfile
# Before (missing)
# no USER instruction

# After
RUN chown -R node:node /app
USER node
```

### Finding 2: No HEALTHCHECK Instruction — LOW

**Rule:** `DS-0026`  
**File:** `Dockerfile`  
**Description:**  
Without a `HEALTHCHECK`, Docker has no way to detect if the running container is unhealthy (e.g., the server crashed or stopped responding). This means Docker and orchestration tools like Kubernetes or Docker Swarm cannot automatically restart or replace a failed container.

**AI-assisted fix:**  
Added a `HEALTHCHECK` instruction that polls the `/health` endpoint every 30 seconds:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3443/health || exit 1
```

---

## Before vs After

| Finding | Severity | Status |
|---------|----------|--------|
| Private key in `server.pem` | 🔴 HIGH | ✅ Fixed — deleted file |
| Container running as root | 🔴 HIGH | ✅ Fixed — added `USER node` |
| Missing HEALTHCHECK | 🟡 LOW | ✅ Fixed — added `HEALTHCHECK` |
| npm dependencies | ✅ CLEAN | No action needed |

---

## Observations

1. **Dependency hygiene is good** — The project has zero CVEs in its npm dependency chain. This is largely because the migration from Express + better-sqlite3 to Hono + Cloudflare D1 drastically reduced the number of third-party packages.

2. **Secrets on disk are a real risk** — Even a self-signed certificate's private key should be treated as sensitive. Trivy catching this reinforces the importance of `.gitignore` and secret scanning in CI/CD.

3. **Docker hardening is often overlooked** — Running containers as root is one of the most common Docker security mistakes. Adding `USER node` is a one-line fix with significant security impact.

4. **Automated scanning catches what code review misses** — Both Dockerfile issues were subtle and easy to overlook in a manual review. Integrating Trivy into the GitHub Actions CI pipeline (see `.github/workflows/trivy.yml`) ensures every future push is automatically scanned.

---

## CI/CD Integration

This repository runs Trivy automatically on every push to `main` via GitHub Actions. Results appear in the **Security → Code Scanning** tab of the repository.

See: [`.github/workflows/trivy.yml`](.github/workflows/trivy.yml)
