# AI Session Snapshot: S014 — `/implement S4`

## Metadata

- Date: 2026-06-11
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `main`
- Start commit: `591ff1c`
- Raw transcript: `.specstory/history/2026-06-10_22-57-12Z-s4-implementation.md`
- Related artefacts: `docs/TECH_SPEC.md` (S4), `docs/TEST_PLAN.md` (T21–T23, T33, T34, T22, T28, T44, T45), `docs/PRD.md` (R1, R2, R6, R7, R9, R18, R20)

## Goal of this Cursor window

Implement tech-spec slice **S4 — Affordability surface (dashboard)** with matching tests.

## Scope restated (auditable)

| ID | Requirement |
|---|---|
| **R1** | Meaningful affordability assessment on dashboard |
| **R2** | Delta vs previous snapshot (render side; shape computation in `computeDelta`) |
| **R6** | Tone-appropriate disposable sign (+/−, not loss/gain) |
| **R7** | Support signpost on every outcome state; copy variant for shortfall/zero-income |
| **R9** | Plain-language reasoning + delta |
| **R18** | WCAG 2.2 AA on `<DashboardView />` |
| **R20** | `<FramingNotice />` inside `<DashboardView />` |
| **S4** | `components/DashboardView.tsx`, `components/SupportSignpost.tsx`, `src/app/dashboard/page.tsx`, `lib/dashboard/computeDelta.ts` |
| **T21–T23, T33, T34, T22, T28** (dashboard half), **T44, T45** | Render + a11y + signpost |

## Decisions

- **D-74 — `SupportSignpostCopy.message` added to `copy.ts`.** T45 requires visible copy-variant differences; message + label variants per state, with font-weight emphasis in the component (not colour-only).
- **D-75 — Test cleanup between `it.each` renders.** Vitest jsdom accumulates duplicate landmark IDs without `afterEach(cleanup)`; scoped `within(container)` queries used for signpost links (FramingNotice also exposes a support link).
- **D-76 — T29 extended to scan `supportSignpost.message`.** Minimal one-line addition so new copy field stays tone-guarded.

## Files changed

- `components/DashboardView.tsx` (new)
- `components/SupportSignpost.tsx` (new)
- `src/app/dashboard/page.tsx` (new)
- `lib/dashboard/computeDelta.ts` (new)
- `lib/affordability/copy.ts` — signpost variants + `message` field
- `lib/affordability/types.ts` — `SupportSignpostCopy` type
- `tests/_fixtures/snapshots.ts`, `tests/_fixtures/delta.ts` (new)
- `tests/_helpers/buildDashboardProps.ts` (new)
- `tests/s4/t21-*.tsx` through `t45-*.tsx` (9 test files + `compute-delta.test.ts`)
- `tests/s1/t29-tone-guard.test.ts` — scan `message`

## Tests run

- `npm test` — 91 passed (after critic follow-up: +5 `computeDelta`, +2 disposable sign)
- `npm run lint` — pass
- `npm run typecheck` — pass

## Critic follow-up

- `@critic` verdict: **Minor fixes** — applied top-3 items.
- Added `tests/s4/compute-delta.test.ts` (first-snapshot branch, disposable math, band improved/worsened/unchanged).
- Added `tests/s4/t21-disposable-sign-indicator.test.tsx` (R6 `+`/`−` on disposable line; no `loss`/`gain` on that line).
- Strengthened T33: asserts `+£500`, `−£300`, `£0` and `; your band is` punctuation.
- Delta copy aligned to TECH_SPEC semicolon via `{"; "}` JSX (Biome-safe).

## Deviations from spec

| Item | Spec says | Delivered | Reason |
|---|---|---|---|
| T28 HistoryList half | Assert framing in both views | Dashboard half only | `<HistoryList />` is S6 scope |
| Middleware redirect | S3 design mentions cookie redirect | Page-level `redirect('/')` only | TEST_PLAN assigns full redirect glue to manual integration; no `T*` for middleware in S4 |
| Async page unit tests | — | Not tested | Per tech-spec §5 deferred; page is thin I/O wrapper |

## Status

**Closed** — user confirmed S014 complete. Slice tests green; critic follow-up applied; changes uncommitted on `main`.

## Handoff

Next slice per tech-spec §3 recommended order: **`/implement S5`** (update form + Server Action + delta shape test T36).

Prompt for next session:

> S015 `/implement S5` — `app/dashboard/update/page.tsx`, `<UpdateForm />`, server action; tests T18–T20, T24–T25, T35–T38, T36.
