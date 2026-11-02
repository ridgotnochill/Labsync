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

LabPilot is a **static, front-end-only UI prototype** of a laboratory management dashboard (inventory, equipment, lab schedule, chemical expiry, damage reports, admin). Most pages render hard-coded arrays exported from `src/data.ts` and are read-only; buttons and forms there are presentational. The exception is **Inventory and Equipment**, which read live data from `src/lib/labStore.tsx` and can be changed through the file-upload flow (see below). It was previously called LabSync: an inline script in `index.html` moves old `labsync.*` `localStorage` keys to `labpilot.*`, and `labStore.tsx` still deletes the old `labsync.data` key.

⚠️ **`README.md` is stale and describes a different, older version of the app** — it references `src/lib/store.ts` with async methods, a PIN-based `AuthContext`, `src/context/`, and daily-usage logging. None of that exists in the current `src/`. Trust the code, not the README, for architecture.

## Architecture

- **Entry & routing** — `src/main.tsx` mounts `App` inside a `HashRouter` (hash routing is required so the site works when served from a GitHub Pages subpath). `src/App.tsx` gates the app behind a trivial auth flag and defines all routes.
- **"Auth"** — a single boolean in `localStorage` under key `labpilot.authed`. `src/pages/Login.tsx` just calls `onLogin()`; there are no real credentials.
- **Theme** — `src/theme.ts` (`useTheme`) toggles `data-theme="light|dark"` on `<html>` and persists it in `localStorage` under `labpilot.theme` (falls back to the OS preference). An inline script in `index.html` applies it before first paint. The toggle lives in `Topbar.tsx`. Together with `labpilot.data.v2` (local fallback store) these are the only uses of `localStorage`.
- **Layout** — `AppLayout` (`Sidebar` + `Topbar` + scrollable `<main>`) wraps every authenticated route. `Topbar` derives its title from `pathname` via a lookup map, so **adding a route means updating the `TITLES` map in `Topbar.tsx`** (and the nav in `Sidebar.tsx`).
- **Data** — `src/data.ts` holds the static content for the non-inventory pages (schedule, damage reports, notifications, admin, profile) and defines the domain TypeScript types. Its `inventory` / `equipment` arrays are intentionally **empty**: all inventory and equipment comes from uploads. Low Stock Alerts, Chemical Expiry, the Dashboard numbers and the sidebar Low Stock badge are derived from live data via `src/lib/summary.ts` (`summarize`).
- **Live data store** — `src/lib/labStore.tsx` (`LabDataProvider`, wrapped around the authed app in `App.tsx`, and `useLabData()`) holds inventory + equipment. If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are set (`.env.local`, see `.env.example`; GitHub Actions secrets for deploys) it reads/writes Supabase tables defined in `supabase/schema.sql`; otherwise it starts empty and persists to `localStorage` under `labpilot.data.v2` (the old `labsync.data` key held sample data and is deleted on load). It also keeps an upload log (`uploads`, shown on the Dashboard) and `clearAll()` (Settings → Data & Backup → Clear all data). Supabase columns are snake_case — map them in `toEquipment`/`fromEquipment`/`fromInventory`.
- **Upload flow** — `src/components/UploadModal.tsx` (`UploadButton` for page headers, default-exported `UploadModal`) → `src/lib/parseUpload.ts` reads .xlsx/.xls/.csv (SheetJS), PDFs (pdf.js) and photos/scans (OCR via tesseract.js; HEIC converted with heic-to) — all lazy-loaded, maps headers via the `SYNONYMS` table, sorts rows into inventory vs equipment (a serial number or equipment status ⇒ equipment), matches existing records by name/serial, and shows an editable review before `applyUpload` saves. Header rows are found by *exact* synonym matches (loose matching would also hit data rows), then columns are assigned by best score; quantity-like columns that aren't current stock (`NOT_STOCK`: required, rate, amount…) are excluded. It is tuned for the department's real requirement sheets: title rows above the header, multi-line headers like "Store Stock as on 01/04/2026", stock written as pack sizes (`25gm`, `2x2.5ltr`, `Nil` = 0, read against the Packing column), one category per tab, and "S.N." being a row number, not a serial. PDFs without a text layer are rendered and OCR'd. OCR specifics (all learned from testing, keep them): sparse-text mode (`PSM.SPARSE_TEXT`) because grid lines make the default layout skip cells; no canvas upscaling of small images (it hurt accuracy); confidence alone is not used to drop words (border-adjacent words score 0 but read correctly); `ocrPageWords` levels tilted photos by fitting baseline slope vs. height; the header block grows over wrapped header lines while the Name column stays empty; the best header is the line naming the *most* fields (titles can match two). Mean OCR confidence below `OCR_POOR` shows a strong "probably misread" warning. Photos of a monitor read poorly — a sharp straight-on photo of paper, a scan, or the original file works. SheetJS is installed from the official `cdn.sheetjs.com` tarball, not the outdated npm `xlsx`.
- **Shared UI primitives** — `src/components/ui.tsx` exports `Badge`, `PageHeader`, `BtnPrimary`, `BtnGhost`, `Tabs`, and tone/category color maps. Reuse these instead of re-styling; pages compose them.

## Styling

- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin — there is **no `tailwind.config.js`**. Theme tokens (`--color-primary-*`, `--color-navy-*`, fonts) live in the `@theme` block of `src/index.css`; runtime CSS variables (`--bg`, `--surface`, `--border`, `--rail-*`, etc.) live in `@layer base`.
- **Light + dark themes.** `:root` holds the light tokens; `[data-theme='dark']` redefines the same tokens. A Tailwind `dark:` variant is wired to `data-theme` via `@custom-variant`. Custom utility classes like `muted`, `faint`, and `fade-rise` are defined in `index.css`.
- **Neutrals must use tokens, not raw Tailwind neutrals**, so they flip with the theme: `bg-[var(--surface)]` (not `bg-white`), `--surface-2` / `--surface-3` for hover/subtle fills (not `bg-slate-50/100`), `text-[var(--text-strong)]` / `--text-body` / `--text-muted` / `--text-faint` (not `text-slate-*`). Exception: `Login.tsx` is a fixed dark screen and uses `white/…` directly.
- **Accent tints need a `dark:` partner**: `bg-<hue>-50` → `dark:bg-<hue>-500/10`, `border-<hue>-200` → `dark:border-<hue>-500/25`, `text-<hue>-600/700` → `dark:text-<hue>-400`. Solid fills (`bg-*-500/600` with `text-white`) need nothing.
- **Visual language** (modelled on a Halo Lab Dribbble shot): violet `primary-*`, deep-indigo rail, uppercase mono display type (`JetBrains Mono` via `--font-display`; `h1`/`h2` get it automatically, use the `.display` class elsewhere), pill-shaped buttons/inputs/tabs (`rounded-full`), 24px card radius, `.hero` gradient panel for banners, and two highlight accents — `bg-zest` (lime, for the main call-to-action, dark text) and `bg-ember` (orange). Fonts load from Google Fonts in `index.html`.
- Color semantics are centralized: status tones in `ui.tsx` (`TONE`, `CATEGORY_TONE`, which already include dark variants). Prefer extending those maps over hard-coding new color classes.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs `npm ci && npm run build` and publishes `dist/` to GitHub Pages. `vite.config.ts` sets `base: './'` so the built assets resolve under a project subpath — do not change this to an absolute base.

## `legacy/`

`legacy/` holds the original static HTML/CSS/JS prototype, kept for reference only. It is not built, imported, or deployed — ignore it unless explicitly asked.
