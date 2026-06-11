# Customer Financial Health

A customer-facing **affordability reflection and tracking** surface, built as the Ophelos engineering take-home task. A customer picks one of seven mock personas, lands on a dashboard that shows their disposable income, an affordability band (`surplus` / `breakeven` / `shortfall`), a plain-language reading of *why*, a **delta vs the previous snapshot**, an **always-visible signpost to human support**, and a **reflection-not-advice framing** notice on every outcome screen. They can submit a fresh income & expenditure (I&E) update — each submission becomes an **immutable snapshot** — and browse all previous snapshots.

This README is the **fresh-clone runbook** for a reviewer. You should not need to read anything else to install, run, test, or build the app. For the *thinking* behind what was built (and what was deliberately left out), see [`DECISIONS.md`](./DECISIONS.md).

---

## What's in here

| Doc | Purpose |
|---|---|
| **`README.md`** (this file) | Install / run / test / build instructions, persona selector, where data lives, where AI history lives |
| [`DECISIONS.md`](./DECISIONS.md) | What was built, what was left out, what is next, why; time-spent table |
| [`docs/PRD.md`](./docs/PRD.md) | Phase 2 — Product Requirements Document (R1–R20, non-goals N1–N8) |
| [`docs/TECH_SPEC.md`](./docs/TECH_SPEC.md) | Phase 3 — Technical specification (slices S1–S9, S7-setup) |
| [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) | Phase 4 — Test plan (cases T1–T45; T15–T17 reserved) |
| [`docs/discovery/NOTES.md`](./docs/discovery/NOTES.md) | Phase 1 — Discovery notes (problem, users, constraints, open questions) |
| [`docs/PROMPT_HISTORY.md`](./docs/PROMPT_HISTORY.md) | Index of every AI session, linked to its raw transcript and curated snapshot |
| [`docs/ai/sessions/`](./docs/ai/sessions/) | Curated per-session snapshots (`SNNN-*.md`) — goals, decisions, files changed, tests run |
| [`.specstory/history/`](./.specstory/history/) | Raw Cursor / SpecStory transcripts for every AI session |

---

## Requirements

- **Node.js** 18.18+ (developed and tested against Node 24). [Next.js 16 minimum](https://nextjs.org/docs).
- **npm** 9+ (developed against npm 11). Other package managers (pnpm / yarn / bun) should work but the lockfile is `package-lock.json`.
- **A C/C++ toolchain** for `better-sqlite3`'s native module — usually pre-installed on macOS / Linux dev machines. On Windows you may need `windows-build-tools`.

No external services, no API keys, no `.env` file required. Persistence is a local SQLite file (see [Where data lives](#where-data-lives)).

---

## Install and run

```bash
git clone <this repo> customer-financial-health
cd customer-financial-health
npm install
npm run dev
```

Then open <http://localhost:3000>. The first request automatically:

1. Creates `.data/financial-health.sqlite` (gitignored — see [`.gitignore`](./.gitignore)).
2. Applies the Drizzle migration in [`drizzle/`](./drizzle/) (idempotent).
3. Seeds starting snapshots for six of the seven personas (see [Personas](#personas)).

Pick a persona on the landing page and you'll be taken to the dashboard. **No authentication is involved** — the persona id is stored in an `HttpOnly` `Lax` cookie scoped to your local browser; switching personas means returning to `/`.

### Other scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js 16 dev server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm test` | Vitest unit + component + a11y suite (131 tests at the time of writing) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | Biome lint + format check |
| `npm run format` | Biome auto-format |
| `npm run typecheck` | `tsc --noEmit` |

---

## Routes

| Route | Page (async I/O) | Component (sync, unit-tested) | Purpose |
|---|---|---|---|
| `/` | `src/app/page.tsx` | `<PersonaPicker />` (inline) | Pick a persona; sets the persona cookie via `selectPersona` Server Action |
| `/dashboard` | `src/app/dashboard/page.tsx` | [`<DashboardView />`](./components/DashboardView.tsx) | Affordability surface — disposable, band, reasoning, delta, signpost, framing notice |
| `/dashboard/update` | `src/app/dashboard/update/page.tsx` | [`<UpdateForm />`](./components/UpdateForm.tsx) | Submit a new I&E payload (also the correction flow per A5) |
| `/history` | `src/app/history/page.tsx` | [`<HistoryList />`](./components/HistoryList.tsx) | Newest-first list of all submitted snapshots; signpost + framing notice at the bottom |
| `/support` | `src/app/support/page.tsx` | — | Static signpost destination (the product never auto-classifies vulnerability — N5) |

Per `docs/TECH_SPEC.md` §4, every route is a thin async `page.tsx` (cookie read, DB read, prop assembly) wrapping a sync presentational component. **Tests target the sync components**; the async pages are exercised by manual reviewer walkthrough (Vitest cannot render async Server Components — see `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`).

---

## Personas

The product ships with seven fictional personas covering each affordability band and each canonical edge case (R5, R8). All values are illustrative and clearly synthetic per `.cursor/rules/10-evidence.mdc`.

| `id` | Label | Starting outcome | Why it exists |
|---|---|---|---|
| `pat` | Pat — comfortable surplus | `surplus` | Healthy positive disposable income; band stays `surplus` |
| `sam` | Sam — small surplus near breakeven | `surplus` (near-breakeven note appended) | A1 — surplus that is ≤ 5 % of income, no fourth band introduced |
| `jordan` | Jordan — shortfall | `shortfall` | Expenditure > income; copy + signpost variant for shortfall |
| `alex` | Alex — zero income this month | `zero-income` | Income = 0 with expenditure > 0; first-class outcome distinct from generic shortfall |
| `riley` | Riley — new customer | `no-data` | No starting snapshot; exercises the empty-history + no-data dashboard branches |
| `casey` | Casey — irregular income (gig) | `surplus` (with `irregularIncomeNote`) | Variable-income flag drives an extra reasoning line (A3) |
| `morgan-drew` | Morgan + Drew — joint household | `surplus` | Two earners; exercises the joint-income (R8) shape |

`riley` is intentionally seeded **without** a starting snapshot so the no-data outcome and the empty `<HistoryList />` state are reachable. The other six personas get one starting snapshot inserted on first DB open (see `lib/db/seed.ts`).

---

## Where data lives

| Path | Purpose | Tracked? |
|---|---|---|
| `.data/financial-health.sqlite` | The SQLite DB file (one table: `snapshots`) | **No** — gitignored. Auto-created on first request. Delete it to reset state. |
| `drizzle/0000_*.sql` | The Drizzle migration that defines the `snapshots` table and the `(customer_id, taken_at DESC)` index | **Yes** |
| `lib/db/` | Schema, migrate runner, seed function, repository (the only module that touches SQLite) | **Yes** |
| `lib/personas.ts` | The seven persona fixtures — fictional names and synthetic £-values only | **Yes** |

**To reset persona / DB state**: stop the dev server, delete `.data/`, restart. The next request re-runs the migration and re-seeds.

**Data-minimisation posture (R10)**: the application logs only lifecycle events (`db: opened`, `db: migration applied`); it never logs I&E values, customer ids tied to row contents, or earner / expenditure labels. The S2 / S5 logging-hygiene tests (T12, T20) protect this.

---

## How the codebase is organised

```
app code                            tests
────────────────────────────        ──────────────────────────────────
src/app/                            tests/
  layout.tsx                          _fixtures/   shared synthetic IE
  page.tsx                            _helpers/    makeDb, withPersonaCookie, …
  actions.ts                          s1/   T1–T8, T29 calculator + copy
  dashboard/page.tsx                  s2/   T9–T12 repository
  dashboard/update/{page,actions}.tsx s3/   T13–T14 personas + cookie
  history/page.tsx                    s4/   T21–T23, T33–T34, T44–T45
  support/page.tsx                    s5/   T18–T20, T24–T25, T35–T38
                                      s6/   T26–T28, T39
components/                           s7-setup/  T30, T31 harness smoke
  DashboardView.tsx                   s9/   T28, T32, T43 framing
  UpdateForm.tsx ('use client')
  HistoryList.tsx
  FramingNotice.tsx (R20)             docs/
  SupportSignpost.tsx (R7)              PRD.md, TECH_SPEC.md, TEST_PLAN.md
                                        ai/sessions/SNNN-*.md
lib/                                    discovery/NOTES.md
  affordability/  pure domain          PROMPT_HISTORY.md
  db/             SQLite + Drizzle
  identity/       persona cookie     drizzle/   committed SQL migrations
  personas.ts     7 fixtures         .data/     gitignored SQLite file
  update/         form parse + copy  .specstory/history/  raw transcripts
  dashboard/      delta computation
```

`docs/TECH_SPEC.md` §2 has the full module-responsibility narrative.

---

## Where the AI history lives

This project was built with Cursor + Claude (Anthropic) under a strict five-phase workflow (see `CLAUDE.md` and `.cursor/rules/00-workflow.mdc`). Per the project's `ai-history` rule:

- **Raw transcripts** of every Cursor window are captured by SpecStory in [`.specstory/history/`](./.specstory/history/) — one file per session, named by start timestamp.
- **Curated session snapshots** are in [`docs/ai/sessions/`](./docs/ai/sessions/), one `SNNN-*.md` file per session. Each records goal, scope, decisions, files changed, tests run, and a handoff prompt for the next session.
- The **session index** lives in [`docs/PROMPT_HISTORY.md`](./docs/PROMPT_HISTORY.md): one row per session linking the raw transcript, the curated snapshot, the commit(s), and the outcome.

These three artefacts together satisfy R16 (full prompt history retained).

---

## Phase artefacts (PRD → tech spec → test plan → implementation)

The repo follows a strict five-phase pipeline. Each phase produces one canonical artefact and gates the next:

| # | Phase | Artefact | Status |
|---|---|---|---|
| 1 | Product discovery | [`docs/discovery/NOTES.md`](./docs/discovery/NOTES.md) | Committed |
| 2 | PRD | [`docs/PRD.md`](./docs/PRD.md) | Committed (R1–R20) |
| 3 | Technical specification | [`docs/TECH_SPEC.md`](./docs/TECH_SPEC.md) | Committed (S1–S9, S7-setup) |
| 4 | Test plan | [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) | Committed (T1–T45; T15–T17 reserved) |
| 5 | Controlled implementation | source code + tests | S1–S6, S7-setup, S9 shipped (S8 = this slice) |

Slice-by-slice traceability is in `docs/TECH_SPEC.md` §7 and `docs/TEST_PLAN.md` §7.

---

## Accessibility

The four sync presentational components — `<DashboardView />`, `<UpdateForm />`, `<HistoryList />`, `<FramingNotice />` — are designed to **WCAG 2.2 AA** (per `docs/TECH_SPEC.md` §5 trade-off "WCAG conformance level"). `vitest-axe` runs against each in pristine and error states (T34 / T37 / T39 / T44 / T32). Manual visual checks for SC 1.4.10 (reflow at 400 % zoom / 320 CSS-px viewport) are part of the reviewer walkthrough — automated reflow coverage is intentionally out of scope for the take-home (TEST_PLAN §6).

---

## Out of scope (deliberately not built)

The following are listed here so a reviewer doesn't go hunting for them. The full rationale is in `DECISIONS.md` and `docs/TECH_SPEC.md` §6 / `docs/PRD.md` §5 (non-goals N1–N8).

- **R11 currency / country code with migrations** — Could-class; not delivered.
- **R12 secure time-limited statement-share link** — Could-class; needs a paired threat model; not delivered.
- **R13 PDF export** — Could-class; not delivered.
- **Real authentication / Open Banking / credit-bureau integration** — N1.
- **Repayment-plan selection / arrangement booking / collections workflow / agent UI** — N2 / N3 / N4.
- **Automated vulnerability classification** — N5; users self-declare via the signpost.
- **E2E tests (Playwright / Cypress)** — out for MVP per TEST_PLAN §6; manual walkthrough is the integration signal.

---

## Licence

This repository is a take-home submission and is not licensed for redistribution.
