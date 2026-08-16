# Nexora — RDS/EC2 database-ready deployment

This package keeps the existing Nexora `index (15).html` UI and adds a Node/Express API backed by PostgreSQL/RDS.

## What changed
- Employee login is server-side and uses bcrypt hashes; PINs are no longer stored in browser localStorage.
- HTTP-only session cookie is used for portal authentication.
- Contact, career, and support submissions are stored in PostgreSQL.
- Existing employee portal state (requests, announcements, attendance, daily logs, tasks, inventory, BOM) is persisted in PostgreSQL JSONB so the current UI can keep its existing rendering logic while data survives browsers/devices.
- RDS credentials are server-side only via `DATABASE_URL`.
- Helmet and API rate limiting are enabled.

## Deploy on the existing EC2

1. Copy this project to EC2, e.g. `/home/ec2-user/nexora`.
2. Create `.env` from `.env.example` and set a real `DATABASE_URL` and `SESSION_SECRET`.
3. Install dependencies:

```bash
npm install
```

4. Initialize schema and seed the existing employees:

```bash
node db/seed.js
```

5. Start:

```bash
npm start
```

6. Test locally on EC2:

```bash
curl http://127.0.0.1:3000/api/health
```

Expected database result:

```json
{"ok":true,"service":"nexora","database":"connected"}
```

## Initial employee PINs

For the first login only, each employee's default PIN is the last 4 digits of the registered phone number from the existing Nexora source data. The database stores a bcrypt hash, not the PIN. After login, use Profile → Update PIN to change it.

## Important production note

Use `COOKIE_SECURE=true` once the site is served over HTTPS. Do not put the RDS password into frontend HTML or JavaScript. Do not commit `.env` to Git.
