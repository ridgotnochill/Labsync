# LabSync — University Lab Inventory & Usage Tracker

A lightweight web app for keeping track of lab instruments and consumables across
university departments. Staff log in each day, record what was used, and the app
tracks stock levels, average daily usage, low-stock alerts, and instrument
condition/maintenance.

No build step, no npm, no database — it runs as plain static files in the browser.

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

## Running

Because it uses ES modules, it must be served over HTTP (not opened as `file://`).

```bash
cd Labsync
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static file server works.

## Demo account

On first load, sample data and a demo user are seeded automatically:

- **Username:** `demo`
- **PIN:** `1234`

Create your own account from the "Create account" tab. To wipe all data, clear the
site's local storage in your browser (or run `store.resetAll()` from the console).

## Data & moving to a shared backend

All data currently lives in the browser's `localStorage`, so it is **per-computer /
per-browser**. This is fine for a single machine at a lab bench, but not shared
across users.

The app was built so this is an easy upgrade: **all data access goes through
[`js/store.js`](js/store.js)**, and every method is already `async`. To make it a
real multi-user system shared across computers, reimplement only the method bodies
in `store.js` to call a backend API (e.g. `fetch('/api/items')`) — the rest of the
UI (`app.js`) needs no changes. A minimal backend would expose CRUD endpoints for
`users`, `items`, and `usage`, plus a session/login endpoint.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell — auth screen, top nav, view + modal hosts. |
| `style.css` | All styling (dark theme, responsive). |
| `js/store.js` | Data layer — the one file to swap for a real backend. |
| `js/app.js` | UI, routing, and view rendering. |
| `js/seed.js` | One-time sample data on first run (safe to delete). |
