# Customer Financial Health

A customer-facing **affordability reflection and tracking** surface, built as the Ophelos engineering take-home task. A customer picks one of seven mock personas, lands on a dashboard that shows their disposable income, an affordability band (`surplus` / `breakeven` / `shortfall`), a plain-language reading of *why*, a **delta vs the previous snapshot**, an **always-visible signpost to human support**, and a **reflection-not-advice framing** notice on every outcome screen. They can submit a fresh income & expenditure (I&E) update — each submission becomes an **immutable snapshot** — and browse all previous snapshots.

All three Could-class stretch goals are delivered:

- **Currency + country code** persisted on every snapshot (`'GBP'` / `'GB'` defaults), formatted via a single `formatMoney(pence, currency, countryCode)` helper.
- **Time-limited statement sharing** — a 24-hour read-only link the customer can hand to a third party at `/share/<token>`.
- **PDF export** — a Route Handler at `/dashboard/snapshot/[id]/pdf` streaming a self-contained PDF rendered with `@react-pdf/renderer`.

The interface uses a calm neutral palette, the `Geist` typeface, [`lucide-react`](https://lucide.dev) iconography (decorative — every icon is `aria-hidden` and paired with a visible text label), and a persona-aware top-of-page navigation. See [UI surface](#ui-surface) for the per-route breakdown.

This README is the **fresh-clone runbook** for a reviewer. You should not need to read anything else to install, run, test, or build the app. For the *thinking* behind what was built (and what was deliberately left out, and what production hardening would still be needed), see [`DECISIONS.md`](./DECISIONS.md).

---

## What's in here

| Doc | Purpose |
|---|---|
| **`README.md`** (this file) | Install / migrate / run / test / build instructions, persona selector, route table, currency / share-link / PDF instructions, where data lives, where AI history lives |
| [`DECISIONS.md`](./DECISIONS.md) | What was built, MVP scope, stretch goals delivered, what was deliberately left out, production hardening still needed, time-spent table |
| [`docs/PRD.md`](./docs/PRD.md) | Phase 2 — Product Requirements Document (R1–R20, non-goals N1–N8) |
| [`docs/TECH_SPEC.md`](./docs/TECH_SPEC.md) | Phase 3 — Technical specification (slices S1–S9, S7-setup; **S10 / S11 / S12 stretch addendum at rev 5.1**) |
| [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) | Phase 4 — Test plan (cases T1–T76; T15–T17 reserved) |
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
git clone https://github.com/VinayakHegde/customer-financial-health.git
cd customer-financial-health
npm install
npm run dev
```

Then open <http://localhost:3000>. The first request automatically:

1. Creates `.data/financial-health.sqlite` (gitignored — see [`.gitignore`](./.gitignore)).
2. **Applies all Drizzle migrations** in [`drizzle/`](./drizzle/) (idempotent — `0000_naive_groot.sql` for the MVP `snapshots` table, `0001_s10_currency_country.sql` for the stretch `currency` / `country_code` columns, `0002_s11_share_links.sql` for the stretch `share_links` table).
3. Seeds starting snapshots for six of the seven personas (see [Personas](#personas)).

There is no separate `migrate` command — migrations run on the first request to any route that opens the database (`lib/db/migrate.ts` is invoked from `lib/db/client.ts` once per process). To re-run migrations from a clean slate, stop the dev server, `rm -rf .data/`, and restart.

Pick a persona on the landing page and you'll be taken to the dashboard. **No authentication is involved** — the persona id is stored in an `HttpOnly` `Lax` cookie scoped to your local browser; switching personas means returning to `/`.

### Other scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js 16 dev server (Turbopack) on port 3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm test` | Vitest unit + component + a11y suite (**236 tests across 79 files** at the time of writing — MVP T1–T45 + stretch T46–T76; T15–T17 reserved) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | Biome lint + format check |
| `npm run format` | Biome auto-format |
| `npm run typecheck` | `tsc --noEmit` |

---

## Routes

The S11 stretch slice (secure share link) introduced two route groups so the recipient-facing `/share/<token>` surface inherits a different layout (no `<AppHeader />`, no persona-aware nav) without leaking persona identity.

| Route | Route group | Page / handler | Component (sync, unit-tested) | Purpose |
|---|---|---|---|---|
| `/` | `(main)` | `src/app/(main)/page.tsx` | Inline persona picker | Pick a persona; sets the persona cookie via `selectPersona` Server Action |
| `/dashboard` | `(main)` | `src/app/(main)/dashboard/page.tsx` | [`<DashboardView />`](./components/DashboardView.tsx) | Affordability surface — disposable, band, reasoning, delta, signpost, framing notice; `<ShareSnapshotForm />` + `<DownloadPdfLink />` for the latest snapshot |
| `/dashboard/update` | `(main)` | `src/app/(main)/dashboard/update/page.tsx` | [`<UpdateForm />`](./components/UpdateForm.tsx) | Submit a new I&E payload (also the correction flow per A5) |
| `/history` | `(main)` | `src/app/(main)/history/page.tsx` | [`<HistoryList />`](./components/HistoryList.tsx) | Newest-first list of all submitted snapshots; share + download per row; signpost + framing notice at the bottom |
| `/dashboard/snapshot/[id]/pdf` | `(main)` | `src/app/(main)/dashboard/snapshot/[id]/pdf/route.ts` (Route Handler, `runtime = 'nodejs'`) | — | Streams a PDF for an owned snapshot via `@react-pdf/renderer`; persona-validates + ownership-checks before rendering |
| `/support` | `(main)` | `src/app/(main)/support/page.tsx` | — | Static signpost destination (the product never auto-classifies vulnerability — N5) |
| `/share/[token]` | `(share)` | `src/app/(share)/share/[token]/page.tsx` | [`<SharedStatementView />`](./components/SharedStatementView.tsx) / [`<ShareUnavailable />`](./components/ShareUnavailable.tsx) | Read-only recipient surface for a 24-hour share link; same response on every miss (unknown / expired / snapshot-row-missing) |

Per `docs/TECH_SPEC.md` §4, every route is a thin async `page.tsx` (cookie read, DB read, prop assembly) wrapping a sync presentational component. **Tests target the sync components**; the async pages are exercised by manual reviewer walkthrough (Vitest cannot render async Server Components — see `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`).

Two production-cross-cutting concerns are owned by [`middleware.ts`](./middleware.ts) at the project root:

- On `/share/*` it emits `Cache-Control: no-store, private` and `X-Robots-Tag: noindex, nofollow` (Next.js 16 Server Components cannot set response headers, so middleware is the only viable origin per tech-spec §S11 D-163).
- On every other route it is a transparent pass-through.

---

## UI surface

A short tour of what a reviewer will see on each route — useful when reading [`components/`](./components/) alongside `docs/TECH_SPEC.md` §S4–S6 / S9–S12.

| Surface | Component | What's on screen |
|---|---|---|
| Global header | [`<AppHeader />`](./components/AppHeader.tsx) — server component, reads the persona cookie | Brand mark; persona-aware primary nav (Dashboard / Update / History / Support); active-persona chip; "Switch persona" link. Hidden nav and chip on `/` so the persona picker stays a clean entry point. **Not sticky** (per tech-spec §4 cross-cutting on SC 2.4.11 Focus Not Obscured). Lives only under the `(main)` route group; `(share)` has its own minimal header with the product wordmark and no persona signal. |
| `/` persona picker | `src/app/(main)/page.tsx` | A `<fieldset legend="Persona">` wrapping a `<ul>` of radio-card list items — one card per persona, each showing the name, the expected starting outcome tag, and a short context line. Submits `personaId` through `selectPersona` (no behaviour change vs the prior `<select>`). |
| `/dashboard` | [`<DashboardView />`](./components/DashboardView.tsx) | Hero snapshot card: a first-name greeting (derived from `persona.label`), the outcome headline, and three sibling metrics — **Total income**, **Total outgoings**, **Disposable income**. Beneath the hero, a two-column layout for the **Why this result** reasoning panel and the **How you've changed** delta panel. Then the support signpost, the R20 framing notice, and the two primary CTAs ("Update my income & outgoings", "View past submissions"). When a stored snapshot exists, the hero gains a [`<ShareSnapshotForm />`](./components/ShareSnapshotForm.tsx) + [`<DownloadPdfLink />`](./components/DownloadPdfLink.tsx) pair. Band chip and irregular-income note appear inside the hero when applicable. |
| `/dashboard/update` | [`<UpdateForm />`](./components/UpdateForm.tsx) | Page header → optional error-summary alert (`role="alert"`, autofocused) → two card-style `<fieldset>`s for **Monthly income** and **Monthly outgoings**, each with labelled inputs and icon-backed Add/Remove row buttons → submit/cancel actions. Field-level errors render under each invalid input with `aria-invalid` + `aria-describedby` wiring intact. |
| `/history` | [`<HistoryList />`](./components/HistoryList.tsx) | A "Back to dashboard" link, the page heading + snapshot count, then a timeline-style `<ol>` of snapshot cards (newest first) with a left-rail dot decoration at `sm+`. Each card shows the date (`<time dateTime>`), a relative phrase, the outcome state, disposable income, the band chip, and a `<details>/<summary>` disclosure containing side-by-side Income / Outgoings sections (`<dl>`/`<dt>`/`<dd>`). Each row also exposes its own [`<ShareSnapshotForm />`](./components/ShareSnapshotForm.tsx) + [`<DownloadPdfLink />`](./components/DownloadPdfLink.tsx) pair so a customer can share or export any historical snapshot, not just the latest. Support signpost + framing notice anchor the bottom. |
| `/share/[token]` (recipient) | [`<SharedStatementView />`](./components/SharedStatementView.tsx) — happy path; [`<ShareUnavailable />`](./components/ShareUnavailable.tsx) — every miss arm | The recipient never sees `<AppHeader />`, the persona name / id, the customer's other snapshots, or any nav into `/dashboard*` / `/history`. The happy path renders the same outcome surface the customer sees (disposable, band chip, reasons, breakdown, support signpost, framing notice) — the `<ShareUnavailable />` page deliberately omits framing + signpost (no outcome on the page; mirrors S007 round-2 F2.1 narrowing). All three miss arms (unknown / expired / snapshot-row-missing) collapse to byte-identical copy + headers. |
| `/dashboard/snapshot/[id]/pdf` | (Route Handler — no DOM) | Streams a self-contained PDF rendered server-side by [`<SnapshotPdf />`](./lib/pdf/SnapshotPdf.tsx) (a pure-React `@react-pdf/renderer` document). Twelve sections: wordmark, snapshot date (UTC), currency / country line, totals, band text-label, reasons, income breakdown, expenditure breakdown, support signpost copy block + `/support` URL, framing notice body verbatim. |
| `/support` | `src/app/(main)/support/page.tsx` | Card with a heading, intro copy, two placeholder contact methods (email / phone), and a "Back to persona picker" link. No real contact channels — this is a static signpost destination only. |

**Iconography.** All icons are imported from [`lucide-react`](https://lucide.dev). They are decorative (`aria-hidden="true"`) and always paired with a visible text label or an explicit `aria-label`. They do not convey state on their own — for example, the band chip is text + arrow glyph, never colour alone (per R18 / tech-spec S4).

**Palette.** A neutral slate canvas with paired dark-mode variables under `prefers-color-scheme: dark`. There is intentionally no alarming red/green: the support signpost on `shortfall` / `zero-income` is differentiated by copy variant and the dark accent disc, not by colour-coded severity.

---

## How to use the app

A task-oriented tour for the reviewer. Every step assumes `npm run dev` is running and you have opened <http://localhost:3000>.

### Pick a persona

Land on `/`. Choose one of the seven radio cards (see [Personas](#personas) for what each persona models) and submit. The `selectPersona` Server Action sets an `HttpOnly` `Lax` `personaId` cookie and redirects you to `/dashboard`.

### View the dashboard

`/dashboard` renders the latest snapshot for the active persona (six of the seven personas have a starting snapshot seeded on first DB open; `riley` is intentionally seeded without one to exercise the no-data branch). Disposable / income / outgoings are formatted via `formatMoney(pence, snapshot.currency, snapshot.countryCode)` from [`lib/affordability/format.ts`](./lib/affordability/format.ts). The delta panel compares the latest two snapshots; on the first one or with no snapshot at all, it shows a friendly placeholder (per A2).

### Update I&E (also the correction flow per A5)

Click "Update my income & outgoings" on the dashboard. The form writes a fresh **immutable snapshot** — the previous one stays visible in `/history`. Validation errors render as an autofocused `role="alert"` summary plus per-field `aria-describedby` messages; submitted values are preserved on re-render so the customer never has to retype.

### View history

`/history` shows every snapshot for the active persona, newest first. Each row carries its own `<details>/<summary>` disclosure with the full income / expenditure breakdown, plus a Share + PDF pair so any historical snapshot is shareable / exportable, not just the latest.

### Use currency / country code support (R11, S10)

Every snapshot persists `currency` and `country_code` columns (`'GBP'` and `'GB'` defaults — see `lib/db/schema.ts`). The repository accepts optional `currency?` / `countryCode?` on `CreateSnapshotInput`, defaulting to `'GBP' / 'GB'` when omitted. Display strings flow through one helper:

```ts
import { formatMoney } from "@/lib/affordability/format";

formatMoney(123450, "GBP", "GB"); // → "£1,234.50"
formatMoney(0,      "GBP", "GB"); // → "£0.00"
formatMoney(-50000, "GBP", "GB"); // → "-£500.00"
```

The locale is derived from `countryCode` via a small lookup (`localeByCountryCode` — `GB → en-GB`). Adding another country / currency requires three changes that all live inside [`lib/affordability/`](./lib/affordability/): widen the literal unions in `types.ts` (`Currency`, `CountryCode`), add the locale entry in `format.ts`, write a Drizzle migration to widen the column constraint if you want to enforce the new value at the DB level. The Server Action and the formatter never `pence / 100` outside `formatMoney`; the integer-pence invariant is asserted by **T50** across every persona fixture.

### Create a time-limited share link (R12, S11)

On the dashboard or any history row, click "Generate share link". The `createShareLinkAction` Server Action (`src/app/(main)/dashboard/share/actions.ts`):

1. Validates the persona cookie via `getPersonaById(personaId)` (cookie absent / empty / not-a-persona all return the same generic typed error — three sub-cases per **T58**).
2. Confirms ownership: `snapshot.customerId === personaId` (cross-persona AND non-existent snapshot id return the **same** generic error — **T57**).
3. Generates a 32-byte random token, base64url-encodes the raw form (URL-safe; lives only inside the returned URL), and SHA-256-hashes it for storage.
4. Inserts one row in `share_links` with `expires_at = nowUtc() + 24h` (the clock indirection lives in [`lib/share/clock.ts`](./lib/share/clock.ts) so tests can pin time deterministically — **T55**).
5. Returns `/share/<rawToken>`. The Client Component (`<ShareSnapshotForm />`) composes the absolute URL on mount (`${window.location.origin}${path}`) and exposes a "Copy link" button with `navigator.clipboard.writeText` and a progressive-enhancement fallback for older browsers / non-secure contexts.

The raw token is **never persisted** — `tests/s11/t56-action-happy.test.ts` does an anywhere-in-DB scan to verify.

### Share-link expiry behaviour

A link is valid for **24 hours** from mint. After that, opening it shows the same `<ShareUnavailable />` page and the same response headers as if the token had never existed — `resolveShare(token, now)` (`lib/share/resolve.ts`) collapses three miss arms into a single `null`:

1. **Unknown** — no `share_links` row matches the SHA-256 hash of the supplied token.
2. **Expired** — a row exists but `expires_at <= now`.
3. **Snapshot-row-missing** — the row exists and is unexpired, but its `snapshot_id` no longer resolves (e.g. the snapshot was hard-deleted out-of-band).

In all three cases the recipient sees `<ShareUnavailable />` with byte-identical copy and headers. **T60** asserts cross-arm `=== null`. The page emits `Cache-Control: no-store, private` + `X-Robots-Tag: noindex, nofollow` via [`middleware.ts`](./middleware.ts) (Next.js 16 Server Components cannot set response headers, so the load-bearing assertion is at the middleware unit — **T61**). [`public/robots.txt`](./public/robots.txt) also disallows `/share/`, but this is advisory; the header is the real signal.

There is **no single-use enforcement, no revocation UI, and no per-IP / per-persona rate limit** in the stretch — these are recorded as production-hardening items in [`DECISIONS.md`](./DECISIONS.md).

### Export a PDF (R13, S12)

On the dashboard or any history row, click "Download PDF". The link points at `/dashboard/snapshot/<id>/pdf`, a Route Handler at [`src/app/(main)/dashboard/snapshot/[id]/pdf/route.ts`](./src/app/(main)/dashboard/snapshot/[id]/pdf/route.ts) that:

1. Runs with `export const runtime = 'nodejs'` (Node-only because `@react-pdf/renderer` calls into `@react-pdf/pdfkit` for stream-to-buffer accumulation).
2. Validates the persona cookie via `getPersonaById(personaId)` — three sub-cases per **T71**, returns `403 Forbidden` before any DB read.
3. Confirms ownership — cross-persona AND missing-snapshot-id return byte-identical `404 Not Found` with identical `Content-Type` / `Content-Disposition` / `Cache-Control` headers (**T70**, side-channel parity).
4. On the happy path, calls `renderSnapshotPdfToBuffer(snapshot)` (a tiny wrapper in [`lib/pdf/render.tsx`](./lib/pdf/render.tsx) over `@react-pdf/renderer`'s top-level `renderToBuffer(<SnapshotPdf snapshot={snapshot} />)`).
5. Streams the buffer with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="financial-snapshot-YYYY-MM-DD.pdf"`, `Cache-Control: no-store, private`. The handler logs only `pdf: rendered` (no IE digits, no persona id, no snapshot id, no IE labels — **T74**).

The PDF document is twelve sections (wordmark, snapshot date, currency / country, totals, band text-label, reasons, income breakdown, expenditure breakdown, support signpost copy block + `/support` URL, framing notice body) — see [`lib/pdf/SnapshotPdf.tsx`](./lib/pdf/SnapshotPdf.tsx). Money strings cannot drift between the dashboard and the PDF: **T73** renders `<DashboardView />` for `jordan` and asserts that the dashboard's income / expenditure / `formattedJordanDisposable` strings appear verbatim in the extracted PDF text. **T75** spies on `fs.writeFileSync` / `appendFileSync` / `createWriteStream` + `fs.promises.writeFile` / `appendFile` and confirms zero calls during a full GET — the PDF is never persisted.

`@react-pdf/renderer@4.5.1` is pinned exact (no caret) in [`package.json`](./package.json); per the standing tech-spec D-152 verification list, the version was confirmed against the installed `node_modules` (no Chromium binary, no Puppeteer / Playwright dependency, `renderToBuffer` exported from the package root). Tagged-PDF semantic structure (WCAG SC 1.3.1 / 1.3.2) is **not** delivered — recorded under production-hardening in [`DECISIONS.md`](./DECISIONS.md).

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
| `.data/financial-health.sqlite` | The SQLite DB file (two tables: `snapshots`, `share_links`) | **No** — gitignored. Auto-created on first request. Delete it to reset state. |
| `drizzle/0000_naive_groot.sql` | The MVP `snapshots` table + `(customer_id, taken_at DESC)` index | **Yes** |
| `drizzle/0001_s10_currency_country.sql` | Stretch — adds `currency TEXT NOT NULL DEFAULT 'GBP'` + `country_code TEXT NOT NULL DEFAULT 'GB'` columns to `snapshots` | **Yes** |
| `drizzle/0002_s11_share_links.sql` | Stretch — creates `share_links` (FK on `snapshot_id`, unique on `token_hash`, named index `idx_share_links_token_hash`) | **Yes** |
| `lib/db/` | Schema, migrate runner, seed function, snapshot + share-link repositories (the only modules that touch SQLite) | **Yes** |
| `lib/share/` | Token generation, SHA-256 hashing, clock indirection, miss-arm-collapsing resolver | **Yes** |
| `lib/pdf/` | Pure-React `<SnapshotPdf />` document + `renderSnapshotPdfToBuffer` wrapper | **Yes** |
| `lib/personas.ts` | The seven persona fixtures — fictional names and synthetic £-values only | **Yes** |

**To reset persona / DB state**: stop the dev server, delete `.data/`, restart. The next request re-runs all migrations (in order) and re-seeds.

**Data-minimisation posture (R10)**: the application logs only lifecycle events (`db: opened`, `db: migration applied`, `pdf: rendered`); it never logs I&E values, customer ids tied to row contents, earner / expenditure labels, raw share tokens, token hashes, or snapshot ids. The S2 / S5 / S10 / S11 / S12 logging-hygiene tests (T12, T20, T51, T67, T74) protect this at the application-code layer.

A known limitation: `/share/<rawToken>` and `/dashboard/snapshot/<id>/pdf` URLs will appear verbatim in any reverse-proxy / CDN access log. This is recorded as a production-hardening item in [`DECISIONS.md`](./DECISIONS.md) and as a tech-spec §5 trade-off ("S11 + S12 access-log limitation under R10").

---

## How the codebase is organised

```
app code                                       tests
────────────────────────────────────           ──────────────────────────────────
src/app/                                       tests/
  layout.tsx (root html / body / fonts)          _fixtures/   shared synthetic IE + snapshots
  globals.css                                    _helpers/    makeDb, withPersonaCookie, pdfText, …
  (main)/                                        s1/          T1–T8, T29 calculator + copy
    layout.tsx (carries <AppHeader />)           s2/          T9–T12 repository
    page.tsx (persona picker)                    s3/          T13–T14 personas + cookie
    actions.ts (selectPersona, switchPersona)    s4/          T21–T23, T33–T34, T44–T45
    dashboard/page.tsx                           s5/          T18–T20, T24–T25, T35–T38
    dashboard/update/{page,actions}.tsx          s6/          T26–T28, T39
    dashboard/share/actions.ts                   s7-setup/    T30, T31 harness smoke
    dashboard/snapshot/[id]/pdf/route.ts         s9/          T28, T32, T43 framing
    history/page.tsx                             s10/         T46–T51 currency / country / formatMoney
    support/page.tsx                             s11/         T52–T67, T76 share link
  (share)/                                       s12/         T68–T75 PDF export
    layout.tsx (no <AppHeader />)
    share/[token]/page.tsx                     drizzle/       committed SQL migrations
                                                 0000_naive_groot.sql
components/                                      0001_s10_currency_country.sql
  AppHeader.tsx, AppHeaderClientRegion.tsx       0002_s11_share_links.sql
  DashboardView.tsx
  UpdateForm.tsx ('use client')                middleware.ts (project root)
  HistoryList.tsx                                emits cache + robots headers on /share/*
  FramingNotice.tsx (R20)
  SupportSignpost.tsx (R7)                     docs/
  SharedStatementView.tsx, ShareUnavailable.tsx   PRD.md, TECH_SPEC.md, TEST_PLAN.md
  ShareSnapshotForm.tsx ('use client')           ai/sessions/SNNN-*.md
  DownloadPdfLink.tsx                            discovery/NOTES.md
  BackToDashboardLink.tsx                        PROMPT_HISTORY.md

lib/                                           .data/                  gitignored SQLite file
  affordability/  pure domain + formatMoney    .specstory/history/     raw transcripts
  db/             SQLite + Drizzle             .rulesync/              AI workflow source-of-truth
  identity/       persona cookie               AGENTS.md               Next.js 16 note for agents
  personas.ts     7 fixtures                   public/robots.txt       advisory /share/ disallow
  update/         form parse + copy
  dashboard/      delta computation
  share/          token + clock + resolver + recipient copy
  pdf/            <SnapshotPdf /> + renderSnapshotPdfToBuffer
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
| 3 | Technical specification | [`docs/TECH_SPEC.md`](./docs/TECH_SPEC.md) | Committed (S1–S9, S7-setup; S10 / S11 / S12 stretch addendum at rev 5.1) |
| 4 | Test plan | [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md) | Committed (T1–T76; T15–T17 reserved) |
| 5 | Controlled implementation | source code + tests | S1–S6, S7-setup, S8, S9 shipped; S019 added a non-feature UI polish pass; **S10 / S11 / S12 stretch slices all delivered** (S023 / S024 / S025) |

Slice-by-slice traceability is in `docs/TECH_SPEC.md` §7 and `docs/TEST_PLAN.md` §7.

---

## Accessibility

The sync presentational components — `<DashboardView />`, `<UpdateForm />`, `<HistoryList />`, `<SupportSignpost />`, `<FramingNotice />`, `<SharedStatementView />`, `<ShareUnavailable />`, `<ShareSnapshotForm />` — are designed to **WCAG 2.2 AA** (per `docs/TECH_SPEC.md` §5 trade-off "WCAG conformance level"). `vitest-axe` runs against each in pristine and error states (T34 / T37 / T39 / T44 / T32 / T64 / T65 / T66). Manual visual checks for SC 1.4.10 (reflow at 400 % zoom / 320 CSS-px viewport) are part of the reviewer walkthrough — automated reflow coverage is intentionally out of scope for the take-home (TEST_PLAN §6).

The S019 polish pass preserves these commitments: `<AppHeader />` is **not sticky** (so SC 2.4.11 Focus Not Obscured stays satisfied by construction); every `lucide-react` icon is `aria-hidden` and paired with visible text; the radio-card persona picker uses a real `<fieldset>` / `<legend>` / `<input type="radio">` structure rather than custom click handlers.

The S11 share form (`<ShareSnapshotForm />`) uses a real `<button>` + `<input readOnly>` pair with `aria-describedby` to the expiry date, a `min-h-10 min-w-[6rem]` "Copy link" button (≥ 24 × 24 CSS-px target — SC 2.5.8), and a polite `<output>` live region for the "Copied" / fallback announcement. The S12 PDF surface — being a separate document format — does **not** carry tagged-PDF semantic structure (SC 1.3.1 / 1.3.2 carry-out per tech-spec §5 "S12 no tagged-PDF"); the HTML surfaces remain the accessible primary surface.

---

## Out of scope (deliberately not built)

The following are listed here so a reviewer doesn't go hunting for them. The full rationale is in `DECISIONS.md` (production-hardening section) and `docs/TECH_SPEC.md` §5 / §6 / `docs/PRD.md` §5 (non-goals N1–N8).

### Excluded by PRD non-goals

- **Real authentication / Open Banking / credit-bureau integration** — N1.
- **Repayment-plan selection / arrangement booking / collections workflow / agent UI** — N2 / N3 / N4.
- **Automated vulnerability classification** — N5; users self-declare via the signpost.
- **Email / SMS / CRM / payments** — N6.
- **Multi-language UI** — N7.
- **Independent verification of FCA / GDPR paraphrases** — N8.

### Production-hardening items the stretch slices deferred

These are *delivered* in the take-home but would need more work before production. Each links back to the tech-spec §5 trade-off where the deferral is recorded:

- **S11 single-use enforcement** — a share token can be reopened until expiry. (Tech-spec §5 "S11 single-use deferred".)
- **S11 revocation UI** — no "Revoke link" surface; `share_links.id` is reserved as the future revocation handle. (Tech-spec §5 "S11 revocation deferred".)
- **S11 rate limiting** — no per-IP / per-persona throttle on mint or resolve. (Tech-spec §5 "S11 rate limiting deferred".)
- **S11 wire-layer timing parity** — the three resolver miss arms emit the same response body and headers, but timing-side-channel parity is not enforced. (Tech-spec §5 "S11 same-response posture …".)
- **S12 tagged-PDF / WCAG SC 1.3.1 / 1.3.2 semantic structure** — `@react-pdf/renderer` does not emit tagged PDFs; the HTML surfaces remain the accessible-primary surface. (Tech-spec §5 "S12 no tagged-PDF".)
- **Infrastructure access-log hygiene under R10** — `/share/<rawToken>` (S11) and `/dashboard/snapshot/<id>/pdf` (S12) URLs will appear in any reverse-proxy / CDN access log. Application-level `console.*` spies cannot reach that layer. (Tech-spec §5 "S11 + S12 access-log limitation under R10".)

### Test-discipline carry-outs

- **E2E tests (Playwright / Cypress)** — out for MVP per TEST_PLAN §6; manual walkthrough is the integration signal.
- **Async Server Component `page.tsx` integration** — Vitest cannot render async Server Components; pages are I/O glue exercised by manual reviewer walkthrough.
- **400 % zoom / 320 CSS-px reflow (WCAG SC 1.4.10)** — verified by manual visual check; not by `vitest-axe`.
- **`useActionState` end-to-end form-action runtime** — `<UpdateForm />` and `<ShareSnapshotForm />` inject error / action state via props rather than driving the React runtime end-to-end (T24 / T25 / T66).

---

## Licence

This repository is a take-home submission and is not licensed for redistribution.
