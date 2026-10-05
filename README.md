# C-Quest Portal

One sign-in for C-Quest web apps. Users see a card for each app they're allowed to use; clicking a card opens the app in a new tab and signs them straight in.

Flask + PostgreSQL, vanilla HTML/CSS/JS (same design tokens as C-Quest Outreach). One Docker image runs on Railway now and on Azure later with no code changes.

## Roles

| | Admin | Super user | General user |
|---|:-:|:-:|:-:|
| Open assigned apps | ✓ | ✓ | ✓ |
| Create / edit / disable General users, give app access, reset passwords, unlock | ✓ | ✓ | |
| Manage Admins and Super users, delete users | ✓ | | |
| Usage statistics | ✓ | ✓ | |
| App catalogue, audit log, settings | ✓ | | |

Safeguards: nobody can change their own role or disable themselves; the last active Admin can't be removed.

## What's included

- **Users** — search, filter (role, status, app, never signed in, dormant), sort, bulk actions (give/remove app access, enable, disable, delete), CSV import/export, per-app roles (e.g. Outreach *Administrator* / *Reviewer*), one-time set-password links or temporary passwords, unlock, sign out everywhere, recent activity per user.
- **Security** — scrypt password hashing, account lockout, per-network throttling, server-side sessions (revocable, idle + absolute timeout), CSRF tokens, strict CSP and security headers, optional Microsoft Entra ID sign-in.
- **Usage statistics** — active people, sign-ins, app opens, failed sign-ins with period-on-period change; daily chart; per-app adoption; departments; busiest hours; account health; CSV export.
- **Audit log** — every admin change with before/after values.
- **Privacy (UK GDPR)** — usage records hold user, app, time and a truncated network address only; automatic deletion after the retention period (default 365 days); user deletion anonymises their history.

## Run locally

```bash
pip install -r requirements.txt
export COOKIE_SECURE=false SECRET_KEY=dev BOOTSTRAP_ADMIN_EMAIL=you@c-quest.com BOOTSTRAP_ADMIN_PASSWORD=Change-Me-Now-1
flask --app wsgi run      # http://127.0.0.1:5000  (SQLite file portal.db)
```

## Deploy on Railway

1. Push this folder to a new GitHub repo (e.g. `cquest-portal`).
2. Railway → New project → Deploy from GitHub repo. Add a **PostgreSQL** service to the project.
3. On the portal service set variables (see `.env.example`): `SECRET_KEY`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`, `PUBLIC_BASE_URL`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`.
4. Deploy. Railway builds the Dockerfile and checks `/healthz`.
5. Settings → Networking → add custom domain (e.g. `portal.c-quest.com`) and update `PUBLIC_BASE_URL`.
6. Sign in with the bootstrap account, set your password, then remove `BOOTSTRAP_ADMIN_PASSWORD`.

## Microsoft sign-in (when IT is ready)

Entra admin centre → App registrations → New: single tenant, redirect URI (Web) `https://<portal>/auth/microsoft/callback`. Create a client secret. Set `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`.
Microsoft proves *who* the person is (and enforces MFA/conditional access); the portal still decides *which apps* they get. Only people who already exist in the portal can sign in. Once everyone uses it, turn off password sign-in in Settings.

## Connecting an app

See `docs/APP-INTEGRATION.md` and `examples/portal_sso.py`.

## Moving to Azure

Nothing in the code is Railway-specific — everything is environment variables + one container + PostgreSQL.

1. Create **Azure Database for PostgreSQL – Flexible Server** (UK South), database `portal`.
2. Copy data: `pg_dump "$RAILWAY_DATABASE_URL" -Fc -f portal.dump` → `pg_restore --no-owner -d "$AZURE_DATABASE_URL" portal.dump`. The launch-token signing key lives in the database, so connected apps keep working.
3. Run the same image on **Azure Container Apps** (or App Service for Linux containers): build from the repo or push to Azure Container Registry; target port 8000; health probe `/healthz`.
4. Set the same environment variables (secrets from Key Vault); `DATABASE_URL` ends with `?sslmode=require`.
5. Point `portal.c-quest.com` at Azure; keep `PUBLIC_BASE_URL` the same so connected apps need no change.

## Notes

- Schema is created automatically on first start. Add Alembic migrations when the first schema change is needed.
- Back up the database (Railway backups / Azure automated backups); it holds users, access and the signing key.
