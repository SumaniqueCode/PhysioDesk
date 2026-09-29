# PhysioDesk

A clinic-management application for a physiotherapy practice: patient records, scheduling,
billing, therapist roster, and a live dashboard — with role-based access control.

## Live Demo

**https://physio-desk-sepia.vercel.app**

Sign in with the [test credentials](#test-credentials) below. API docs (Swagger):
[/docs](https://physio-desk-sepia.vercel.app/docs). Health check:
[/api/v1/health](https://physio-desk-sepia.vercel.app/api/v1/health).

## Tech Stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Backend | Python + FastAPI |
| Database | PostgreSQL |
| ORM / Migrations | SQLAlchemy 2.0 (async) + Alembic |
| Auth | JWT access/refresh tokens, Argon2 password hashing, RBAC |

Server state is managed with TanStack Query; local/auth state with Zustand; forms with
React Hook Form + Zod.

## Repository Layout

```
backend/    FastAPI service (API, models, services, migrations, seed)
frontend/   Next.js app (App Router, component library, feature pages)
docs/        Design system and architecture notes
docker-compose.yml   PostgreSQL (and, later, backend + frontend) for local + reviewers
```

## Getting Started

### Quick start (scripts)

With Docker, Python 3.12+, and Node 20+ installed, one command sets everything up
(database, backend install + migrations + seed, frontend install):

```bash
bash scripts/setup.sh        # Windows: ./scripts/setup.ps1
```

Then run both servers together:

```bash
bash scripts/dev.sh          # Windows: ./scripts/dev.ps1
```

Frontend at http://localhost:3000, backend at http://localhost:8000 (Swagger at `/docs`).
The manual steps below do the same thing if you prefer to run them yourself.

### 1. Database

```bash
cp .env.example .env
docker compose up -d db
```

This starts PostgreSQL on the port set by `POSTGRES_PORT` (default `5432`). If you already run
Postgres locally on 5432, change `POSTGRES_PORT` in `.env` (e.g. `5433`) before starting.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:3000. The component library lives at
[http://localhost:3000/design-system](http://localhost:3000/design-system).

### 3. Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1      # macOS/Linux: source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env              # set DATABASE_URL if not using the docker Postgres
alembic upgrade head              # build the schema from scratch
python -m scripts.seed            # create the test users
uvicorn app.main:app --reload
```

API runs at http://localhost:8000. Interactive OpenAPI/Swagger docs:
[http://localhost:8000/docs](http://localhost:8000/docs).

**Database URL:** the default (`postgresql+asyncpg://physiodesk:physiodesk@localhost:5432/physiodesk`)
matches the docker Postgres. To use a local Postgres instead, create a `physiodesk` database and set
`DATABASE_URL` in `backend/.env` to your own credentials.

## Testing

The backend ships with an integration + unit suite (pytest — auth, RBAC, patient, scheduling,
billing, and therapist-roster flows). It runs against a dedicated database so it never touches
development data:

```bash
cd backend
createdb physiodesk_test          # once; or run CREATE DATABASE physiodesk_test; in psql/pgAdmin
pytest -q
```

By default the test database name is derived from `DATABASE_URL` (swapping the name to
`physiodesk_test`); set `TEST_DATABASE_URL` to point elsewhere. CI runs the same suite against a
disposable Postgres service on every push.

## Deployment

The live demo runs as a single Vercel project using
[Vercel Services](https://vercel.com/docs/services), configured in [`vercel.json`](vercel.json):

| Part | Where |
| --- | --- |
| Frontend (Next.js) | Vercel service `frontend`, serves every other path |
| Backend (FastAPI) | Vercel service `backend`, serves `/api/*`, plus `/docs` and `/openapi.json` for Swagger |
| Database (PostgreSQL) | Render |

The frontend and API share one domain, so no CORS setup is needed. Environment variables set in
Vercel:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Render's **External** database URL. `postgres://` URLs are converted to the asyncpg driver automatically |
| `JWT_SECRET` | Random string, at least 32 characters |
| `ENVIRONMENT` | `production` (sends the refresh cookie with the `Secure` flag) |
| `TRUST_PROXY` | `true` (rate limiting reads the client IP from `X-Forwarded-For`) |
| `NEXT_PUBLIC_API_URL` | `/api/v1` |

Migrations and the seed script are run against the Render database from a local machine, with
`DATABASE_URL` pointing at it (`alembic upgrade head`, then `python -m scripts.seed`).

## Documentation

- [Design system](docs/design-system.md) — colors, typography, layout conventions, components
- [Architecture](docs/architecture.md) — structure and key decisions

## Assumptions

Decisions made where the spec left room:

- **Roles** — Admin has full access. Staff/Receptionist is read-only on Billing and cannot manage
  Therapists. Enforced server-side, not just hidden in the UI.
- **Therapist deletion** — soft delete (`is_active = false`) rather than a hard delete, so existing
  appointments and invoices stay intact and attributable. A deactivated therapist drops off the
  roster and scheduling grid (no new bookings) but their past and future appointments are preserved;
  a patient's assignment to a removed therapist is kept and simply flagged inactive.
- **Scheduling** — time slots are derived from a therapist's working hours + slot duration (minus
  per-date overrides); double-booking is prevented by a DB unique constraint plus a service check.
  Single clinic-local timezone.
- **Patients** — status is `active`, `completed`, or `on_hold`; `gender` is one of
  male/female/other (optional), and `package` is a treatment plan chosen from a fixed list. The
  spec's "condition" is captured as free-text medical notes. Session history derives from
  appointments and billing history from invoices.
- **Billing** — invoice status is `paid` or `due`; "void" deletes the invoice record. Amounts are
  USD, stored as `Decimal` and serialized as JSON strings to avoid floating-point drift.
- **Dashboard** — "today" is computed server-side in UTC so it matches how payments are timestamped;
  stats and the therapist-capacity view are live-computed, never hardcoded. "Recent patients" shows
  the last 8 added.

## Test Credentials

Created by the seed script:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@physiodesk.com` | `Admin@123` |
| Staff | `staff@physiodesk.com` | `Staff@123` |

Admin has full access; Staff is restricted (read-only Billing, no Therapist management). Both
credentials are also shown on the login screen for convenience.

## What I'd Do Differently / With More Time

- **Printable/exportable invoices** — the billing bonus; a dedicated print view per invoice.
- **Refresh-token rotation & logout-everywhere** — currently a single refresh token per session.
- **Configurable timezone** — "today" is UTC clinic-wide; a real deployment would store the clinic's
  timezone and compute day windows against it.
- **Richer scheduling** — drag-to-reschedule on the grid and a conflict warning *before* submit,
  rather than relying on the server's 409.
- **Frontend tests** — the suite is backend-only right now; component/interaction tests (Vitest +
  Testing Library) would cover the forms and RBAC gating.
- **Full Dockerization** — `docker-compose` runs Postgres today; adding the backend and frontend
  services would make `docker compose up` a one-command review environment.
