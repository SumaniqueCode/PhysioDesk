# Architecture

## Overview

PhysioDesk is a monorepo with an independently deployable FastAPI backend and Next.js frontend,
sharing a PostgreSQL database. The frontend never talks to the database directly — it consumes the
backend's REST API, which owns all business logic, validation, and authorization.

```
Next.js (App Router)  ──HTTP/JSON──►  FastAPI  ──async SQLAlchemy──►  PostgreSQL
```

## Backend layering

Requests flow through thin, single-responsibility layers:

```
api/v1/routes/*   HTTP surface — request/response, status codes, auth dependencies
      │
services/*        business logic — booking conflicts, aggregation, billing rules
      │
repositories/*    data access — async SQLAlchemy queries
      │
models/*          ORM entities        schemas/*  Pydantic v2 request/response
```

`core/` holds cross-cutting concerns: `config` (settings), `security` (hashing + JWT), `deps`
(current-user, `require_roles`, DB session), `rate_limit`, and `exceptions` (handlers).

## Frontend layering

```
app/*             App Router pages + layouts (AppShell, per-feature routes)
components/ui/*    design-system primitives    components/<feature>/*  feature UI
hooks/*            useDebounce, usePagination, useAuth, per-resource query/mutation hooks
lib/*             apiClient (axios + interceptors), cn, formatters, constants
stores/*          Zustand (auth, ui)           providers/*  Query/Toast/Auth providers
```

Server state uses TanStack Query (caching, loading/error states, pagination). Auth/UI state uses
Zustand. Forms use React Hook Form + Zod. Every list handles loading, error, and empty states.

## Authentication & authorization

- Passwords hashed with Argon2. Login returns a short-lived JWT **access** token (in memory) and a
  rotating **refresh** token (httpOnly cookie). A refresh-token table enables rotation and
  logout-everywhere.
- All routes except login/refresh require a valid access token. Roles (`admin`, `staff`) are
  enforced server-side via `require_roles`; the UI additionally hides/disables disallowed actions,
  but that is cosmetic — the API is the source of truth.
- Axios interceptors attach the access token and transparently refresh it on `401`.

## Data model

Core entities: `users`, `refresh_tokens`, `patients`, `therapists`,
`therapist_schedule_overrides`, `appointments`, `invoices`. Double-booking is prevented at the
database level with a unique constraint on `(therapist_id, date, start_time)` plus a service-layer
check. Time slots are derived from a therapist's working hours and slot duration (minus per-date
overrides) rather than stored as rows.
