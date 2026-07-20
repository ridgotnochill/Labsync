# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173
npm run build    # tsc -b (type-check) then vite build → dist/
npm run preview  # serve the production build locally
```

There is no test runner, linter, or formatter configured. `npm run build` (which runs `tsc -b`) is the only automated check — run it to catch type errors before committing.

## What this actually is

LabSync is a **static, front-end-only UI prototype** of a Mithibai College laboratory management dashboard (inventory, equipment, lab schedule, chemical expiry, damage reports, admin). Despite the domain framing, there is **no backend, no database, and no persisted domain data**. Every page renders hard-coded arrays exported from `src/data.ts`. Pages are essentially read-only; buttons and forms are presentational and do not mutate state.

⚠️ **`README.md` is stale and describes a different, older version of the app** — it references `src/lib/store.ts` with async methods, a PIN-based `AuthContext`, `src/context/`, and daily-usage logging. None of that exists in the current `src/`. Trust the code, not the README, for architecture.

## Architecture

- **Entry & routing** — `src/main.tsx` mounts `App` inside a `HashRouter` (hash routing is required so the site works when served from a GitHub Pages subpath). `src/App.tsx` gates the app behind a trivial auth flag and defines all routes.
- **"Auth"** — a single boolean in `localStorage` under key `labsync.authed`. `src/pages/Login.tsx` just calls `onLogin()`; there are no real credentials. This is the only use of `localStorage`.
- **Layout** — `AppLayout` (`Sidebar` + `Topbar` + scrollable `<main>`) wraps every authenticated route. `Topbar` derives its title from `pathname` via a lookup map, so **adding a route means updating the `TITLES` map in `Topbar.tsx`** (and the nav in `Sidebar.tsx`).
- **Data** — `src/data.ts` is the single source of all content and also defines the domain TypeScript types (`InventoryItem`, `Equipment`, `Chemical`, `Slot`, etc.). To change what any page shows, edit this file.
- **Shared UI primitives** — `src/components/ui.tsx` exports `Badge`, `PageHeader`, `BtnPrimary`, `BtnGhost`, `Tabs`, and tone/category color maps. Reuse these instead of re-styling; pages compose them.

## Styling

- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin — there is **no `tailwind.config.js`**. Theme tokens (`--color-primary-*`, `--color-navy-*`, fonts) live in the `@theme` block of `src/index.css`; runtime CSS variables (`--bg`, `--surface`, `--border`, `--rail-*`, etc.) live in `@layer base`.
- Single light theme only (the README's light/dark claim is stale). Custom utility classes like `muted`, `faint`, and `fade-rise` are defined in `index.css`.
- Color semantics are centralized: status tones in `ui.tsx` (`TONE`, `CATEGORY_TONE`). Prefer extending those maps over hard-coding new color classes.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs `npm ci && npm run build` and publishes `dist/` to GitHub Pages. `vite.config.ts` sets `base: './'` so the built assets resolve under a project subpath — do not change this to an absolute base.

## `legacy/`

`legacy/` holds the original static HTML/CSS/JS prototype, kept for reference only. It is not built, imported, or deployed — ignore it unless explicitly asked.
