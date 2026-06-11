# Customer Financial Health

A customer-facing **affordability reflection and tracking** surface, built as the Ophelos engineering take-home task. A customer picks one of seven mock personas, lands on a dashboard that shows their disposable income, an affordability band (`surplus` / `breakeven` / `shortfall`), a plain-language reading of *why*, a **delta vs the previous snapshot**, an **always-visible signpost to human support**, and a **reflection-not-advice framing** notice on every outcome screen. They can submit a fresh income & expenditure (I&E) update — each submission becomes an **immutable snapshot** — and browse all previous snapshots.

The interface uses a calm neutral palette, the `Geist` typeface, [`lucide-react`](https://lucide.dev) iconography (decorative — every icon is `aria-hidden` and paired with a visible text label), and a persona-aware top-of-page navigation. See [UI surface](#ui-surface) for the per-route breakdown.

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
| `/` | `src/app/page.tsx` | Inline persona picker | Pick a persona; sets the persona cookie via `selectPersona` Server Action |
| `/dashboard` | `src/app/dashboard/page.tsx` | [`<DashboardView />`](./components/DashboardView.tsx) | Affordability surface — disposable, band, reasoning, delta, signpost, framing notice |
| `/dashboard/update` | `src/app/dashboard/update/page.tsx` | [`<UpdateForm />`](./components/UpdateForm.tsx) | Submit a new I&E payload (also the correction flow per A5) |
| `/history` | `src/app/history/page.tsx` | [`<HistoryList />`](./components/HistoryList.tsx) | Newest-first list of all submitted snapshots; signpost + framing notice at the bottom |
| `/support` | `src/app/support/page.tsx` | — | Static signpost destination (the product never auto-classifies vulnerability — N5) |

Per `docs/TECH_SPEC.md` §4, every route is a thin async `page.tsx` (cookie read, DB read, prop assembly) wrapping a sync presentational component. **Tests target the sync components**; the async pages are exercised by manual reviewer walkthrough (Vitest cannot render async Server Components — see `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`).

---

## UI surface

A short tour of what a reviewer will see on each route — useful when reading [`components/`](./components/) alongside `docs/TECH_SPEC.md` §S4–S6 / S9.

| Surface | Component | What's on screen |
|---|---|---|
| Global header | [`<AppHeader />`](./components/AppHeader.tsx) — server component, reads the persona cookie | Brand mark; persona-aware primary nav (Dashboard / Update / History / Support); active-persona chip; "Switch persona" link. Hidden nav and chip on `/` so the persona picker stays a clean entry point. **Not sticky** (per tech-spec §4 cross-cutting on SC 2.4.11 Focus Not Obscured). |
| `/` persona picker | `src/app/page.tsx` | A `<fieldset legend="Persona">` wrapping a `<ul>` of radio-card list items — one card per persona, each showing the name, the expected starting outcome tag, and a short context line. Submits `personaId` through `selectPersona` (no behaviour change vs the prior `<select>`). |
| `/dashboard` | [`<DashboardView />`](./components/DashboardView.tsx) | Hero snapshot card: a first-name greeting (derived from `persona.label`), the outcome headline, and three sibling metrics — **Total income**, **Total outgoings**, **Disposable income**. Beneath the hero, a two-column layout for the **Why this result** reasoning panel and the **How you've changed** delta panel. Then the support signpost, the R20 framing notice, and the two primary CTAs ("Update my income & outgoings", "View past submissions"). Band chip and irregular-income note appear inside the hero when applicable. |
| `/dashboard/update` | [`<UpdateForm />`](./components/UpdateForm.tsx) | Page header → optional error-summary alert (`role="alert"`, autofocused) → two card-style `<fieldset>`s for **Monthly income** and **Monthly outgoings**, each with labelled inputs and icon-backed Add/Remove row buttons → submit/cancel actions. Field-level errors render under each invalid input with `aria-invalid` + `aria-describedby` wiring intact. |
| `/history` | [`<HistoryList />`](./components/HistoryList.tsx) | A "Back to dashboard" link, the page heading + snapshot count, then a timeline-style `<ol>` of snapshot cards (newest first) with a left-rail dot decoration at `sm+`. Each card shows the date (`<time dateTime>`), a relative phrase, the outcome state, disposable income, the band chip, and a `<details>/<summary>` disclosure containing side-by-side Income / Outgoings sections (`<dl>`/`<dt>`/`<dd>`). Support signpost + framing notice anchor the bottom. |
| `/support` | `src/app/support/page.tsx` | Card with a heading, intro copy, two placeholder contact methods (email / phone), and a "Back to persona picker" link. No real contact channels — this is a static signpost destination only. |

**Iconography.** All icons are imported from [`lucide-react`](https://lucide.dev). They are decorative (`aria-hidden="true"`) and always paired with a visible text label or an explicit `aria-label`. They do not convey state on their own — for example, the band chip is text + arrow glyph, never colour alone (per R18 / tech-spec S4).

**Palette.** A neutral slate canvas with paired dark-mode variables under `prefers-color-scheme: dark`. There is intentionally no alarming red/green: the support signpost on `shortfall` / `zero-income` is differentiated by copy variant and the dark accent disc, not by colour-coded severity.

---

## Personas

The product ships with seven fictional personas covering each affordability band and each canonical edge case (R5, R8). All values are illustrative and clearly synthetic per [`.rulesync/rules/10-evidence.md`](./.rulesync/rules/10-evidence.md) (the tracked source-of-truth for sensitive-data hygiene).

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
  globals.css                         _helpers/    makeDb, withPersonaCookie, …
  page.tsx                            s1/   T1–T8, T29 calculator + copy
  actions.ts                          s2/   T9–T12 repository
  dashboard/page.tsx                  s3/   T13–T14 personas + cookie
  dashboard/update/{page,actions}.tsx s4/   T21–T23, T33–T34, T44–T45
  history/page.tsx                    s5/   T18–T20, T24–T25, T35–T38
  support/page.tsx                    s6/   T26–T28, T39
                                      s7-setup/  T30, T31 harness smoke
components/                           s9/   T28, T32, T43 framing
  AppHeader.tsx (S019 polish)
  DashboardView.tsx                 docs/
  UpdateForm.tsx ('use client')       PRD.md, TECH_SPEC.md, TEST_PLAN.md
  HistoryList.tsx                     ai/sessions/SNNN-*.md
  FramingNotice.tsx (R20)             discovery/NOTES.md
  SupportSignpost.tsx (R7)            PROMPT_HISTORY.md

lib/                                drizzle/   committed SQL migrations
  affordability/  pure domain       .data/     gitignored SQLite file
  db/             SQLite + Drizzle  .specstory/history/  raw transcripts
  identity/       persona cookie    .rulesync/ AI workflow source-of-truth
  personas.ts     7 fixtures        AGENTS.md  Next.js note for agents
  update/         form parse + copy
  dashboard/      delta computation
```

`docs/TECH_SPEC.md` §2 has the full module-responsibility narrative.

---

## Where the AI workflow lives

This project was built with Cursor + Claude (Anthropic) under a strict five-phase workflow. The **tracked source-of-truth** for rules, slash-commands, the critic subagent, and the phase-gate skill is the [`.rulesync/`](./.rulesync/) tree; tool-native equivalents under `CLAUDE.md` / `.claude/` / `.cursor/` are **gitignored generated outputs** (see [`.gitignore`](./.gitignore)) produced by `npm run rulesync:generate` and should not be edited directly.

| Path | Role | Tracked? |
|---|---|---|
| [`.rulesync/rules/00-workflow.md`](./.rulesync/rules/00-workflow.md) | The five-phase pipeline (discovery → PRD → tech spec → test plan → implement) and its non-negotiable rules | **Yes** |
| [`.rulesync/rules/10-evidence.md`](./.rulesync/rules/10-evidence.md) | Anti-fabrication, stable IDs, traceability, sensitive-data hygiene | **Yes** |
| [`.rulesync/commands/`](./.rulesync/commands/) | `/discovery`, `/prd`, `/tech-spec`, `/test-plan`, `/implement` slash-commands | **Yes** |
| [`.rulesync/subagents/critic.md`](./.rulesync/subagents/critic.md) | The honest-reviewer subagent used between phases | **Yes** |
| [`.rulesync/skills/phase-gate/`](./.rulesync/skills/phase-gate/) | Shared schema for every phase artefact (header, gate-criteria block, traceability) | **Yes** |
| [`AGENTS.md`](./AGENTS.md) | Repo-root note flagging the Next.js 16 breaking-change posture for any AI agent | **Yes** |
| [`rulesync.jsonc`](./rulesync.jsonc) | Rulesync configuration (targets, features, output roots) | **Yes** |
| `CLAUDE.md`, `.claude/`, `.cursor/` | Tool-native rule files generated from `.rulesync/` | No (gitignored) |

Per the project's `ai-history` rule, AI work also produces:

- **Raw transcripts** of every Cursor window, captured by SpecStory in [`.specstory/history/`](./.specstory/history/) — one file per session, named by start timestamp.
- **Curated session snapshots** in [`docs/ai/sessions/`](./docs/ai/sessions/), one `SNNN-*.md` file per session. Each records goal, scope, decisions, files changed, tests run, and a handoff prompt for the next session.
- The **session index** in [`docs/PROMPT_HISTORY.md`](./docs/PROMPT_HISTORY.md): one row per session linking the raw transcript, the curated snapshot, the commit(s), and the outcome.

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
| 5 | Controlled implementation | source code + tests | S1–S6, S7-setup, S8, S9 shipped; S019 added a non-feature UI polish pass on top |

Slice-by-slice traceability is in `docs/TECH_SPEC.md` §7 and `docs/TEST_PLAN.md` §7.

---

## Accessibility

The sync presentational components — `<DashboardView />`, `<UpdateForm />`, `<HistoryList />`, `<SupportSignpost />`, `<FramingNotice />` — are designed to **WCAG 2.2 AA** (per `docs/TECH_SPEC.md` §5 trade-off "WCAG conformance level"). `vitest-axe` runs against each in pristine and error states (T34 / T37 / T39 / T44 / T32). Manual visual checks for SC 1.4.10 (reflow at 400 % zoom / 320 CSS-px viewport) are part of the reviewer walkthrough — automated reflow coverage is intentionally out of scope for the take-home (TEST_PLAN §6).

The S019 polish pass preserves these commitments: `<AppHeader />` is **not sticky** (so SC 2.4.11 Focus Not Obscured stays satisfied by construction); every `lucide-react` icon is `aria-hidden` and paired with visible text; the radio-card persona picker uses a real `<fieldset>` / `<legend>` / `<input type="radio">` structure rather than custom click handlers.

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
