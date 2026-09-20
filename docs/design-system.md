# Design System

The visual language is fixed. Do not substitute the palette, fonts, or layout conventions.
Every color is exposed as a CSS variable and mapped into the Tailwind theme — never hardcode a hex.

## Color Palette

### Structural roles — buttons, nav, surfaces, backgrounds

| Token | Hex | Usage |
| --- | --- | --- |
| `primary` | `#B8763A` | Primary buttons, active nav item, key CTAs |
| `primary-on-soft` | `#5C3A17` | Text placed on primary-soft backgrounds |
| `primary-soft` | `#F0DFC7` | Tinted backgrounds / badges using the primary color |
| `secondary` | `#132420` | Sidebar background; secondary dark surface |
| `secondary-light` | `#1D362F` | Sidebar hover / active surface on dark |
| `tertiary` | `#4F7C63` | Tertiary accent (also the Success color) |
| `tertiary-soft` | `#E1EBE3` | Tertiary / success tag background |
| `background` | `#F6F3EA` | App / page background |
| `surface` | `#FFFFFF` | Card and panel background |
| `border` | `#E4DFD1` | Card borders, input borders, dividers |
| `text` | `#1C2622` | Main body text, headings |
| `text-muted` | `#797365` | Supporting / secondary text, captions |

### Status roles — status tags/badges ONLY (never structural UI)

| Token | Hex | Soft | Usage |
| --- | --- | --- | --- |
| `success` | `#4F7C63` | `#E1EBE3` | Paid, active, booked / positive |
| `danger` | `#B5493B` | `#F3DEDA` | Overdue, cancelled, destructive |
| `neutral` | `#5E6B78` | `#E7EBEE` | Pending, on-hold, informational |

> Rule: use structural roles for buttons/nav/backgrounds and Status roles only for
> status pills/badges. Do not mix the two systems.

## Typography

Loaded via `next/font/google`. Three families, each with one purpose.

| Family | Role | Where |
| --- | --- | --- |
| **Fraunces** (serif) | Display / headings | Page titles, card values, section headings |
| **Inter** (sans) | Body / UI | All body text, labels, buttons, table content |
| **IBM Plex Mono** | Numeric / data | Stat numbers, invoice amounts, time slots, IDs |

## Layout Conventions

- Persistent left **sidebar** (dark, `secondary` background) with the app logo/name at top and nav
  items: Dashboard, Patients, Schedule, Billing, Therapists. The active item is highlighted in
  `primary`; hover uses `secondary-light`.
- Main content area on the `background` color, with a **top bar** showing the page title plus the
  page's primary action button(s).
- Content lives in `surface` (white) **cards/panels** with rounded corners (~14px), a subtle
  `border`, and a soft drop shadow — not flat, borderless sections.
- **Dashboard stat cards** show key metrics with Fraunces numerals.
- **Status pills** are small rounded-pill badges color-coded with the Status roles.
- **Tables** for list views, with a toolbar above containing search + filter dropdowns.
- **Modals** (centered overlay dialogs) for Add/Edit forms — not full-page forms.

## Component Inventory (built once, reused everywhere)

Primitives: `Button`, `IconButton`, `StatusPill`, `Card`, `StatCard`, `Input`, `Select`,
`Textarea`, `Checkbox`, `Radio`, `Modal`, `ConfirmDialog`, `Toast`, `Table` (+ toolbar),
`Pagination`, `Spinner`, `Skeleton` (row/card/table), `Breadcrumb`, `EmptyState`.

Layout: `Sidebar`, `Topbar`, `AppShell`.

A live gallery of every component renders at `/design-system`.
