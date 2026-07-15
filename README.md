# Facility Management System

A small Angular application for viewing and managing geolocated facilities — a list view with search/filter/pagination, a detail view with an OpenLayers map, and a Reactive Forms edit screen.

## Stack

Angular 21 (standalone components, signals, zoneless change detection) · TypeScript · PrimeNG (Aura theme) · Tailwind CSS · OpenLayers · Reactive Forms · ESLint · Prettier · Vitest

## Setup & run

```bash
npm install
npm start        # dev server at http://localhost:4200
npm test         # unit tests (Vitest)
npm run lint     # ESLint
npx prettier --check "src/**/*.{ts,html,css}"   # formatting check
npm run build    # production build → dist/
```

No backend, API key, or environment variables are required — all data is served from a static JSON asset (see [Mock data](#mock-data--simulated-behavior) below).

## Folder structure

```
src/app/
├── core/
│   ├── models/facility.ts        # Facility, FacilityStatus, FacilityUpdate, status option/severity maps
│   └── services/facility.service.ts   # getAll/getById/update — the only place that knows data is mocked
├── features/facilities/
│   ├── facilities.routes.ts      # lazy child routes: list, detail (:id), edit (:id/edit)
│   ├── facility-list/            # table: search, status filter, pagination, loading/empty/error states
│   ├── facility-detail/          # read-only view + embedded map, preserves list filters on "Back"
│   ├── facility-edit/            # Reactive Form: validation, save/cancel, toast + redirect
│   └── facility-map/             # standalone OpenLayers wrapper, isolated from the rest of the UI
├── app.ts / app.html / app.config.ts   # root shell (header/footer, router outlet, global toast)
└── app.routes.ts                 # redirects `/` → `/facilities`, lazy-loads the facilities feature
```

Everything under `features/facilities` is lazy-loaded as one unit (`loadChildren`), and each of its three views is itself lazy-loaded (`loadComponent`) — confirmed by inspecting `ng build` output, where `facility-list`, `facility-detail`, and `facility-edit` each produce their own chunk, and OpenLayers only appears in the `facility-detail` chunk (nowhere in the initial bundle).

## Mock data & simulated behavior

`public/data/facilities.json` has 22 facilities across all three statuses and a mix of predefined/free-text types, spread across Ghana with distinct coordinates and `lastUpdated` timestamps — enough to exercise search, filtering, pagination, and the map.

`FacilityService` fetches that file once (cached in memory for the session), and every method adds ~600ms of artificial latency to make the loading states visible. Append `?simulateError=true` to any URL to force every request to fail, for testing the error/retry UI (e.g. `http://localhost:4200/facilities?simulateError=true`). `update()` mutates the in-memory store, so edits persist for the rest of the session but reset on a full page reload — there's no real backend.

## Technical decisions

### OpenLayers coordinate transform (`fromLonLat`)

Facility coordinates are stored as plain WGS84 longitude/latitude degrees (the `latitude`/`longitude` fields on `Facility`). OpenLayers' `Map`/`View` render in Web Mercator (`EPSG:3857`) by default, so `FacilityMap` (`src/app/features/facilities/facility-map/facility-map.ts`) explicitly calls `fromLonLat([longitude, latitude])` before using those coordinates as the view center or the marker's `Point` geometry. This is a deliberate choice to keep the domain model in the units the rest of the app (and a real backend) would use — the projection is purely a map-rendering concern, isolated inside `FacilityMap`.

### Toast provided at the app root, not the edit screen

`MessageService` and `<p-toast>` live in `app.config.ts`/`app.html`, not inside `FacilityEdit`. A toast scoped to the edit component would be destroyed the instant the post-save `router.navigate()` tears that component down — before the user ever saw it. Root-level registration is also the more correct home for something that's conceptually an app-wide singleton, alongside `provideRouter`/`provideHttpClient`/`providePrimeNG`.

### Filter/search state round-trips through query params

`FacilityList` syncs its search term and status filter into its own URL query params (`?search=...&status=...`) and forwards them to the detail/edit routes it links to. Detail and edit read them back the same way (via `withComponentInputBinding()`, so they arrive as plain component inputs) and carry them into their own "Back"/"Cancel" links — so List → Detail/Edit → Back always returns to the exact filtered view the user came from.

## Optional requirements — what I did and skipped

| Item | Status | Notes |
|---|---|---|
| Lazy loading | ✅ Done | Whole feature + each of its 3 views individually lazy-loaded |
| Signals | ✅ Done | All local component state (search, filters, loading, error, submitting) is `signal()`/`computed()`; the Reactive `FormGroup` deliberately isn't, since Forms has its own change-detection integration |
| Filter persistence via query params | ✅ Done | See above |
| Skeleton loading states | ✅ Done | Table rows, detail fields, edit form — shaped to match their real content |
| Success/error notifications | ✅ Done | PrimeNG Toast, app-root-scoped |
| HTTP interceptor | ❌ Skipped | Nothing in this app needs cross-cutting request handling (no auth headers, no shared error mapping beyond what `FacilityService` already does) — would be speculative infrastructure for a mock API |
| Mock auth guard | ❌ Skipped | No auth requirement in scope; adding one would just be a fake gate with nothing behind it |
| Centralized error handling | ⚠️ Partial | List/detail/edit each own a local `error`/`loadError` signal with their own message + retry — simple and colocated. A shared error-handling service would make sense once a fourth place needed the same pattern, not before |
| Responsive design | ⚠️ Partial | Tailwind utility classes (`flex-wrap`, fluid widths) keep things from breaking on medium/narrow viewports, but I didn't do a full mobile pass or test small phone widths |
| Accessibility | ⚠️ Partial | Semantic elements (`dl`/`dt`/`dd`, `label[for]`), `aria-label`s on icon-only actions, Angular's template a11y lint rules enabled, and PrimeNG's own ARIA support on its components — but no manual screen-reader audit |
| Dockerfile | ❌ Skipped | Out of scope for the ~5h budget given everything else above |
| GitLab CI pipeline | ❌ Skipped | Same as above |
| DTO vs. view-model separation | ❌ Skipped | The mock API already returns exactly the shape the UI needs (`Facility`), so a separate DTO layer would be pure ceremony here — worth introducing the moment a real backend's response shape diverges from what the views want |

## AI tool usage

This project was built with **Claude Code** as an active collaborator throughout — implementing components/services/tests, debugging real issues as they came up (e.g. a test-fixture mutation bug in the facility service tests, a missing `ResizeObserver` polyfill for testing the OpenLayers map, PrimeNG API quirks), and applying feedback iteratively (e.g. simplifying an over-engineered latency simulation down to a single `delay()` operator). I reviewed and understand every change; where Claude's first pass had a real bug, that bug and its fix are described honestly above and in the commit history rather than hidden.

## What I'd improve with more time

- A full responsive/mobile pass, and an actual screen-reader accessibility audit rather than just the structural a11y basics above
- E2E tests (Playwright) covering the full list → detail → edit → save round trip, complementing the current unit-test coverage
- Debounce the search input — a no-op at 22 records, but would matter against a real API
- Route guard / explicit "not found" handling for an invalid facility ID, beyond the current generic error message
- Docker + a basic CI pipeline (lint, test, build) for the deliverables not reached in this pass
