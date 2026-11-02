# LabPilot — University Laboratory Management System

A web app for keeping track of lab instruments and consumables across university
departments. Staff log in each day, record what was used, and the app tracks
stock levels, average daily usage, low-stock alerts, and instrument
condition/maintenance.

Built as a proper **React + TypeScript + Vite + Tailwind CSS v4** single-page
app, with a polished, responsive, light/dark UI.

## Features

- **Daily login** with username + PIN, and a per-user check-in streak.
- **Inventory** of instruments with: name, department, category, location
  (lab/room/shelf), responsible person, stock + unit, low-stock threshold,
  condition (working / under-repair / broken), and last service/calibration date.
- **Log usage** — enter what was used today per item; stock auto-decrements and
  average daily usage is computed. Re-logging the same day is safe (it corrects,
  not double-counts).
- **Dashboard** — totals, low-stock list with estimated days remaining, items
  needing attention, and a usage overview sorted by which runs out soonest.
- **Restock / correct** stock directly from an item card.
- **Search** across name, department, location, and category.
- **Light / dark theme** with system preference detection.

## Running

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

## Demo account

On first load, sample data and a demo user are seeded automatically:

- **Username:** `demo`
- **PIN:** `1234`

Create your own account from the "Create account" tab. To wipe all data, clear
the site's local storage in your browser (or run
`localStorage.clear()` from the console).

## Data & moving to a shared backend

All data currently lives in the browser's `localStorage`, so it is **per-computer /
per-browser**. This is fine for a single machine at a lab bench, but not shared
across users.

The app was built so this is an easy upgrade: **all data access goes through
[`src/lib/store.ts`](src/lib/store.ts)**, and every method is already `async`. To
make it a real multi-user system shared across computers, reimplement only the
method bodies in `store.ts` to call a backend API (e.g. `fetch('/api/items')`) —
the rest of the UI needs no changes. A minimal backend would expose CRUD
endpoints for `users`, `items`, and `usage`, plus a session/login endpoint.

## Project layout

| Path | Purpose |
|------|---------|
| `index.html` | Vite entry point. |
| `src/main.tsx` | App bootstrap (router + auth provider). |
| `src/App.tsx` | Route definitions and auth gate. |
| `src/lib/store.ts` | Data layer — the one file to swap for a real backend. |
| `src/lib/seed.ts` | One-time sample data on first run. |
| `src/lib/types.ts` | Shared domain types. |
| `src/context/AuthContext.tsx` | Auth/session state. |
| `src/components/` | Layout, UI primitives, modals. |
| `src/pages/` | Auth, Dashboard, Inventory, Log usage. |
| `legacy/` | The original static HTML/CSS/JS prototype (kept for reference). |
