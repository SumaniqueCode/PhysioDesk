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

Backend setup, migrations, seed, and API docs (`/docs`) are documented here as those parts land.

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

Populated by the seed script (added with the backend). Both an Admin and a Staff account are
provided so reviewers can evaluate role enforcement.
