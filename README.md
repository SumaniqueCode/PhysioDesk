# PhysioDesk

A clinic-management application for a physiotherapy practice: patient records, scheduling,
billing, therapist roster, and a live dashboard — with role-based access control.

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

## Documentation

- [Design system](docs/design-system.md) — colors, typography, layout conventions, components
- [Architecture](docs/architecture.md) — structure and key decisions

## Assumptions

Decisions made where the spec left room:

- **Roles** — Admin has full access. Staff/Receptionist is read-only on Billing and cannot manage
  Therapists. Enforced server-side, not just hidden in the UI.
- **Therapist deletion** — soft delete (`is_active = false`) so history stays intact; blocked while
  the therapist has future booked appointments.
- **Scheduling** — time slots are derived from a therapist's working hours + slot duration (minus
  per-date overrides); double-booking is prevented by a DB unique constraint plus a service check.
  Single clinic-local timezone.
- **Patients** — status is `active`, `completed`, or `on_hold`; session history derives from
  appointments and billing history from invoices.
- **Billing** — invoice status is `paid` or `due`; "void" deletes the invoice record.

## Test Credentials

Created by the seed script:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@physiodesk.com` | `Admin@123` |
| Staff | `staff@physiodesk.com` | `Staff@123` |

Admin has full access; Staff is restricted (read-only Billing, no Therapist management).
