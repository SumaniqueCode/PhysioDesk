# PhysioDesk — Frontend

Next.js (App Router) + TypeScript client for the PhysioDesk clinic-management app.
See the repository root `README.md` for full setup, environment, and run instructions.

## Stack

- Next.js App Router, React, TypeScript
- Tailwind CSS with CSS-variable design tokens (`src/app/globals.css`)
- Fonts: Fraunces (headings), Inter (body), IBM Plex Mono (numbers)

## Develop

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000. The live component library is at `/design-system`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
