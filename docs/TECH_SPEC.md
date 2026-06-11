# Customer Financial Health — Technical Specification

> **Phase:** Tech spec
> **Inputs consumed:** `docs/PRD.md` (R1–R20), `docs/discovery/NOTES.md` (§6 OQ-5 SQLite direction; §6 OQ-6 persona schema), `AGENTS.md`, `node_modules/next/dist/docs/01-app/` (Next.js 16 App Router conventions, Server Functions, Vitest guide, async `cookies()`/`headers()` ramifications), the S007 critic review of the prior tech-spec draft.
> **Gate criteria for next phase (`/test-plan`):**
> - Every `Must` requirement in `docs/PRD.md` (R1–R4, R14–R17) maps to at least one `S*` slice in §7 (Traceability table).
> - Every `S*` slice cites at least one `R*` ID.
> - All architecturally-blocking PRD open questions (Q1–Q5) are either resolved here or carried under §6 **Open questions** with their impact named.
> - Data shape for `Snapshot` and `IncomeAndExpenditure` is concrete enough that `/test-plan` can write `T*` cases against it without further design.
> - Page-vs-Component split is explicit for every route, so `/test-plan` knows which surface is async-I/O and which is sync-render.
> **Status:** Draft (revision 5.1 — append-only S021-fix round applied after a second `@critic` pass on revision 5. Edits live inside S2 / S10 / S11 / S12 / §7 only; PRD is unchanged; MVP design in S1 / S3–S9 and §2 architecture are unchanged; implementation code is unchanged. **Critic findings closed (all 14 — 1 Blocker, 7 should-fixes, 6 nits):** **F1.1 (Blocker)** — S11 "Cache / indexing posture" now names `middleware.ts` matched on `/share/*` as the response-header origin (Server Components cannot set response headers per `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/headers.md`); the S11 test row now asserts against the middleware unit directly with structural header-parity across the four arms (no per-arm HTTP test needed). **F1.2** — `resolveShare(token, now): Promise<Snapshot | null>` declared in S11 body at `lib/share/resolve.ts`; the page delegates to it and the three miss arms (unknown / expired / snapshot-row-missing) collapse to a single `null`. **F1.3** — `<AppHeader />` codified in S11 as a pre-existing surface (not retro-added to an MVP slice); the pathname assertion is narrowed to subtree-scoped (`<SharedStatementView />` / `<ShareUnavailable />` + `(share)` layout). **F1.4** — `getPersonaById(id): Persona \| undefined` declared in S11 body as an additive extension to `lib/personas.ts` (same pattern as `getSnapshotById` on `lib/db/snapshots.ts`). **F1.5** — closes downstream of F1.1 via the middleware-unit test rewrite. **F1.6** — cache / indexing posture explicitly recorded as a R10 + R12 joint broadening (conscious reading; mirrors R20 / R7 pattern); §7 R10 row extended. **F1.7** — AppHeader posture recorded as the same R10 + R12 joint broadening; §7 R10 row extended. **F1.8** — conditional-render enforcement shape dropped; route-group separation (`app/(share)/...`) is now the only acceptable shape. **F1.9** — `withPersonaCookie(null)` sub-case reframed as "cookie absent" (helper not called) to match the S7 helper semantics, plus an empty-string and a not-a-persona sub-case. **F1.10** — §7 R6 row extended to list S12 (PDF reuses S1 + S9 strings; tone-token guard inherits coverage). **F1.11** — S7 S2-logging-hygiene row rewritten from "any character of the resolved DB path" to "the resolved DB path as a substring". **F1.12** — S12 PDF scope-note adds tagged-PDF structure to its exclusion list. **F1.13** — S11 persona-validation test row drops the vacuous "or `snapshots`" assertion. **F1.14** — `share_links.id` annotated as the reserved future revocation handle (deferred per §5). The S021-base edits below (revision 5 closures (i)–(ix)) are unchanged. — Closes: (i) S12 PDF API wording updated to `@react-pdf/renderer`'s documented Node helper `renderToBuffer(<SnapshotPdf />)` (with `renderSnapshotPdfToBuffer` as the local wrapper) and the PDF Route Handler now pins `export const runtime = 'nodejs'`; (ii) S11 + S12 persona-cookie reads validated through `getPersonaById()` — missing or invalid id is rejected with no DB write (S11) and no PDF generation (S12); (iii) S11 resolver flow explicitly handles "share link resolves but the linked snapshot row is missing" by rendering the same `<ShareUnavailable />`; (iv) S11 cache / indexing posture: `/share/[token]` is dynamic and non-cacheable, shared and unavailable responses send `Cache-Control: no-store, private`, and shared pages send `X-Robots-Tag: noindex, nofollow` (+ matching meta); (v) S11 `AppHeader` posture made explicit — `/share/[token]` must not render persona-aware navigation; **revision 5.1 / F1.8 narrows the enforcement shape to a single acceptable form: route-group / layout separation under `app/(share)/...`** (the conditional-render-inside-`<AppHeader />` alternative the revision-5 draft accepted was dropped because it left a behavioural seam an `<AppHeader />`-prop regression could re-open); (vi) S2 logging-hygiene wording removes the `db: opened path=<path>` example and pins it to `db: opened local sqlite database` (or no DB-open log); (vii) S11 clock control made explicit — a small `lib/share/clock.ts` `nowUtc()` helper plus fake-timers for the expiry tests; (viii) S10 records that `formatMoney`'s `pence / 100` divide is **display-only** — affordability calculations remain integer-pence arithmetic; (ix) S12 test notes record that PDF tests assert required content presence, not exact layout or line wrapping. Revision 4 — append-only stretch addendum from S020: adds S10/S11/S12 design for R11/R12/R13 + R19 test-discipline; existing S1–S9 sections, §2 architecture, and the MVP-scope §6 lines are unchanged. **Post-S020 `@critic` round applied (no PRD changes):** R20/R7 placement on shared-statement and PDF surfaces is now an explicitly-recorded conscious reading; `<ShareUnavailable />` no longer renders `<FramingNotice />` (no outcome on the page); R10 logging-hygiene scoped to application code with the URL-in-access-log limitation acknowledged; S11 "ownership check" reframed under N1; coercion / forwarded-under-pressure risk recorded as a flagged suspicion; `@react-pdf/renderer` "lightweight" claim tagged for `/implement S12` verification. Revision 3 — incorporates S007 round-2 critic findings F1.1–F9.3; closes the slice-ordering and WCAG 2.2-specific-SC gaps found in revision 2)

---

## 1. Overview

A Next.js 16 App Router web app, server-rendered, with file-based SQLite (via Drizzle ORM) storing per-customer **immutable snapshots** of an Income & Expenditure (I&E) submission and the affordability outcome computed from it. The customer picks one of seven mock personas (no real authentication — `NOTES.md` §6 A-2), is taken to a dashboard that shows the **affordability surface** (disposable income, band, plain-language reasoning, delta vs previous snapshot, persistent signpost to human support, and an always-visible reflection-not-advice framing per R20), and can submit a new I&E payload or browse all previous snapshots. Every route is structured as a thin async `page.tsx` (I/O — cookie read, DB read, prop assembly) wrapping a sync presentational component (`<DashboardView />`, `<UpdateForm />`, `<HistoryList />`) so the latter can be unit-tested with Vitest + `@testing-library/react` without the async-Server-Component limitation called out in `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`. All calculation runs server-side; the client only renders. The smallest design that satisfies R1–R10 and R18–R20 plus the submission requirements R14–R17 without speculative abstractions.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  app/  (Next.js 16 App Router — every page.tsx is async I/O only)    │
│                                                                      │
│   route                page.tsx (async)         renders (sync)       │
│   ──────────────────   ──────────────────────   ────────────────────  │
│   /                    read cookie → list    →  <PersonaPicker />    │
│   /dashboard           cookie + latest+prev  →  <DashboardView />    │
│   /dashboard/update    cookie + latest       →  <UpdateForm />       │
│   /history             cookie + all          →  <HistoryList />      │
│   /support             —                     →  <SupportSignpost />  │
│                                                                      │
│   actions.ts  ('use server')  Server Action handler for /update      │
└──────────────────────────────────────────────────────────────────────┘
            │ pages call libs;                          │ components
            │ components are pure-render only           │ tested with
            ▼                                           ▼ Vitest + RTL
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│  lib/affordability/             │   │  components/                    │
│    types.ts                     │   │    DashboardView.tsx (sync)     │
│    calculator.ts  (pure)        │   │    UpdateForm.tsx    (client)   │
│    validation.ts  (zod)         │   │    HistoryList.tsx   (sync)     │
│    copy.ts        (outcome →    │   │    FramingNotice.tsx (S9, R20)  │
│                    plain text)  │   │    SupportSignpost.tsx          │
│    framing.ts     (R20 copy)    │   └─────────────────────────────────┘
└──────────────┬──────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  lib/db/                                                             │
│    schema.ts      (Drizzle table definitions)                        │
│    client.ts      (better-sqlite3 + Drizzle, lazy-init, migrate)     │
│    snapshots.ts   (repository: create / list / latest)               │
│  drizzle/         (generated SQL migrations, committed)              │
│  .data/           (SQLite file, gitignored, auto-created)            │
│  lib/identity/persona-cookie.ts  (async get/set via next/headers)    │
│  lib/personas.ts                  (7 persona fixtures)               │
└──────────────────────────────────────────────────────────────────────┘
```

**Module responsibilities:**

- `lib/affordability/` — pure domain. No I/O, no React, no Next.js. Owns the calculation, the validation schema, the plain-language outcome copy, and the R20 framing copy. Fully unit-testable in isolation (R4).
- `lib/db/` — persistence boundary. The only module that touches SQLite. Every other module receives plain TypeScript objects, never ORM rows. Keeps the swap-the-store door open without designing for it.
- `lib/identity/` + `lib/personas.ts` — mock-auth seam. Persona id is read from a cookie set on `/`. The cookie API in Next.js 16 is async (`await cookies()`); pages await it, but the presentational components never touch cookies. No PII flows here (the personas are fictional).
- `app/<route>/page.tsx` — async I/O only. Awaits `cookies()`, calls the repository, computes any derived values, and passes plain props to its sibling presentational component. **Pages are not directly unit-tested**; they are the integration seam exercised by manual review and (if added later) Playwright.
- `components/*.tsx` — sync presentational components. Pure React, props-in / DOM-out, no awaited calls, no `cookies()`/`headers()` reads. **These are the unit-test surface** for render assertions (S7).
- All mutations are `'use server'` Server Actions per Next.js 16 (`node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`). The action handler is a plain async function — testable by calling it with a `FormData` fixture, no HTTP layer needed.

---

## 3. Implementation slices

Each `S*` is sized to land in one `/implement` session together with its tests. **Slice IDs are stable labels (append-only); they are not the implementation sequence.** The numeric order S1 → S9 reflects the order in which slices were authored, not the order they should be built.

**Recommended implementation order** (each subsequent slice imports only from earlier ones):

`S7-setup` → `S1` → `S2` → `S3` → `S9` → `S4` → `S5` → `S6` → `S8`

Where:

- **S7-setup** is the framework-only half of S7 (Vitest config, `vitest-axe`, scripts, shared helpers under `tests/_helpers/`). It must ship first because S1's tests depend on it. The rest of S7 (the coverage-matrix contract) is a documentation artefact that every per-slice `/implement` session honours as it ships its own tests.
- **S9** ships before **S4** because `<DashboardView />` (S4) and `<HistoryList />` (S6) render `<FramingNotice />` (owned by S9). Building S4 without S9's component in place would leave the spec's render assertions failing.
- **S8** is intentionally last so the README / DECISIONS.md reflect what actually shipped; it can also be re-run between earlier slices to keep the README accurate.

### S1 — Affordability domain (pure)

**Requirements:** R1, R5 (a, b, c, d as calculator branches), R8 (persona/IE schema), R9 (reasoning), R6 (tone via copy module), R10 (data minimisation — no logging)

**Design.** A pure TypeScript module at `lib/affordability/` exporting:

- **Types** (`types.ts`):
  ```ts
  type Money = number; // integer pence; we never store / compute in floats
  type EarnerIncome   = { label: string; amountPence: Money; cadence: 'monthly' };
  type ExpenditureLine = { label: string; amountPence: Money };
  type IncomeAndExpenditure = {
    earners: EarnerIncome[];          // 1 entry = solo; 2+ = joint-income (R8)
    expenditure: ExpenditureLine[];   // free list, summed; empty = no expenditure
  };                                  // no free-text fields — see §5 trade-off "Free-text note removed"
  type Snapshot = {
    id: string; customerId: string; takenAt: string; // ISO 8601 UTC
    ie: IncomeAndExpenditure;
    outcome: AffordabilityOutcome;    // denormalised — see below
  };
  type Band = 'surplus' | 'breakeven' | 'shortfall';   // PRD R1's three-value band schema
  type OutcomeState =
    | 'surplus' | 'breakeven' | 'shortfall'
    | 'zero-income'            // income = 0 — first-class outcome, distinct from shortfall
    | 'no-data';               // earners empty AND expenditure empty
  type AffordabilityOutcome = {
    state: OutcomeState;
    band: Band | null;                // null only for state === 'no-data' (no I&E → no band to compute; see §5 trade-off)
    totalIncomePence: Money;
    totalExpenditurePence: Money;
    disposableIncomePence: Money;     // income − expenditure (can be negative)
    reasons: string[];                // human-readable rationale lines (R9)
    irregularIncomeNote?: string;     // present when earners.length > 0 and any earner flagged variable (A3)
  };
  type Delta = { kind: 'first-snapshot' } | {
    kind: 'change';
    disposableDeltaPence: Money;      // current.di − previous.di
    bandChange: 'improved' | 'worsened' | 'unchanged';
    previousTakenAt: string;
  };
  type ValidationError = { field: string; message: string };
  ```

- **Calculator** (`calculator.ts`) — single entry point `assess(ie: IncomeAndExpenditure): AffordabilityOutcome` with this branch order (deterministic, so tests can pin every branch):

  | Order | Condition | Outcome state | Band | Notes |
  |---|---|---|---|---|
  | 1 | `earners.length === 0 && expenditure.length === 0` | `no-data` | `null` | R5(c); reasons: "We don't have any income or outgoings to assess yet." Band is `null` because there is no I&E to compute one from — see §5 trade-off "no-data band null". |
  | 2 | `totalIncome === 0` | `zero-income` | `shortfall` | R5(a); split from generic shortfall per S005 deferred F3.2; signposting copy in S4 is stronger here than for a numeric shortfall. |
  | 3 | `disposableIncome < 0` | `shortfall` | `shortfall` | R5(b); reasons cite the £ shortfall and the largest expenditure line. |
  | 4 | `disposableIncome === 0` | `breakeven` | `breakeven` | reasons cite "income exactly meets outgoings". |
  | 5 | otherwise (`disposableIncome > 0`) | `surplus` | `surplus` | reasons cite the £ surplus; if `disposable ≤ 5% * income`, append a near-breakeven note (refines Q1 / A1 without adding a fourth band). |

  All currency arithmetic in integer pence; **no floats** anywhere in calculation.

- **Validation** (`validation.ts`) — a `zod` schema for `IncomeAndExpenditure` covering R5(d):
  - `amountPence` must be `int().nonnegative()`; negative or non-numeric → `ValidationError` with field-level message (no dead-end, no stack trace).
  - `label` must be `string().trim().min(1).max(80)`.
  - No free-text fields outside `label` exist on `IncomeAndExpenditure` (see §5 trade-off "Free-text note removed").
  - Validation runs **inside** the Server Action (S5); errors render inline next to the field they reference.

- **Copy** (`copy.ts`) — one exported function per outcome state returning `{ headline, body, supportSignpost }`. Tone constraints enforced by a unit test fixture (S7): forbidden tokens include `must`, `now`, `urgent`, `failed`, `bad`, `wrong`, `should have`. Allowed tone modelled on supportive language (R6).

- **Framing copy** (`framing.ts`) — exports `framingNotice()` returning a single typed copy block used by S9's `<FramingNotice />` component (R20). Kept in the affordability module because it is the same domain — what the product *is* and *is not* — and because tests want to assert against it without rendering a component.

**Data hygiene (R10).** The calculator never calls `console.*` and never throws with the I&E payload in the message. Validation errors carry the **field name** only, not the value.

**What this slice does NOT do.** No persistence, no React, no routing. That's S2 and S4.

---

### S2 — Persistence layer (SQLite + Drizzle + migrations)

**Requirements:** R2, R3, R10, R4 (load-bearing — repository round-trip is the cheapest "test something real" target)

**Design.**

- **Driver:** `better-sqlite3` (synchronous, file-based, zero dependencies, fits Next.js server runtime).
- **ORM:** `drizzle-orm` + `drizzle-kit` for schema declaration and SQL-file migrations. Honours `NOTES.md` §6 OQ-5's "SQLite via a lightweight ORM" without the codegen footprint of Prisma.
- **File location:** `.data/financial-health.sqlite`, gitignored. Auto-created on first request via lazy init in `lib/db/client.ts`. Migrations applied on init (idempotent).
- **Schema** (single table for MVP):

  ```sql
  CREATE TABLE snapshots (
    id              TEXT PRIMARY KEY,          -- crypto.randomUUID()
    customer_id     TEXT NOT NULL,             -- one of the 7 persona ids
    taken_at        TEXT NOT NULL,             -- ISO 8601 UTC
    ie_json         TEXT NOT NULL,             -- JSON-serialised IncomeAndExpenditure
    outcome_state   TEXT NOT NULL,             -- denormalised for fast list rendering
    band            TEXT,                      -- nullable: no-data outcome has band = null (S1 type Band | null)
    income_pence    INTEGER NOT NULL,
    expenditure_pence INTEGER NOT NULL,
    disposable_pence INTEGER NOT NULL          -- signed
  );
  CREATE INDEX idx_snapshots_customer_taken
    ON snapshots (customer_id, taken_at DESC);
  ```

  Denormalising the outcome lets `/history` (S6) render a list without re-running the calculator per row, while `ie_json` keeps the source-of-truth payload for re-display.

- **Repository** (`lib/db/snapshots.ts`):
  ```ts
  createSnapshot(input: { customerId: string; ie: IE; outcome: AffordabilityOutcome }): Snapshot
  listSnapshots(customerId: string): Snapshot[]   // ordered newest → oldest (matches S6 / idx_snapshots_customer_taken)
  getLatestSnapshot(customerId: string): Snapshot | null
  ```
  All three return plain `Snapshot` objects (S1 type) — ORM rows do not escape this module.

- **Immutability (R2 / A5).** No `UPDATE` or `DELETE` paths exist in the repository. Corrections are simply additional `createSnapshot` calls (per A5). The schema does not enforce immutability at the SQL level (no need for a take-home).

- **Retention (A4).** Snapshots persist for the lifetime of the SQLite file. No TTL job, no soft-delete column. Out of scope per A4 + N8.

- **Data hygiene (R10).** Logging in this module is limited to `db: migration applied` and (optionally) `db: opened local sqlite database` — **no path string is emitted** (the file path can disclose the user's home directory on local dev or container internals in CI). No row contents, no IE payloads, no customer ids in log output. The S7 logging-hygiene assertion (S2 row) covers this: the spy scans for any character of the resolved DB path in addition to IE-value digits and customer-id strings. Implementations that prefer to suppress the open-line entirely are also acceptable — the contract is "no path leak", not "must log on open". Errors surface as typed `Error` with generic messages; the original error stays in the Node-side stack only.

---

### S3 — Persona fixtures + persona-cookie mock auth

**Requirements:** R8, plus the `NOTES.md` §6 A-2 mock-auth assumption

**Design.**

- **Fixtures** in `lib/personas.ts` — an exported `personas` array of 7 entries. Per-persona starting £-values (resolves S004 D-22 / S005 deferred F5.4 joint-income schema):

  | id | Label | Starting I&E (monthly, in pence) | Outcome on first visit |
  |---|---|---|---|
  | `pat` | Pat — comfortable surplus | earners: [{Pat, 320 000p}], expenditure: [Rent 110 000, Utilities 18 000, Food 35 000, Travel 12 000, Subscriptions 5 000] | surplus |
  | `sam` | Sam — small surplus near breakeven | earners: [{Sam, 195 000p}], expenditure: [Rent 95 000, Utilities 16 000, Food 32 000, Travel 9 000, Childcare 38 000] | surplus / near-breakeven |
  | `jordan` | Jordan — shortfall | earners: [{Jordan, 165 000p}], expenditure: [Rent 105 000, Utilities 18 000, Food 36 000, Travel 12 000, Loan 22 000] | shortfall |
  | `alex` | Alex — zero income this month | earners: [{Alex, 0p}], expenditure: [Rent 90 000, Utilities 15 000, Food 28 000] | zero-income |
  | `riley` | Riley — new customer | (no starting snapshot) | no-data |
  | `casey` | Casey — irregular income (gig) | earners: [{Casey, 150 000p, variable: true}], expenditure: [Rent 80 000, Utilities 14 000, Food 30 000, Travel 18 000] | surplus + irregular-income note (A3) |
  | `morgan-drew` | Morgan + Drew — joint household | earners: [{Morgan, 180 000p}, {Drew, 140 000p}], expenditure: [Rent 145 000, Utilities 22 000, Food 65 000, Childcare 40 000, Travel 18 000] | surplus |

  Values are illustrative and clearly synthetic per `.cursor/rules/10-evidence.mdc` "Sensitive data". The `variable: true` flag on a `casey` earner is read by S1's calculator to set `irregularIncomeNote` (A3).

- **Seeding.** On first request, `lib/db/client.ts` checks `snapshots` is empty; if so, it inserts the six personas that have a starting I&E (skipping `riley` who is the no-data persona).

- **Cookie mock-auth** (`lib/identity/persona-cookie.ts`):
  ```ts
  getPersonaId(): string | null             // reads cookie via next/headers
  setPersonaId(id: string): void            // sets HttpOnly cookie, SameSite=Lax, Max-Age=30d
  ```
  No password, no session token, no PII. The cookie is purely a persona selector. Middleware redirects unauthenticated visitors from `/dashboard*` and `/history` back to `/`.

---

### S4 — Affordability surface (dashboard)

**Requirements:** R1, R6, R7, R9, R18

**Design.**

- **Page** (`app/dashboard/page.tsx`) — async Server Component, I/O only:
  1. `await getPersonaId()` (S3). If `null`, `redirect('/')`.
  2. `await listSnapshots(personaId)` (S2). Take the last two for the delta calculation.
  3. Compose a `DashboardViewProps` object (persona summary, latest outcome, delta, framing copy).
  4. Render `<DashboardView {...props} />`. No DOM logic in the page itself.

- **Component** (`components/DashboardView.tsx`) — sync, props-only, no awaited calls. **This is the unit-test surface for R1 / R6 / R7 / R9 / R18.** Renders, in this order:
  1. Persona name + a "Switch persona" link to `/`.
  2. **Headline** — outcome state-specific copy from S1 (R1).
  3. **Disposable income** — formatted £/pence, with a sign indicator that uses `+` / `−` not "loss" / "gain" (R6 tone). Suppressed when `outcome.state === 'no-data'`.
  4. **Band chip** — accessible label, not colour-only (R18). Suppressed when `outcome.band === null` (no-data).
  5. **Reasoning panel** — the `reasons[]` list from S1 (R9). Bullet list, plain language, no formula.
  6. **Delta panel** — either the `first-snapshot` placeholder (A2) or a sentence "Your disposable income has changed by £X since *date*; your band is *improved/worsened/unchanged*."
  7. **Support signpost** (R7) — `<SupportSignpost />`, always present, copy + visual emphasis scaled to the outcome state. **Emphasis is conveyed by copy variant and font weight, not by colour alone** — keeps the signpost legible to users who cannot perceive the colour difference (R18, mirrors the band-chip rule).
  8. **Framing notice** (R20) — `<FramingNotice />` (owned by S9), rendered **inside** this View component (not on the host page) so the S7 framing-ubiquity test can assert presence by rendering `<DashboardView />` alone.
  9. Two primary actions: "Update my income & outgoings" (→ `/dashboard/update`) and "View past submissions" (→ `/history`).

- **Accessibility (R18) — WCAG 2.2 AA baseline** (resolves the conformance level S005 D-27 deferred). Concrete commitments for this component:
  - Single `<main>` landmark; `<h1>` for page title; one `<section>` per panel above with `aria-labelledby` referencing each panel's `<h2>`.
  - Band chip uses **text + icon**, never colour alone; contrast ratio ≥ 4.5:1 for normal text and ≥ 3:1 for the chip border, verified against the Tailwind tokens used.
  - All interactive elements reachable by keyboard in DOM order; visible focus ring on every focusable element (Tailwind `focus-visible:*` utilities).
  - Reflow at 400% browser zoom without horizontal scrolling (WCAG 2.2 AA SC 1.4.10 — content fits in a 320 CSS-px-wide viewport).
  - Respects `prefers-reduced-motion`: no movement on the delta indicator if the user has opted out.
  - The R18 a11y smoke test (S7) runs `axe-core` against `<DashboardView />` rendered with each persona's fixture.

---

### S5 — Snapshot submission flow + delta

**Requirements:** R2, R5(d), R6, R9, R10, R18, plus A2 (first-snapshot delta) and A5 (corrections-as-new-snapshot)

**Design.**

- **Page** (`app/dashboard/update/page.tsx`) — async Server Component, I/O only:
  1. `await getPersonaId()`. If `null`, `redirect('/')`.
  2. `await getLatestSnapshot(personaId)` to source the prefill.
  3. Render `<UpdateForm prefill={latest?.ie} action={updateSnapshotAction} />`.

- **Component** (`components/UpdateForm.tsx`) — Client Component (`'use client'`) for stateful field add/remove. Uses `useFormState` / `useActionState` to render server-returned validation errors inline. Field set:
  - One row per earner (label + monthly amount + optional `variable` checkbox); buttons add / remove rows. Default 1 row for solo personas, 2 for joint.
  - One row per expenditure line (label + monthly amount); buttons add / remove rows.
  - No free-text fields beyond the per-row `label` (see §5 trade-off "Free-text note removed").

- **Server Action** (`app/dashboard/update/actions.ts`, `'use server'`):
  1. `await getPersonaId()`; if missing, return `{ ok: false, errors: [{ field: '_', message: 'Please pick a persona first.' }] }` and let the form re-render with the message — no thrown error escapes.
  2. Parse `FormData` into the candidate `IncomeAndExpenditure`. The action handler is a plain async function — **tests call it directly with a `FormData` fixture; no HTTP layer is involved, so no MSW or fetch mock is required** (see §5 trade-off "No MSW").
  3. Validate via S1's zod schema. On failure, return `{ ok: false, errors: ValidationError[] }` and the page re-renders the form with field-level messages (R5(d) — never a dead-end).
  4. On success, call `assess(ie)` (S1), then `createSnapshot({ customerId, ie, outcome })` (S2).
  5. `revalidatePath('/dashboard')` + `revalidatePath('/history')`, then `redirect('/dashboard')` per Next.js 16 mutation guidance.

- **Delta rendering (resolves S005 deferred F5.2 — shape of the delta).** On `/dashboard`:
  - If `listSnapshots(personaId).length < 2` → `{ kind: 'first-snapshot' }` → `<DashboardView />` renders the A2 placeholder copy ("This is your first snapshot — we'll show how your position changes once you submit again.").
  - Otherwise, compare current vs immediately-previous snapshot and produce a `Delta { kind: 'change', disposableDeltaPence, bandChange, previousTakenAt }`. The UI renders a single sentence plus a small indicator for `bandChange`. We deliberately do **not** show per-line deltas in MVP — that would re-introduce complexity (per the persona's "no future-proof extension points" rule). Open to revisit if a reviewer asks.

- **Correction story (A5).** The "Update" form is also the correction flow. If a user spots an input mistake, they submit again; the new snapshot becomes the latest, prior snapshots remain visible in `/history`. We do **not** add a "this looks like a correction" affordance in MVP — A5 explicitly defers it and the persona rules against speculative UX hooks.

- **Accessibility (R18) — WCAG 2.2 AA commitments for the form:**
  - Every input has a programmatic `<label htmlFor>`; placeholders are not used as labels.
  - Earner rows are wrapped in a `<fieldset>` with a `<legend>` (e.g., "Monthly income"); expenditure rows likewise. Add / remove row buttons have explicit accessible names (`aria-label="Add another earner"`).
  - Amount inputs use `inputmode="decimal"`. `autocomplete="off"` is set on per-line amount fields because no SC 1.3.5 (Identify Input Purpose) token names "monthly amount for a specific household line item"; using a wrong-but-close token (e.g. `transaction-amount`) would worsen autofill behaviour. Per-earner amount fields use `aria-describedby` pointing to format hint text ("Pounds and pence, e.g., 1234.56").
  - **SC 3.3.7 (Redundant Entry, AA — new in WCAG 2.2):** when the action returns `{ ok: false, errors }`, the form re-renders with **all previously typed values preserved** (the `useActionState` payload is the source of truth; React preserves form state on re-render and any client-side row-state in `<UpdateForm />` survives). The customer never has to re-type anything to fix one bad field.
  - Validation errors render in an error summary at the top with anchor links to each invalid field; each field references its error text via `aria-describedby` and is marked `aria-invalid="true"`. The summary is given `role="alert"` and receives focus on submit-with-errors.
  - Required-vs-optional state is conveyed in text, not by colour or asterisk alone.
  - Reflow at 400% browser zoom; form remains usable at a 320 CSS-px viewport (SC 1.4.10).
  - All interactions reachable by keyboard (Add / Remove rows, Submit, Cancel); focus order matches DOM order; visible `focus-visible:*` ring on every focusable element. Target sizes meet SC 2.5.8 (≥ 24 CSS px — see §4 cross-cutting).

---

### S6 — History view

**Requirements:** R3, R7, R18, R20, A5

**Design.**

- **Page** (`app/history/page.tsx`) — async Server Component, I/O only:
  1. `await getPersonaId()`; `redirect('/')` if missing.
  2. `await listSnapshots(personaId)` — order: newest → oldest (resolves S005 deferred F5.3 — depth + order; depth = all snapshots in the lifetime of the record per A4).
  3. Render `<HistoryList snapshots={snapshots} />`.

- **Component** (`components/HistoryList.tsx`) — sync, props-only. Renders:
  - An empty state ("No submissions yet — add your first one") with a CTA link to `/dashboard/update` when the list is empty (covers `riley`-style first visits). The CTA is **not** a human-support signpost; the signpost (R7) is a separate element rendered below — see the next bullet.
  - Otherwise an `<ol>` of snapshot rows. Per row: a `<time dateTime>` element carrying ISO 8601 plus a human-readable relative phrase ("2 hours ago"), disposable income, band chip (suppressed for the no-data row, mirroring S4), outcome state label, and a `<details>/<summary>` disclosure that expands the stored `ie_json` rendered as a definition list (`<dl>` of label → £amount).
  - **`<SupportSignpost />`** rendered once at the bottom of the component (both empty and populated states). `/history` is an outcome surface — every snapshot row is an outcome — so R7's "every outcome screen" applies. Single placement (not per-row) avoids noise while still keeping the signpost visible without scrolling past the list.
  - **`<FramingNotice />`** rendered once at the very bottom of the component, after `<SupportSignpost />`. Inside the component (not the host page) so the S7 framing-ubiquity test asserts presence by rendering `<HistoryList />` alone.

- **Accessibility (R18) — WCAG 2.2 AA commitments for this component:**
  - The list is a true `<ol>` (preserves order semantics); each row is an `<li>` with a programmatic name.
  - `<time dateTime="…">` exposes the machine-readable ISO timestamp to assistive tech (relative phrase alone would be ambiguous).
  - `<details>/<summary>` is the native disclosure widget; no JS-only toggle. `<summary>` carries a descriptive name ("Show what was submitted on *date*") and meets SC 2.5.8 (≥ 24 CSS px target).
  - Definition lists (`<dl>` with `<dt>` / `<dd>`) for the IE breakdown so screen readers can navigate label↔value pairs.
  - Reflow at 400% zoom; visible focus rings on every disclosure and link; SC 2.4.11 (Focus Not Obscured, AA — new in WCAG 2.2) — no sticky bar covers a focused disclosure (the component has no sticky UI; if S8 adds one later, the SC re-applies). Same baseline as S4 / S5.

---

### S7 — Test infrastructure & shared coverage commitments

**Requirements:** R4 (and structurally R5, R6, R7, R8, R9, R10, R18, R20 — every other slice's tests run on the infrastructure this slice provides)

**Design.**

- **Framework:** Vitest + `@testing-library/react` + `jsdom`, per `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`. The same doc explicitly warns that Vitest does not support `async` Server Components; that constraint is what forces the page-vs-component split called out in §1 / §2 / S4–S6 — every render assertion in this spec targets a **sync** presentational component.
- **Config:** `vitest.config.mts` with `vite-tsconfig-paths` + `@vitejs/plugin-react`, `environment: 'jsdom'`. Add `test` and `test:watch` scripts to `package.json`. `vitest-axe` (axe-core wrapper for Vitest) supplies the a11y matcher.
- **Ships first.** Per §3's recommended implementation order, the framework half of S7 (config, scripts, helpers, `vitest-axe`) is the first thing built — before S1 — so every subsequent slice's tests have a runtime. The coverage-matrix half of S7 is documentation: each per-slice `/implement S<n>` honours the rows it owns when it ships.
- **Shared helpers** (under `tests/_helpers/`):
  - `makeDb()` — opens a fresh `better-sqlite3` instance against `:memory:`, runs Drizzle migrations, returns a typed repository. Each test gets its own DB.
  - `renderWithPersona(component, personaId)` — renders a sync component wrapped in whatever providers the app needs (currently none, but the helper exists so adding one later doesn't ripple).
  - `formData(record: Record<string, string>)` — builds a `FormData` object for testing Server Action handlers directly (the action is just an async function — no HTTP layer to mock; see §5 trade-off "No MSW").
  - `withPersonaCookie(personaId)` — installs a `vi.mock('next/headers', ...)` returning a stubbed `cookies()` that resolves to `{ get: (name) => name === 'personaId' ? { value: personaId } : undefined }`. Used by Server Action tests because the action calls `await getPersonaId()` which goes through `next/headers`. The mock is set up in a test-scoped `beforeEach`; teardown restores the real module.
  - `forbiddenToneTokens` — exported array used by tone-guard tests across `copy.ts`, `framing.ts`, and the S5 form copy strings (label text, button text, hint text). **The exact token list is illustrative in this spec; /test-plan finalises it.** The current shortlist is `must`, `now`, `urgent`, `failed`, `bad`, `wrong`, `should have` (tone) plus `recommend`, `advise`, `suggest you`, `you should` (R20 advice-implying); /test-plan may add or remove entries when it writes `T*` cases.

- **Test placement.** Per the persona, each `/implement S<n>` ships **its own tests** alongside its code. The coverage matrix below is the contract — when the test plan in phase 4 expands each row into a `T*` ID, the IDs are attached to the originating slice's `/implement` session, not to S7.

- **Coverage commitments** (test plan in phase 4 will assign `T*` IDs):

  | Target | What is asserted | Owning slice | Covers |
  |---|---|---|---|
  | Calculator branch matrix | One test per branch row in S1's table, for each of the 7 personas where applicable | S1 | R1, R5(a–c), R8, R9, A1 (near-breakeven note appended when `0 < disposable ≤ 5% × income`) |
  | Calculator integer-pence invariant | Property-style test: no floats in any returned field | S1 | R10 (numerical hygiene) |
  | Calculator no-data band null | `assess({ earners: [], expenditure: [] }).band === null` | S1 | R1 (3-band schema preserved), R5(c) |
  | Validation rejection | Negative, non-numeric, oversize-label inputs each return a typed `ValidationError`; no exception escapes | S1 | R5(d) |
  | Repository round-trip | `createSnapshot` + `listSnapshots` + `getLatestSnapshot` against `makeDb()` | S2 | R2, R3, R4 |
  | Repository logging hygiene | A spy on `console.*` during db open + 2 createSnapshot calls records zero IE-value digits, zero customer-id strings, and **zero occurrences of the resolved DB file path as a substring** of any captured log line (the assertion is a substring search on the path string in full, not a per-character membership check — resolves S021-fix F1.11; per S2 R10 the path can disclose the user's home directory on local dev or container internals in CI) | S2 | R10 |
  | Immutability check | After two `createSnapshot` calls, both rows still readable, order correct | S2 | R2, A5 |
  | Persona fixtures shape | All 7 personas parse against the IE schema; `riley` has no starting snapshot | S3 | R8 |
  | Server Action: happy path | Calling the action with valid `FormData` (via `formData()` helper) under `withPersonaCookie('jordan')` creates a snapshot, then triggers `redirect('/dashboard')` (assert via mocked `redirect`) and `revalidatePath` for `/dashboard` + `/history` | S5 | R2, R5(d) |
  | Server Action: invalid input | Same setup as above but with negative / non-numeric inputs; returns `{ ok: false, errors }`, no DB write happens, no `redirect` is called | S5 | R5(d), R10 |
  | Server Action: missing persona cookie | With `withPersonaCookie(null)`, the action returns a typed error and does not throw | S5 | R5(d) |
  | Server Action: flow logging hygiene | `console.*` spy during a full happy-path action invocation records zero IE-value digits | S5 | R10 |
  | `<DashboardView />` render | For each `OutcomeState`, renders headline + reasons + signpost + framing notice; band chip suppressed for `no-data`; disposable-income line suppressed for `no-data` | S4 | R1, R7, R9, R20 |
  | First-snapshot delta — placeholder render | When `delta.kind === 'first-snapshot'`, the A2 placeholder copy renders in `<DashboardView />` | S4 | A2 |
  | First-snapshot delta — shape | After exactly one `createSnapshot`, the page-level delta computation returns `{ kind: 'first-snapshot' }` (tested against the repository) | S5 | A2 |
  | `<UpdateForm />` render | Renders prefilled fields; error summary appears + receives focus when action returns errors; **previously-typed values survive an error re-render** (SC 3.3.7) | S5 | R5(d), R18 |
  | `<HistoryList />` render | Empty state for no snapshots; ordered list with `<time>` and `<details>` disclosures otherwise; `<SupportSignpost />` and `<FramingNotice />` both present in both states | S6 | R3, R7, R18, R20 |
  | Tone token guard | `copy.ts` output strings and the S5 form-copy fixture (`labels.ts` / `hints.ts`) contain none of `forbiddenToneTokens` (tone subset) | S1 + S5 | R6 |
  | Framing copy guard | `framing.ts` output contains the negation "not financial advice" (or equivalent disclaiming phrase) and contains none of the advice-implying tokens (`recommend`, `advise`, `suggest you`, `you should`) | S9 | R20, R6 |
  | Framing ubiquity | `<FramingNotice />` renders inside `<DashboardView />` and `<HistoryList />` (asserted by rendering each sync component standalone) | S9 | R20 |
  | Signpost ubiquity | `<DashboardView />` and `<HistoryList />` both render a `<SupportSignpost />` with a non-empty link in every state (including no-data, empty-history, and shortfall) | S4 + S6 | R7 |
  | a11y smoke | `vitest-axe` shows no violations against each sync component (`<DashboardView />`, `<UpdateForm />` in pristine + error state, `<HistoryList />` in empty + populated state, `<FramingNotice />`, `<SupportSignpost />`) | per-slice | R18 |

- **Deferred (intentionally out of MVP testing):** Async-page integration tests (`/dashboard/page.tsx` etc.) — covered by the manual reviewer walkthrough and by a future Playwright slice only if R12/R13 are picked up (R19 would then kick in). Recorded in §6 Out of scope.

- **No E2E framework** in MVP. The brief warns against over-engineering; the coverage above protects "the cases that actually matter" (brief line 102) without a Playwright runtime.

---

### S8 — Submission deliverables

**Requirements:** R14, R15, R16, R17

**Design.** Documentation-only slice, but it is a slice — `/implement S8` writes / refreshes these files together with whatever the most recent source-code slice produced, so the README's "how to run" instructions stay accurate.

- **`README.md` (R14)** at repo root. Sections: what this is, requirements (Node version, `pnpm`/`npm`), install → migrate → seed → `dev` / `test` / `build`, persona selector explanation, where the SQLite file lives (`.data/`), where AI history lives (`docs/ai/sessions/`, `.specstory/history/`), links to PRD / TECH_SPEC / TEST_PLAN / DECISIONS.
- **`DECISIONS.md` (R15)** at repo root. Sections: what was built (link to delivered `S*` IDs), what was left out (Stretches R11/R12/R13 if not delivered, plus any deferred `S*`), what is next, why those choices were made (links to PRD non-goals, this spec's §5 trade-offs, and the discovery §7(b) drops). 10–15 minutes per brief lines 86–88, kept lean.
- **Prompt history (R16)** is already satisfied by the existing `.specstory/history/` capture and the curated `docs/ai/sessions/` + `docs/PROMPT_HISTORY.md` chain (per the `ai-history` user rule). This slice's job is to **append the missing session rows** (S007 tech-spec, and any `/implement S*` sessions) and make sure no row is missing. No new tooling.
- **Time-spent note (R17)** — a short table in `DECISIONS.md` (`Phase | Sessions | Approx hours`) updated at the end of each session.

This slice is intentionally placed last so the documentation reflects what actually shipped; it can also be re-run between implementation slices to keep the README accurate.

---

### S9 — Reflection-not-advice framing

**Requirements:** R20, R6 (tone), R9 (clarity of what the result is and is not), R18 (the notice must be accessible)

**Design.** The smallest design that satisfies R20's "every outcome screen" commitment, without introducing a modal, an onboarding step, or a separate disclosure page.

- **Single source of truth** for the copy: `lib/affordability/framing.ts` exports one function — `framingNotice()` — returning a typed copy block of the form `{ headline: string; body: string; supportLink: { href: '/support'; label: string } }`. The body string carries the negation ("This is a reflection of the numbers you've given us — not financial advice") and points the customer at human support for advice they should not get from this product. Copy is reviewed against `forbiddenToneTokens` (tone subset) and against an R20-specific forbidden set: `recommend`, `advise`, `suggest you`, `you should`. **No abbreviated / single-sentence variant is exported** — R20 specifies one framing surface ("every outcome screen"), not progressive disclosure. Keeping a single copy artefact also keeps the framing-copy guard test (S7) trivial.
- **Single presentational component**: `components/FramingNotice.tsx` — sync, no props in MVP (the copy is the same on every render). Renders the block above as a sectioned `<aside>` with a programmatic landmark name via `aria-labelledby` ("About this assessment").
- **Placement** (resolves S007 round-2 F2.1 — R20's literal wording is "every outcome screen", not every screen). Outcome screens are `/dashboard` and `/history` — those are the only places the customer sees a computed affordability state:
  - `<DashboardView />` (S4) renders `<FramingNotice />` inside the component, as the last full-width panel above the primary actions.
  - `<HistoryList />` (S6) renders `<FramingNotice />` inside the component, once at the very bottom, after `<SupportSignpost />`.
  - **Not rendered** on `/` (the persona picker is not an outcome screen) or `/dashboard/update` (the form is not an outcome screen). If a future PRD revision broadens R20, S9's placement section is the right place to extend; no in-spec broadening here.
- **Accessibility (R18) — WCAG 2.2 AA commitments for `<FramingNotice />`:**
  - `<aside>` carries an explicit name via `aria-labelledby` pointing at the heading.
  - Body text meets the AA contrast ratio (≥ 4.5:1); visual subduing is via lower font weight and spacing, not by colour-against-near-background.
  - The support link is in the keyboard tab order with a visible `focus-visible:*` ring and meets SC 2.5.8's 24-CSS-px minimum target.
  - The notice is part of normal document flow (no sticky positioning) so SC 2.4.11 (Focus Not Obscured) is satisfied by construction.
- **What this slice does NOT do.** No modal, no overlay, no "I agree" gate, no analytics event, no per-user dismissal. Each of those would either be over-engineering or would risk turning the framing into a click-through chore, which would weaken R20's intent.

**Notes on the gate-crosses this slice closes.**

- The revision-1 draft inlined the same disclaimer as a footer paragraph in S4 under R6 + R9. The S007 round-1 critic flagged this as a workflow-rule-2 violation; PRD was revised append-only to add R20 and this slice now owns the design. See §5 trade-off "F4.3 routed to /prd (R20)".
- The revision-2 draft of this slice extended the placement to the persona-picker page and the update-form host page. The S007 round-2 critic (F2.1 / F1.1 / F2.2) flagged that as the same gate-cross pattern. Revision 3 narrows S9 to R20's literal wording; if a future need surfaces to set framing earlier, route back to `/prd` for an R21 (or an R20 amendment).

---

### Stretch slices (S10–S12, append-only addendum from S020)

The three Could-class requirements (R11, R12, R13) are designed below as `S*` slices. They follow the same "one `/implement` session" sizing as S1–S9 but **are spec-only** until a `/implement S10` (or S11 / S12) session is invoked. The MVP architecture in §2 is unchanged; each stretch slice extends an existing module without rewriting it. R19 is the cross-slice test-discipline requirement that attaches to whichever stretch is delivered.

Recommended ordering for stretches (each slice imports only from earlier ones, including MVP slices):

`S10 → S11 → S12`

S11 and S12 both rely on S10's `formatMoney` helper, `currency`, and `countryCode` to render figures correctly in shared statements and PDFs. S11 and S12 are otherwise independent of each other.

---

### S10 — Currency and country_code (stretch)

**Requirements:** R11, R19

**Design.**

- **Type extension** in `lib/affordability/types.ts`. `Snapshot` gains two fields, both literal-narrowed to the only values MVP/stretch ships:

  ```ts
  type Snapshot = {
    id: string; customerId: string; takenAt: string;
    currency: 'GBP';                // ISO 4217; only 'GBP' supported in MVP/stretch
    countryCode: 'GB';              // ISO 3166-1 alpha-2; only 'GB' supported in MVP/stretch
    ie: IncomeAndExpenditure;
    outcome: AffordabilityOutcome;
  };
  ```

  Loosening to plain `string` (or to a wider `Currency` union) is recorded in §5 trade-off "S10 currency type narrowing" — the take-home does not introduce a selector, so widening would invent surface area.

- **Drizzle migration** (single new file under `drizzle/`, applied lazy-on-init alongside the existing baseline migration in S2):

  - `ALTER TABLE snapshots ADD COLUMN currency TEXT NOT NULL DEFAULT 'GBP';`
  - `ALTER TABLE snapshots ADD COLUMN country_code TEXT NOT NULL DEFAULT 'GB';`

  SQLite back-fills every existing row with the column default at `ALTER TABLE` time — so previously-stored MVP snapshots become `GBP` / `GB` automatically without a separate data step. The migration is idempotent because Drizzle's migrator records the migration hash in `__drizzle_migrations` (S2's existing pattern); re-running on a fresh DB produces the same shape.

- **Schema changes** in `lib/db/schema.ts`. Two new Drizzle column declarations on the `snapshots` table; types exported via Drizzle's inference so the repository's `Snapshot` row type picks them up automatically.

- **Repository changes** in `lib/db/snapshots.ts`:
  - `createSnapshot(input)` accepts optional `currency` and `countryCode`; both default to `'GBP'` / `'GB'` when omitted, so existing call sites in `app/dashboard/update/actions.ts` (S5) compile unchanged.
  - `listSnapshots` and `getLatestSnapshot` return both fields on every plain `Snapshot` object.
  - The seeder (`lib/db/seed.ts`) lets the column defaults handle the new fields — no per-persona override.

- **Money formatting helper** in `lib/affordability/format.ts` (new module):
  - Signature: `formatMoney(pence: number, currency: 'GBP', countryCode: 'GB'): string`.
  - Body: derives a locale string from `countryCode` (`'GB'` → `'en-GB'` via a small lookup) and calls `Intl.NumberFormat(locale, { style: 'currency', currency }).format(pence / 100)`.
  - **Integer-pence invariant (R10 numerical hygiene — S1 contract preserved).** The `pence / 100` divide inside `formatMoney` is **display-only** — it lives inside the formatting helper and produces a `string` for rendering. **All affordability arithmetic stays in integer pence** (`totalIncomePence`, `totalExpenditurePence`, `disposableIncomePence`, the `Delta.disposableDeltaPence`, the near-breakeven `5% × income` comparison in S1 — all integer-pence). No call site outside `formatMoney` is allowed to divide a `*Pence` value by 100; doing so re-introduces float drift in the comparisons S1 makes. The S7 "Calculator integer-pence invariant" property-style row covers the calculator surface; the S10 test commitments (below) cover the helper's locale-aware output. If a future slice ever needs an integer pound-and-pence pair (e.g. for a CSV export), it should derive `pounds = Math.trunc(pence / 100)` + `remainderPence = pence % 100` inside the export module, not by floating-point divide.
  - Replaces the hard-coded `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })` call sites currently inlined in the MVP UI surfaces (`<DashboardView />` S4, `<UpdateForm />` S5, `<HistoryList />` S6) — the call-sites change but the per-component design notes in S4/S5/S6 are unchanged because the rendered string is the same for the only currency we ship.

- **Read sites that get the new fields for free.** `<DashboardView />`, `<HistoryList />`, the S11 shared statement, and the S12 PDF all read `snapshot.currency` / `snapshot.countryCode` instead of the hard-coded literal — so adding a real selector later is a one-place edit (the form + the type) rather than a sweep.

**Data hygiene (R10).** The new columns carry no PII (ISO codes only). No log lines reference them; the existing S7 logging-hygiene assertion does not need to extend (`/test-plan` decides whether the existing case is reused or a new case is allocated).

**Accessibility (R18).** No new UI surface — `formatMoney` returns the same locale-aware string the MVP already renders. The S4 / S6 contrast / focus / reflow commitments are unchanged.

**What this slice does NOT do.**

- No currency selector or country picker UI.
- No locale beyond `en-GB`. Multi-currency formatting paths would mean widening the type literals, adding a selector, and adding a tone-token review for currency-aware copy — out for stretch.
- No locale-specific date or number formatting changes elsewhere; only money formatting flows through the new helper.

**Tests (R19) — coverage commitments for the eventual `/implement S10` session:**

- **Migration applied.** Open a `:memory:` DB via `makeDb()` (S7), run all migrations, query the `snapshots` table schema, assert `currency` and `country_code` columns exist as `TEXT NOT NULL` with defaults `'GBP'` / `'GB'`.
- **Default backfill.** Insert a snapshot via `createSnapshot({...})` without specifying `currency` / `countryCode`; assert the returned plain `Snapshot` carries `currency: 'GBP'`, `countryCode: 'GB'`.
- **Repository round-trip.** Explicit `createSnapshot({ ..., currency: 'GBP', countryCode: 'GB' })` + `getLatestSnapshot` returns both fields; `listSnapshots` returns both fields on every row in newest-first order.
- **Format helper.** `formatMoney(123450, 'GBP', 'GB')` returns `'£1,234.50'`; `formatMoney(0, 'GBP', 'GB')` returns `'£0.00'`; negative pence renders with the locale's minus sign.
- **Existing render assertions still pass.** The S4 / S5 / S6 render tests run without modification because the on-screen string is identical.
- **Logging hygiene unchanged.** The S2 / S5 logging-hygiene tests still pass — no IE digits, no customer-id strings, no currency / country values appear in `console.*`.

---

### S11 — Secure time-limited statement sharing (stretch)

**Requirements:** R12, R19

**Design.** A customer can mint a 24-hour read-only link for any of their own immutable snapshots. The recipient opens the link in a browser (no login, no app install) and sees the same affordability surface as the dashboard, rendered read-only with the framing notice and a static support signpost. Minimal threat model recorded inline.

- **New persistence table** (new Drizzle migration, applied alongside the S2 baseline):

  ```sql
  CREATE TABLE share_links (
    id            TEXT PRIMARY KEY,             -- crypto.randomUUID(); reserved as the future revocation handle
                                                -- (deferred per §5 "S11 revocation deferred") so the
                                                -- column lands once and a revocation slice can DELETE / UPDATE
                                                -- by primary key without a schema change. Not exposed in the
                                                -- action's return shape today; not asserted by any T* row today.
    snapshot_id   TEXT NOT NULL REFERENCES snapshots(id),
    token_hash    TEXT NOT NULL UNIQUE,         -- SHA-256 hex of raw token; this is the lookup key the resolver uses
    expires_at    TEXT NOT NULL,                -- ISO 8601 UTC
    created_at    TEXT NOT NULL                 -- ISO 8601 UTC
  );
  CREATE INDEX idx_share_links_token_hash ON share_links (token_hash);
  ```

  `customer_id` is deliberately not stored on `share_links` — the join through `snapshot_id → snapshots.customer_id` is the customer scope. Keeps the table narrow and the leak surface smaller. The `id` column carries a forward commitment (the revocation handle above) so the deferred-revocation slice can land without a schema change; revocation itself is deferred per §5 trade-off "S11 revocation deferred".

- **Token model:**
  - The Server Action generates 32 bytes from `crypto.randomBytes(32)` and encodes them with `base64url` (~43 chars). The raw token is included **once**, in the URL returned to the caller, and is **never** persisted.
  - The DB stores `token_hash = sha256(rawToken).hex()`. A leaked DB does not yield usable links — an attacker would need to brute-force the SHA-256 preimage of a 32-byte token.
  - The lookup path computes the same SHA-256 hash on the incoming `[token]` segment and queries `share_links.token_hash`.

- **New Server Action** (`app/dashboard/share/actions.ts`, `'use server'`) — `createShareLinkAction(formData)`:
  1. `await getPersonaId()`. **Validate via `getPersonaById(personaId)` (S3 fixtures).** Missing **or** invalid (id present in cookie but not in the 7-persona fixture set — e.g. an old cookie from a renamed persona, a hand-crafted cookie value) → return `{ ok: false, errors: [{ field: '_', message: 'Please pick a persona first.' }] }`. **No DB write happens on this arm** — the function returns before touching the `share_links` or `snapshots` table. This closes the gap where an unknown but non-empty cookie value would have reached step 2 in the revision-4 wording.
  2. Read `snapshotId` from `FormData`. Look up `snapshots` by id; if no row OR `snapshot.customerId !== personaId`, return the **same** generic typed error message — no information leak about which IDs exist for other personas.
  3. Generate the 32-byte token, compute `token_hash`, insert one `share_links` row with `expires_at = nowUtc() + 24h`, `created_at = nowUtc()`, `id = crypto.randomUUID()` (see "Clock control" below for `nowUtc()`).
  4. Return `{ ok: true, url: '/share/' + rawToken, expiresAt }`. Caller renders the URL in a copy-to-clipboard input on the originating page.

- **New repository** (`lib/db/share-links.ts`):
  - `createShareLink({ snapshotId, tokenHash, expiresAt })` → `{ id, expiresAt }`.
  - `getShareLinkByTokenHash(tokenHash, now: Date)` → `{ snapshotId } | null`. The `now` parameter is injected so tests can pin the clock without mocking the global `Date`. Callers pass `nowUtc()` (see "Clock control" below) so a single mock surface covers both mint-time and resolve-time. Returns `null` for an expired row, the same as for a missing row — the resolver surface cannot distinguish.
  - `getSnapshotById(id)` is added to S2's existing `lib/db/snapshots.ts` repository (a small append; the existing `createSnapshot` / `listSnapshots` / `getLatestSnapshot` shapes are unchanged).
  - `getPersonaById(id: string): Persona | undefined` is added to S3's existing `lib/personas.ts` module (resolves S021-fix F1.4). Same additive-extension pattern as `getSnapshotById` above; the S3 fixture array shape and the `getPersonaId` / `setPersonaId` cookie-read pair are unchanged. `getPersonaById` is the validation surface used by S11's Server Action (step 1 below) and by S12's route handler — single source of truth for "is this cookie value an actual persona id, not a stale or hand-crafted string". `undefined` (not `null`) on miss so the call site can be `if (!personaId || !getPersonaById(personaId))` without an extra non-null assertion.

- **New token + resolver helpers** (`lib/share/token.ts` and `lib/share/resolve.ts`):
  - `generateShareToken(): { raw: string; hash: string }` — random 32 bytes + base64url + sha256-hex (in `lib/share/token.ts`).
  - `hashShareToken(raw: string): string` — sha256-hex; used by the resolver (in `lib/share/token.ts`).
  - **`resolveShare(token: string, now: Date): Promise<Snapshot | null>`** (in `lib/share/resolve.ts`) — single page-extracted helper that the `/share/[token]` page delegates to (resolves S021-fix F1.2). Implementation contract: `hashShareToken(token)` → `getShareLinkByTokenHash(hash, now)` → if `null` return `null`; otherwise `getSnapshotById(shareLink.snapshotId)` → if `null` (snapshot-row-missing arm) return `null`; otherwise return the `Snapshot`. **All three miss cases collapse to a single `null`** — the helper's caller (the page) cannot tell unknown-token from expired-token from snapshot-row-missing, which is what keeps the resolver's same-response posture (`<ShareUnavailable />` rendered identically) structural rather than convention-based. Unit-tested directly; the async Server Component page is the I/O glue that calls it and renders one of `<SharedStatementView snapshot={...} />` or `<ShareUnavailable />` on `null`.

- **New page** (`app/(share)/share/[token]/page.tsx`, async Server Component; routed under the new `(share)` route group per the `AppHeader` enforcement shape below — F1.8):
  1. `await params` (Next.js 16 — `params` is a `Promise`, see `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`).
  2. `const snapshot = await resolveShare(token, nowUtc())` (see "New token + resolver helpers" above and "Clock control" below). **The page never calls `hashShareToken`, `getShareLinkByTokenHash`, or `getSnapshotById` directly** — all three live inside `resolveShare`, which collapses unknown-token / expired-token / snapshot-row-missing to a single `null`. The page is async-I/O-glue only; the testable logic is the helper.
  3. If `snapshot === null`, render `<ShareUnavailable />` — a single page with a generic safe message ("This link is no longer available. Please ask the person who shared it to send a new one."). Same copy and same HTTP status (200) regardless of which miss arm fired (matches the trade-off recorded in §5 "S11 same-response posture (resolver) and same-error posture (mint) — separately"). The `<meta name="robots">` half is exported via `generateMetadata`; the `Cache-Control` / `X-Robots-Tag` headers come from the `middleware.ts` matcher on `/share/*` (see "Cache / indexing posture" above) so the page does not set them itself (and could not — see F1.1).
  4. Otherwise, render `<SharedStatementView snapshot={snapshot} />`.

- **Cache / indexing posture** (resolves S021 finding — explicit `Cache-Control` + crawler posture):
  - `/share/[token]` is **dynamic and non-cacheable.** The page reads request-specific data (the path param) and depends on `share_links` state; it must not be statically pre-rendered. **In Next.js 16, request-time access (`await params`, async DB call) makes the route dynamic by default**; the spec relies on that default rather than pinning `export const dynamic = 'force-dynamic'` (which would be a second guardrail if a future refactor introduced a static path). `/implement S11` adds the `force-dynamic` directive if it ships any caching primitive (e.g. `unstable_cache`) elsewhere in the slice.
  - Both `<SharedStatementView />` and `<ShareUnavailable />` responses set **`Cache-Control: no-store, private`**. Same header on both arms preserves the resolver's same-response posture against intermediate caches.
  - Shared pages send **`X-Robots-Tag: noindex, nofollow`** as an HTTP response header **and** include the corresponding `<meta name="robots" content="noindex, nofollow">` in the rendered HTML (the metadata is exported via Next.js 16's `generateMetadata` on the page). Together they keep search engines, social-card crawlers, and well-behaved archivers from indexing shared snapshots even if a token leaks into a referer or a screenshot. The `X-Robots-Tag` header is the load-bearing assertion (the meta tag is best-effort fallback for HTML-only readers).
  - The `/share` route is added to `robots.txt` as `Disallow: /share/` so well-behaved crawlers do not even request it. (Note: this is advisory only — see N1 / `<ShareUnavailable />` posture above for the actual leak surface.)
  - **Response-header origin — `middleware.ts` on `/share/*`** (resolves S021-fix F1.1; closes the previously-unspecified header-emission surface). In Next.js 16 a Server Component **cannot set outgoing response headers** — `next/headers` exposes the *inbound* request headers as a read-only handle (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/headers.md` is explicit: "Since `headers` is read-only, you cannot `set` or `delete` the outgoing request headers"). The S11 page (`app/(share)/share/[token]/page.tsx` under the route-group form pinned by F1.8) therefore **cannot** emit `Cache-Control` / `X-Robots-Tag` directly. The headers come from a single new entry in the project-root `middleware.ts` matched on `/share/*` (or `/share/:token*` — same surface; pick whichever matcher Next.js 16 prefers in the pinned version) that returns `NextResponse.next({ headers: { 'Cache-Control': 'no-store, private', 'X-Robots-Tag': 'noindex, nofollow' } })`. The middleware runs for both the happy-path render and every `<ShareUnavailable />` arm (unknown token / expired / snapshot-row-missing) because it matches on the route, not on the page's internal outcome — so header parity across the four arms is **structural**, not asserted by re-running an HTTP layer per arm. Cross-reference: S3's existing middleware seam at `/dashboard*` / `/history` (used for unauthenticated-redirect) is the same file; this slice adds one matcher entry, not a new file. The `<meta name="robots">` half stays on the page via `generateMetadata` (HTML-only-reader fallback).
  - **R10 / R12 conscious reading (closes F1.6).** The cache / indexing posture above (no-store + private + noindex + nofollow + robots disallow) is an explicit broadening of R10's "data minimisation" wording (PRD §3 R10 is scoped to application logs and error trackers) and R12's "secure" wording (PRD §3 R12 is silent on cache / crawler posture). We consciously read R10 + R12 **jointly** as covering "do not allow third-party caches, search engines, or social-card crawlers to retain shared content" — mirrors the R20 / R7 broadening pattern recorded at `<SharedStatementView />` below and on the PDF in S12. The §7 R10 row is extended to list this; if a future PRD revision wants to narrow the scope back, that is a `/prd` change and this subsection is the right place to revisit.

- **`AppHeader` behaviour on `/share/[token]`** (resolves S021 finding — `/share/` must not render persona-aware navigation):
  - `<AppHeader />` is a **pre-existing surface** delivered alongside earlier UI polish; it is not a formally-codified MVP slice artefact in this spec, and S11 does not retroactively codify it (that would breach the "MVP design unchanged" rule recorded in §3). For S11's purposes, the relevant fact is the **DOM contract**: `<AppHeader />` renders persona-aware links — persona name, "Switch persona", "Update", "History". **None of those are valid on `/share/[token]`** — the recipient is not the persona (N1; they may not even have a persona cookie), and exposing persona-aware nav would (a) leak which persona owns the snapshot if the recipient also has a cookie set for a different persona, (b) tempt the recipient into a route they have no right to act on.
  - **Enforcement shape — route-group / layout separation (F1.8: this is now the only acceptable shape under S11).** Move the `/share/[token]` route into a separate Next.js 16 route group (e.g. `app/(share)/share/[token]/page.tsx`) with its own minimal `layout.tsx` that renders only a sectioned `<header>` containing the product wordmark — **no `<AppHeader />` import at all** under the `(share)` group. Route grouping in Next.js 16 lets two layouts coexist without nesting; the persona-aware layout stays at the app-root level and applies to `/`, `/dashboard*`, `/history`, while the `(share)` group gets its own. Conditional-render-inside-`<AppHeader />` was considered and **rejected** because it leaves a behavioural seam (a regression that flips the persona-aware flag back on under `/share/*` could land without a layout-level test catching it); route-group separation is structural and the test cost is one render of the `(share)` group's `layout.tsx` rather than a per-prop matrix on `<AppHeader />`.
  - **DOM contract — load-bearing assertion (closes F1.3).** On `/share/[token]` and on the `<ShareUnavailable />` arm, **the subtrees produced by `<SharedStatementView />` and `<ShareUnavailable />` and the `(share)` group's `layout.tsx`** must produce zero DOM elements whose `href`, `aria-label`, or rendered text references a persona id, a persona name, `/dashboard`, `/dashboard/update`, or `/history`. The contract is **subtree-scoped, not page-tree-scoped** — the S11 render tests assert it against the layout + view subtree without re-rendering or re-importing `<AppHeader />`. (Asserting `<AppHeader />` is *absent* from the `(share)` route is also part of the contract; it is satisfied structurally by the route-group separation above, and the test cost is one import-graph check rather than a per-render assertion.)
  - **R10 / R12 conscious reading (closes F1.7).** The "no persona-identity in the recipient-facing DOM" commitment above is an explicit broadening of R10 (PRD §3 R10 is scoped to application logs / error trackers, not DOM rendering) and R12 ("secure" is silent on UI scope of the share surface). We consciously read R10 + R12 **jointly** as covering "the recipient must not see the sharer's persona identity in any DOM element rendered under `/share/*`" — same shape as the F1.6 R10/R12 reading above, and the R20 / R7 broadening recorded at `<SharedStatementView />` below. The §7 R10 row is extended to list this; if a future PRD revision wants to narrow the scope back, that is a `/prd` change and this subsection is the right place to revisit.

- **Clock control** (resolves S021 finding — deterministic expiry tests):
  - A small helper module `lib/share/clock.ts` exports `nowUtc(): Date` returning `new Date()`. Every S11 call site that needs "right now" calls `nowUtc()` instead of `new Date()` directly — both the Server Action (mint's `expires_at = nowUtc() + 24h`, `created_at = nowUtc()`) and the resolver (`getShareLinkByTokenHash(hash, nowUtc())`). One module = one mock surface; tests can either (a) `vi.mock('@/lib/share/clock', () => ({ nowUtc: () => new Date('2026-06-12T00:00:00Z') }))` to pin the clock declaratively, or (b) use Vitest's fake timers (`vi.useFakeTimers(); vi.setSystemTime(new Date(...))`) for finer per-test control. Both styles are valid; `/test-plan` finalises which one each `T*` uses.
  - The S2 repository test row is unaffected — `createSnapshot` does not consume a clock; `takenAt` is supplied by the caller.

- **New presentational components** (sync, props-only — unit-test surface):
  - `<SharedStatementView snapshot={...} />` — renders disposable income, band chip, reasons, income / expenditure breakdown using the same outcome data shape that `<DashboardView />` (S4) renders. **The component itself never imports `<AppHeader />` and never reads a persona id**; persona-aware navigation is absent around the page by construction because the route lives under the `(share)` route group with its own minimal `layout.tsx` (per F1.8 in the "`AppHeader` behaviour on `/share/[token]`" subsection above — route-group / layout separation is the only acceptable enforcement shape; the conditional-render alternative the revision-5 draft accepted was dropped). The component renders no persona name, no "Switch persona" link, no Update / History actions in its own subtree. Renders `<SupportSignpost />` and `<FramingNotice />`. All money is formatted via S10's `formatMoney(pence, snapshot.currency, snapshot.countryCode)`.

    **R20 + R7 broadening — conscious reading recorded here, not silently inherited.** R20's literal wording is "every outcome screen" and R7's is "every outcome surface". S007 round-2 F2.1 narrowed S9 to `/dashboard` + `/history` because those are the only outcome screens **inside the customer's own session**. `<SharedStatementView />` is a **read-only outcome surface for the recipient** — it shows the same disposable / band / reasons that `<DashboardView />` shows, just without the persona-aware actions. The recipient is exactly the audience R20 + R7 are written for: someone looking at an affordability assessment who needs to be told "this is not financial advice" (R20) and given a route to human support (R7). We therefore consciously read R20 + R7 as covering this surface; the §7 traceability rows for R7 and R20 are extended in this revision to list S11. `<ShareUnavailable />` is **not** an outcome surface (no affordability state on the page) and is excluded — see the next bullet. If a future PRD revision wants to narrow R20 / R7 back to "outcome screens within an authenticated session", that is a `/prd` change and this slice's placement is the right place to revisit.
  - `<ShareUnavailable />` — a single sectioned page with the generic message ("This link is no longer available …"). **No `<FramingNotice />` and no `<SupportSignpost />`** — `<ShareUnavailable />` is not an outcome screen (no affordability state on the page), so neither R20 nor R7 attaches; rendering them here would re-open the same gate-cross pattern S007 round-2 F2.1 closed when it narrowed S9 to outcome screens. No back-link to a customer-facing route (the recipient may not be the snapshot's owner).
  - `<ShareSnapshotForm snapshotId={...} />` — Client Component (`'use client'`) that posts to `createShareLinkAction` and renders the returned URL in a `<input readOnly>` plus a "Copy link" button. Rendered **inside** existing surfaces: once in `<DashboardView />` (latest-snapshot share) and once per row in `<HistoryList />` (any owned snapshot share). Adding the form to those components is a per-slice edit done by `/implement S11`; the §3 entries for S4 and S6 are not rewritten.

- **Threat model summary (deliberate scope cap; honest about N1).**
  - **In-scope as design commitments:** raw-token-not-stored guarantee (only the SHA-256 hash is persisted); 24-hour expiry; persona-cookie ownership check at mint time; same generic copy + status (200) on resolver miss / expiry / unknown token; no rendering of customer-name PII to the recipient.
  - **N1 honesty — the "ownership check at mint" is bounded by the no-real-auth posture.** PRD N1 names "no real authentication; demo uses fixed mock customers"; S3's persona cookie is unsigned, `HttpOnly` + `Lax` + 30-day Max-Age, and is set by clicking a persona on `/`. The mint-time ownership check therefore guarantees only that the *caller's persona-cookie identity* matches the snapshot's `customerId` — it is a **UX selector that prevents accidental cross-persona sharing in the demo**, not a security control on top of an authenticated identity. An attacker who can read or set the persona cookie can mint share links for that persona's snapshots. Same N1 ceiling applies to S12. A real-auth round (out per N1) would tighten this; until then, S11's posture is "no information leak between personas during normal demo use", not "authenticated authorisation".
  - **Acknowledged but not closed:** anyone who obtains the URL within 24h gets read access (no recipient identity); single-use is deferred (§5 trade-off "S11 single-use deferred"); revocation is deferred (§5 trade-off "S11 revocation deferred"); rate limiting is deferred (§6 Out of scope); the raw bearer token rides in the URL path so any web-server access log captures it (§5 trade-off "S11 + S12 access-log limitation"); coercion / forwarded-under-pressure risk is flagged (§5 trade-off "S11 + S12 coercion risk (suspicion)"). A future slice would close any of these — out for stretch.

**Data hygiene (R10) — scoped to application code.**

- **Application-code commitments (testable):** the action never logs the raw token, the token hash, or the snapshot id. Lifecycle log allowed: `share: link created` (with no identifiers). The resolver never logs the incoming `[token]` segment (raw or hashed). On miss/expiry it logs `share: lookup miss` (or omits altogether) — never the hash, never the IE payload. No IE field content (`label`, amounts) appears in any application log line in this slice.
- **Known limitation (not closeable in stretch):** the share URL is `/share/<rawToken>`. Next.js's own dev-mode request logger and any production access log (web server, reverse proxy, CDN) will record the path verbatim, which means the raw bearer token appears in those logs. Application-level `console.*` spies cannot catch this layer. Mitigations considered and deferred: (a) move the bearer off the URL path (POST-then-redirect with a one-time fragment) — significant UX and link-sharing cost, (b) suppress access logging on `/share/[token]` via Next.js config — out for stretch as it is implementation work that should land with `/implement S11` after a real evaluation, (c) declare the limitation explicitly. Picked **(c)** for the spec; recorded in §5 trade-off "S11 + S12 access-log limitation under R10" and §6 Out of scope. The S11 logging-hygiene test commitment below therefore asserts only the application-code surface, not the framework / infrastructure access log.

**Accessibility (R18).** `<SharedStatementView />` honours the same WCAG 2.2 AA commitments as `<DashboardView />` (§4 cross-cutting): single `<main>` landmark; band chip uses text + icon; ≥ 4.5:1 contrast; visible focus rings; reflow at 400% zoom / 320 CSS-px viewport (SC 1.4.10); SC 2.5.8 24-CSS-px target on every focusable element. The "Copy share link" UI on the originating page uses a real `<button>` + `<input readOnly>` with `aria-describedby` pointing at the human-readable expiry timestamp (not just the ISO).

**What this slice does NOT do.**

- No email / SMS sending of the link — the customer copies the URL themselves.
- No revocation UI.
- No account permission model — there is no auth in MVP; a leaked link grants read access to the snapshot until expiry.
- No rate limiting.
- No custom expiry — fixed 24 hours.
- No single-use enforcement — token can be reopened until expiry.
- No token, snapshot id, or IE payload in any **application** log line. (The framework / access-log layer is acknowledged as a known limitation — see "Data hygiene (R10) — Known limitation".)

**Tests (R19) — coverage commitments for the eventual `/implement S11` session:**

- **Token generation.** `generateShareToken()` returns a fresh `raw` (43-char base64url) on every call; the same `raw` always hashes to the same `hash`; different raws produce different hashes; the hash is 64 lower-case hex chars.
- **Migration applied.** `share_links` table exists with the columns above; index `idx_share_links_token_hash` exists.
- **Repository round-trip.** `createShareLink` + `getShareLinkByTokenHash(hash, now)` returns the linked `snapshotId`. With `now > expires_at`, returns `null`. With an unknown `hash`, returns `null`.
- **Clock helper.** `nowUtc()` returns a `Date`; mocked via `vi.mock('@/lib/share/clock', ...)` it returns the pinned instant; the action's `expires_at` equals `pinned + 24h` to the millisecond; the resolver's "expired" branch fires deterministically when the pinned instant crosses `expires_at`. Equivalent fake-timers test (`vi.useFakeTimers(); vi.setSystemTime(...)`) passes against the same fixtures — both styles must work; `/test-plan` picks one per `T*` row.
- **Server Action ownership check.** Under `withPersonaCookie('jordan')`, calling the action with `pat`'s snapshot id returns the same generic error as for a non-existent snapshot id. No DB write happens. No `console.*` mention of the snapshot id.
- **Server Action persona validation (`getPersonaById()` arm).** Three sub-cases all return `{ ok: false, errors: [{ field: '_', message: 'Please pick a persona first.' }] }` and **no row appears in `share_links`** after the call (resolves S021-fix F1.13 — `createShareLinkAction` never writes to `snapshots` on any path, so the `snapshots` half of the previous draft assertion was vacuous and is dropped): (a) cookie absent — exercised by leaving `withPersonaCookie` out of the `beforeEach` so the stubbed `cookies().get('personaId')` returns `undefined` (resolves S021-fix F1.9 — the previous draft's `withPersonaCookie(null)` "no cookie at all" wording was inconsistent with the S7 helper at `tests/_helpers/withPersonaCookie.ts` which always installs a cookie-present stub; "cookie absent" is the absence of the helper call, not a call with `null`); (b) `withPersonaCookie('')` (cookie present, empty string value); (c) `withPersonaCookie('does-not-exist')` (cookie present but the value is not in `personas`). Spy on `console.*` records no mention of the invalid cookie value across all three sub-cases.
- **Server Action happy path.** Under `withPersonaCookie('jordan')`, calling the action with `jordan`'s latest snapshot id returns `{ ok: true, url, expiresAt }`. The DB now has one row in `share_links` with the corresponding `token_hash`. The raw token is not anywhere in the database. The returned URL parses to `/share/<43-char base64url>`. `expiresAt = nowUtc() + 24h` (clock pinned via the helper above).
- **Resolver page logic** (test the page-extracted helper, not the async Server Component itself — per §4 page-vs-component split). Given a fresh DB and a freshly-minted link: `resolveShare(token, now)` returns the snapshot; `resolveShare(token, expiredNow)` returns `null`; `resolveShare('garbage', now)` returns `null`.
- **Resolver — snapshot row missing.** Insert a `share_links` row pointing at a `snapshots.id` that no longer exists (delete the snapshot row after minting, or insert a `share_links` row with a UUID that never had a matching snapshot). `resolveShare(token, now)` returns `null`; the page renders `<ShareUnavailable />` with the same copy and same response headers as the unknown-token / expired arms.
- **Response headers via `middleware.ts` (resolves S021-fix F1.1 + F1.5 — pinned to the middleware unit, not the page response).** Import the `middleware` function from the project-root `middleware.ts` directly into the test file and invoke it with a stub `NextRequest` whose `nextUrl.pathname === '/share/abc123'`. Assert the returned `NextResponse` has headers `Cache-Control: 'no-store, private'` and `X-Robots-Tag: 'noindex, nofollow'`. **Header parity across the four arms (unknown token / expired / snapshot-row-missing / happy path) is structural, not asserted per-arm** — the middleware matches on pathname, not on resolver outcome, so a single middleware-unit assertion covers all four. Run the same assertion against `/share/garbage`, `/share/expired-fixture-token`, and a happy-path token to make the structural-coverage claim explicit. Negative test: the middleware function returns a pass-through (no `Cache-Control` / `X-Robots-Tag` headers) for `/`, `/dashboard`, `/dashboard/update`, `/history`, and `/dashboard/snapshot/<id>/pdf` — so the share matcher does not over-broaden onto MVP routes or onto S12's PDF route (S12 sets its own `Cache-Control: no-store, private` directly in the Route Handler `Response` headers below in §S12, which is permitted because Route Handlers can set response headers).
- **`<meta name="robots">` on the page.** A separate Vitest test imports `generateMetadata` from `app/(share)/share/[token]/page.tsx` and asserts the returned metadata includes `robots: { index: false, follow: false }` (or the equivalent Next.js 16 metadata shape per `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`). This is the HTML-only-reader fallback for the `X-Robots-Tag` header; both must be present.
- **Dynamic-route posture.** The page module exports either no caching directive **or** an explicit `export const dynamic = 'force-dynamic'`; assertion is that **no** `export const revalidate = <number>`, no `export const dynamic = 'force-static'`, and no `unstable_cache` call appears in `app/(share)/share/[token]/page.tsx`. Cheap regression guard against accidental static pre-render.
- **`<SharedStatementView />` render.** For each persona's outcome shape, renders disposable / band / reasons / breakdown; renders `<SupportSignpost />` and `<FramingNotice />`; does not render any persona-aware nav, "Update" button, or "Switch persona" link. **Subtree pathname assertion (closes F1.3 narrowing — subtree-scoped, not full-page-tree-scoped):** rendering `<SharedStatementView />` together with the `(share)` route group's `layout.tsx` (the only two surfaces that ship inside the `(share)` route group) produces zero DOM elements whose `href`, `aria-label`, or rendered text matches a persona id, persona name, `/dashboard`, `/dashboard/update`, or `/history`. **Structural absence of `<AppHeader />` under `(share)`:** a static import-graph check on `app/(share)/share/[token]/page.tsx` and `app/(share)/layout.tsx` asserts neither file imports `<AppHeader />` (the route-group separation is what makes the subtree assertion sufficient).
- **`<ShareUnavailable />` render.** Renders the same generic copy regardless of the inferred reason (unknown token / expired / snapshot-row-missing); **does not** render `<FramingNotice />` or `<SupportSignpost />` (R20 / R7 do not attach — the page carries no outcome). Snapshot test confirms no per-reason variation in the rendered string. Same subtree pathname assertion as above — `<ShareUnavailable />` + the `(share)` group's `layout.tsx` produce zero persona-aware links and zero `<AppHeader />` import.
- **Logging hygiene (application-code scope).** `console.*` spy across (a) one happy-path action invocation, (b) one expired-resolver lookup, (c) one unknown-token resolver lookup, (d) one snapshot-row-missing resolver lookup records zero raw tokens, zero token-hash strings, zero snapshot ids, zero IE-value digits **emitted by application code**. Next.js's own request logger is out of scope for this assertion (see "Data hygiene (R10) — Known limitation" above).
- **a11y smoke.** `vitest-axe` reports no violations for `<SharedStatementView />` (each persona). The `<ShareUnavailable />` smoke is included for completeness but is not load-bearing for R18 — the page is one heading + one paragraph and will pass trivially; the meaningful R18 surface in S11 is `<SharedStatementView />`.

---

### S12 — PDF export (stretch)

**Requirements:** R13, R19

**Design.** A customer can download a PDF rendering of any owned snapshot. The PDF is generated on demand and streamed back to the browser; nothing is written to disk. The layout uses S10's `formatMoney` helper and S9's framing copy so the PDF's **money strings** cannot drift from the on-screen surface — band labels, reasons, and framing copy are independent code paths and can drift in principle, mitigated by reusing the same `copy.ts` / `framing.ts` source modules.

- **Library choice:** [`@react-pdf/renderer`](https://react-pdf.org). Pure-React PDF renderer with a documented Node helper `renderToBuffer(element): Promise<Buffer>` for server-side rendering — invoked as `renderToBuffer(<SnapshotPdf snapshot={snapshot} />)`. (The package's older `pdf(...).toBuffer()` instance API is still exported but `renderToBuffer` is the officially-documented top-level Node export and is what the slice targets.) Alternatives considered: `pdfkit` (lower-level draw API; would re-implement layout), `puppeteer` / `playwright` (heavy — pulls in Chromium, conflicts with the no-Playwright constraint and the take-home's "don't over-engineer" framing), `jsPDF` (browser-leaning; would push generation to the client and bloat the bundle). Decision recorded in §5 trade-off "S12 PDF library". **Suspicion to verify at `/implement S12` (not in `package.json` / `node_modules` yet):** the "no-headless-browser, no-Chromium-binary, pure-Node" framing **and the exact name + signature of the documented Node API** — the addendum trusts the upstream README; `/implement S12` must (a) **pin a concrete `@react-pdf/renderer` version** in `package.json` (no caret-only floats; an exact `x.y.z`), (b) **verify against the installed `node_modules` that `renderToBuffer` is exported from the package root** (`import { renderToBuffer } from '@react-pdf/renderer'`) and returns `Promise<Buffer>` for the same `<SnapshotPdf />` element shape this slice writes, (c) sanity-check install size and runtime footprint (no Chromium binary in `node_modules/.bin`), (d) confirm rasterisation does not invoke a system browser. If the verification fails — e.g. the upstream version pinned during implementation uses `renderToStream` only, or has renamed the export — route back here for a library reselection or a wrapper-shape update rather than smuggling in a heavier dependency.

- **New Route Handler** (`app/dashboard/snapshot/[id]/pdf/route.ts`) — Next.js 16 Route Handler, returns a binary `Response`:

  ```ts
  // route.ts
  export const runtime = 'nodejs'; // @react-pdf/renderer needs Node APIs (Buffer, fs for embedded fonts);
                                   // Edge runtime would fail to render. Pinned explicitly so a future
                                   // global default-runtime change cannot silently break this route.

  export async function GET(
    _: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    const personaId = await getPersonaId();
    // Validate the persona cookie via the S3 fixtures registry. Missing OR invalid
    // (e.g. a stale cookie from a renamed persona) is rejected before any DB read
    // and before any PDF generation work. No information leak vs "not yours".
    if (!personaId || !getPersonaById(personaId)) {
      return new Response('Forbidden', { status: 403 });
    }
    const snapshot = await getSnapshotById(id);
    if (!snapshot || snapshot.customerId !== personaId) {
      return new Response('Not Found', { status: 404 });
    }
    const buffer = await renderSnapshotPdfToBuffer(snapshot);
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="financial-snapshot-${snapshot.takenAt.slice(0, 10)}.pdf"`,
        'Cache-Control': 'no-store, private',
      },
    });
  }
  ```

  Returning HTTP 404 for "not yours" and "not found" alike is intentional — no information leak about which IDs exist for other personas (mirrors the S11 ownership-check posture). **No PDF generation work runs on the 403 arm** — the handler returns before calling `renderSnapshotPdfToBuffer`, so an invalid persona cannot trigger React rendering, `Intl.NumberFormat` allocation, or any of `@react-pdf/renderer`'s buffer accumulation. Same posture for the 404 arm. The `runtime = 'nodejs'` directive is required: `@react-pdf/renderer` calls into Node-only APIs (`Buffer`, font loading via `fs`); on the Edge runtime the import would fail. The directive is asserted by a static-import test (below) so a future global runtime flip cannot silently regress.

- **PDF document component** (`lib/pdf/SnapshotPdf.tsx`) — a pure React component using `@react-pdf/renderer`'s primitives (`<Document>`, `<Page>`, `<View>`, `<Text>`). Top-to-bottom layout:

  1. **Lightweight branding** — a product title rendered as `<Text>` ("Customer Financial Health · Snapshot"). No logo image asset by default — keeps the PDF deterministic, byte-stable, and avoids an image-encoding step. A simple text wordmark is the lightweight branding.
  2. **Snapshot date** — the `takenAt` ISO timestamp formatted via `Intl.DateTimeFormat(localeFor(snapshot.countryCode), { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }).format(...)`.
  3. **Currency / country line** — explicit "Currency: GBP · Country: GB" so the recipient sees what locale the figures are in.
  4. **Income total** — formatted via S10's `formatMoney(snapshot.outcome.totalIncomePence, snapshot.currency, snapshot.countryCode)`.
  5. **Expenditure total** — same helper.
  6. **Disposable income** — same helper, signed.
  7. **Band** — text label only (`Surplus` / `Breakeven` / `Shortfall` / `Zero income` / `No data`); no coloured chip. PDF accessibility relies on text, not colour.
  8. **Reasons** — `outcome.reasons[]` rendered as bulleted lines.
  9. **Income breakdown** — earner label + amount per row, formatted via `formatMoney`.
  10. **Expenditure breakdown** — line label + amount per row, formatted via `formatMoney`.
  11. **Support signpost** — the `<SupportSignpost />` copy block (S4) rendered as `<Text>` plus the support URL in plain text (`"/support"`). No JSX of the React-DOM component (it would not render in a React-PDF tree); the copy strings come from the same `copy.ts` source so the PDF and screen do not diverge in this layer.
  12. **Framing notice** — the `framingNotice()` body (S9) rendered verbatim, with a heading "About this assessment".

  **R20 + R7 broadening on the PDF — conscious reading recorded here, not silently inherited.** R20's literal wording is "every outcome screen" and R7's is "every outcome surface". S007 round-2 F2.1 narrowed S9 to `/dashboard` + `/history` because those were the only outcome screens in scope at the time. A PDF of a snapshot is a **read-only outcome surface for whoever opens the file** — it shows the same disposable / band / reasons / breakdown that `<DashboardView />` shows, just rendered as a portable document. The reader is exactly the audience R20 + R7 are written for: someone looking at an affordability assessment who needs to be told "this is not financial advice" (R20) and given a route to human support (R7). We therefore consciously read R20 + R7 as covering this surface; the §7 traceability rows for R7 and R20 are extended in this revision to list S12. If a future PRD revision wants to narrow R20 / R7 back to "outcome screens within an authenticated session" or "outcome screens served as HTML", that is a `/prd` change and this slice's placement is the right place to revisit.

- **Renderer wrapper** (`lib/pdf/render.ts`):
  - `renderSnapshotPdfToBuffer(snapshot: Snapshot): Promise<Buffer>` — **wraps `renderToBuffer(<SnapshotPdf snapshot={snapshot} />)`** from `@react-pdf/renderer` (`import { renderToBuffer } from '@react-pdf/renderer'`). Pure delegation; the wrapper exists so the route handler depends on a typed local module instead of the third-party import directly, and so the unit tests have a single function to call without instantiating React-PDF primitives in the test file. **Version pinning is a `/implement S12` responsibility** — `@react-pdf/renderer` must be pinned to an exact `x.y.z` in `package.json` and the wrapper must compile against the installed version (see the "Library choice" verification list above). If the upstream API renames `renderToBuffer` (e.g. to `pdfToBuffer`) in the pinned version, update this wrapper here rather than scattering the rename across call sites; the route handler stays on `renderSnapshotPdfToBuffer` regardless.

- **Authorisation.** The snapshot must belong to `personaId` (persona-cookie identity). Forbidden vs Not Found are both 404 to avoid information leaks.

- **Storage.** None. The buffer streams to the response and is garbage-collected after. No file in `.data/`, no S3, no DB row.

- **Where the download is invoked from.** A new `<DownloadPdfLink snapshotId={...} />` element (a plain `<a href="/dashboard/snapshot/.../pdf">` with `rel="noopener"` and an explicit `download` attribute) is rendered inside `<DashboardView />` (S4 — latest snapshot) and inside `<HistoryList />` (S6 — every owned snapshot row). Adding the link to those components is a per-slice edit done by `/implement S12`; the §3 entries for S4 and S6 are not rewritten.

**Data hygiene (R10) — scoped to application code.**

- **Application-code commitments (testable):** the route handler logs only a lifecycle line (`pdf: rendered`) with no identifiers — no snapshot id, no persona id, no IE-value digits, no disposable amount. Generated buffer is never persisted anywhere. `Cache-Control: no-store, private` prevents intermediate caching of the rendered PDF.
- **Known limitation (not closeable in stretch):** the PDF route is `/dashboard/snapshot/<id>/pdf`. Next.js's own dev-mode request logger and any production access log will record the path verbatim, which means the snapshot UUID appears in those logs. Same shape as the S11 limitation; same mitigation route considered (move id off path, suppress access logger, declare); same call — declare. Recorded in §5 trade-off "S11 + S12 access-log limitation under R10" and §6 Out of scope. The S12 logging-hygiene test below therefore asserts only the application-code surface, not the framework / infrastructure access log.

**Accessibility (R18).** A PDF is a static document, not an interactive surface. WCAG 2.2 AA targets that apply:

- Band conveyed by text not colour.
- Clear semantic order of sections (date → currency → totals → band → reasons → breakdown → signpost → framing).
- Embedded font readable at ≥ 11pt for body text, ≥ 14pt for section headings.
- Tagged-PDF (full SC 1.3.1 / 1.3.2 semantic structure, screen-reader navigation) is a known limitation of `@react-pdf/renderer` — recorded in §5 trade-off "S12 no tagged-PDF" and as an explicit §6 carry-out.

**What this slice does NOT do.**

- No PDF storage, retention, or CDN delivery.
- No customer signature, no per-recipient watermark.
- No integration with S11's shared statement (combining a share link with a PDF download of the shared snapshot is a future slice).
- No tagged-PDF accessibility tree.
- No multi-page pagination logic beyond the lib's defaults.
- No multi-language layout.

**Tests (R19) — coverage commitments for the eventual `/implement S12` session.**

**Scope note for PDF assertions.** All `T*` rows that look at the PDF body assert **required-content presence** (specific strings — money figures, band labels, the framing "not financial advice" phrase, persona-relevant reasons) using a text-extraction helper (e.g. `pdf-parse` or `pdfjs-dist`'s text content). **No `T*` asserts exact pixel layout, font kerning, line-wrap positions, page count beyond the lib's defaults, byte-for-byte buffer equality, or tagged-PDF semantic structure (WCAG SC 1.3.1 / 1.3.2 — out of stretch per §5 trade-off "S12 no tagged-PDF" and §6 carry-out; resolves S021-fix F1.12).** PDF layout is a `@react-pdf/renderer` runtime concern that can shift between patch versions of the library or the embedded font; pinning on layout would make the test suite brittle to upstream changes that have no semantic effect. The contract is "the PDF says X", not "the PDF says X on line N at column M".

- **Route handler `runtime` directive.** The route module exports `runtime === 'nodejs'`. Asserted by a static import of `app/dashboard/snapshot/[id]/pdf/route.ts` followed by `expect(route.runtime).toBe('nodejs')`. Cheap regression guard against a future global default-runtime flip silently breaking the route.
- **Route handler ownership check.** With `withPersonaCookie('jordan')`, requesting `pat`'s snapshot id returns 404. Same response for an unknown snapshot id. No leak of "exists but not yours" vs "doesn't exist".
- **Route handler missing persona cookie.** Returns 403; no DB read; no call to `renderSnapshotPdfToBuffer`.
- **Route handler invalid persona cookie (`getPersonaById()` arm).** With `withPersonaCookie('does-not-exist')` (cookie present but not in the 7-persona fixture set), returns 403; no DB read; no call to `renderSnapshotPdfToBuffer`. Spy on `console.*` records no mention of the invalid cookie value.
- **Route handler happy path.** With `withPersonaCookie('jordan')` and `jordan`'s latest snapshot id, returns 200 with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="financial-snapshot-YYYY-MM-DD.pdf"`, `Cache-Control: no-store, private`, and a non-empty body.
- **PDF byte-prefix.** The response body Buffer starts with the bytes `%PDF-` (asserted as `buffer.slice(0, 5).toString() === '%PDF-'`). Cheap signal that the lib produced a PDF; per the scope note above, this is presence not layout.
- **`renderSnapshotPdfToBuffer` smoke.** For each persona's `Snapshot` fixture, returns a non-empty Buffer prefixed with `%PDF-`. Wrapper delegates to `renderToBuffer` — the test does not call `renderToBuffer` directly; it asserts that calling the local wrapper produces a PDF buffer.
- **Outcome state coverage.** Render PDFs for snapshots with each outcome state (`surplus`, `breakeven`, `shortfall`, `zero-income`, `no-data`); each Buffer starts with `%PDF-` and (using `pdf-parse` or equivalent text extraction in the test) **contains** the band label, the disposable figure, the framing-notice "not financial advice" phrase, and at least one of the `reasons[]` strings. Per the scope note above, the assertion is `.toContain(...)` (presence) — not `.toEqual(...)` against a layout-pinned snapshot, not a line-position check.
- **`formatMoney` integration.** PDF text **contains** the same money strings (`'£1,234.50'` etc.) that `<DashboardView />` shows on screen for the same snapshot — sanity check that the **money strings** cannot drift (band labels, reasons, framing copy are reused from the same source modules but live on independent code paths and are not asserted by this test). Presence not layout.
- **Logging hygiene (application-code scope).** A `console.*` spy across one full GET records zero IE-value digits, zero customer-id strings, zero snapshot-id strings **emitted by application code**. Next.js's own request logger is out of scope for this assertion (see "Data hygiene (R10) — Known limitation" above).
- **No file written.** A spy on `fs.writeFile` / `fs.writeFileSync` confirms zero writes during the GET. Cheap regression guard against an accidental "save copy to disk" addition.

---

## 4. Cross-cutting concerns

- **Page-vs-Component split for testability.** Every route is structured as an async `page.tsx` that performs all I/O (`await cookies()`, `await listSnapshots(...)`, prop assembly) and a sibling **sync** presentational component (`components/*.tsx`) that takes plain props and returns DOM. This is non-negotiable: Vitest's current runner cannot render async Server Components (`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` is explicit), and Next.js 16's `cookies()` / `headers()` / `params` are async. Splitting at this boundary makes the render layer unit-testable without introducing a Playwright runtime in MVP. Pages are not unit-tested; presentational components are. Cross-cutting render-layer commitments (e.g. R20's `<FramingNotice />` and R7's `<SupportSignpost />`) are rendered **inside** the View component (not on the host page) so the unit test catches them.
- **Server-Action testing strategy.** Server Action handlers (`'use server'` async functions, e.g. `updateSnapshotAction`) are tested as **plain async functions** — call them directly with a `FormData` fixture from `tests/_helpers/formData`. Next.js's redirect / revalidate primitives and the cookie reader are mocked via Vitest module-level mocks (`vi.mock('next/navigation', ...)`, `vi.mock('next/cache', ...)`, `vi.mock('next/headers', ...)` via the `withPersonaCookie()` helper). There is no HTTP layer to intercept, which is why MSW is not used (see §5 trade-off "No MSW").
  - **Known limits of this strategy (acknowledged, not closed):**
    - Calling a `'use server'` function directly **skips the FormData-encoding / RSC-payload boundary** Next.js uses in production. A regression where the encoded payload silently drops a field would not be caught. Mitigated only by manual reviewer walkthrough in MVP; a Playwright slice would close it if added.
    - The React `useActionState` round-trip used by `<UpdateForm />` is **not** exercised by direct-call action tests. The S7 `<UpdateForm />` render row tests the form's rendering of an injected error state but does not exercise the React form-action runtime end-to-end. Same mitigation as above.
    - `revalidatePath('/dashboard')` / `revalidatePath('/history')` are mocked, so an action-succeeds-but-revalidation-missing regression would not be caught by automated tests. Accepted as an MVP trade-off consistent with the no-E2E posture.
- **Accessibility — cross-cutting WCAG 2.2 AA SCs that apply to every interactive surface (S4 / S5 / S6 / S9):**
  - **SC 2.5.8 (Target Size — Minimum, AA, new in 2.2):** every interactive element (button, link, disclosure summary, form control) has a hit target of at least **24 × 24 CSS pixels**, including the add-/remove-row controls in `<UpdateForm />` and the disclosure summaries in `<HistoryList />`.
  - **SC 2.4.11 (Focus Not Obscured — Minimum, AA, new in 2.2):** when an interactive element receives focus, it is not entirely hidden by any other element. The MVP has no sticky bars, no fixed footers, and no overlay components — the SC is satisfied by construction. Any future slice that adds sticky UI (e.g. a stretch share-link banner under R12) re-opens this SC.
  - **SC 2.4.7 (Focus Visible, AA):** every focusable element has a visible focus indicator via Tailwind `focus-visible:*` utilities; required at the component level per S4 / S5 / S6 / S9.
  - **SC 1.4.3 (Contrast, AA):** body text ≥ 4.5:1; UI components and large text ≥ 3:1. Verified against the Tailwind colour tokens used by each component.
  - **SC 1.4.10 (Reflow, AA):** content reflows at 400% zoom / 320 CSS-px viewport without two-dimensional scrolling. Required at the component level per S4 / S5 / S6.
- **Validation strategy.** All input parsing goes through the zod schemas in `lib/affordability/validation.ts`. Server Actions never trust `FormData` directly — they parse first, then dispatch. Errors are typed (`ValidationError[]`) and rendered next to the field; never as a dead-end (R5(d)).
- **Server-vs-client authority.** The calculator runs only on the server. The client receives the computed `AffordabilityOutcome`, never the formula. This matches the brief's "we're not assessing whether you can implement a formula" framing (brief lines 99–102) and keeps R10's data-minimisation posture on the client (no IE arithmetic in the bundle).
- **Observability.** Default Next.js dev logger only. No external APM. Application code logs are limited to lifecycle events (db opened / migration applied / server action received — persona id `<id>` allowed, IE values never). No `console.log(ie)`, no error trackers wired up. R10 is enforced by the test in S7's "Logging hygiene" row.
- **Data hygiene.** `.data/` and `.next/` are gitignored. The personas file is fictional (R10, `.cursor/rules/10-evidence.mdc` "Sensitive data"). `IncomeAndExpenditure` carries **no free-text fields** outside per-row `label`, by design (see §5 trade-off "Free-text note removed") — this caps the surface area where a customer could paste PII into stored / re-rendered text. The `ie_json` column stores synthetic data only; no real PII is acceptable in any environment, including local dev.
- **Performance.** SQLite + a small denormalised list query handle the entire surface; no caching layer required. Server Components are not memoised explicitly — Next.js 16's default render model is sufficient for the take-home traffic profile (one reviewer, one persona at a time).
- **Currency / locale.** `en-GB`, GBP, integer pence. Currency formatting via `Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })`. R11 (multi-currency) would replace the hard-coded `'GBP'` and add `currency` / `country_code` columns — designed-for but not implemented (see §6).

---

## 5. Trade-offs and alternatives considered

- **ORM: Drizzle vs Prisma vs raw `better-sqlite3`.** Picked Drizzle. Prisma's codegen + runtime client are heavy for a take-home; raw `better-sqlite3` would have meant hand-rolling migrations and types, costing test-writing time. Drizzle gives typed queries, a small SQL-file migration tool (`drizzle-kit generate`), and matches discovery's "lightweight ORM" phrasing (`NOTES.md` §6 OQ-5).
- **Persistence: SQLite file vs in-memory vs Postgres.** Picked file-based SQLite. In-memory would have broken R3 (return-later viewing). Postgres needs a running service — over-engineered for a single-reviewer demo (`NOTES.md` §5 Tech stack: "Don't over-engineer"). The file lives in `.data/` so a reviewer's run state is local and disposable.
- **Routing: App Router vs Pages Router.** Picked App Router. The scaffold (`src/app/`) is already there, Server Components keep the calculator off the client (R10 ally), Server Actions remove the need for an API-route layer (`node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`).
- **State management.** None. Server Components + Server Actions cover every mutation; no Redux / Zustand / TanStack Query needed. The persona's "no speculative service layers" rule applies.
- **Form library.** None. Plain HTML forms with a Server Action handler; client-side state for add/remove rows is `useState` only.
- **Auth.** Mock cookie carrying a persona id, scoped to `Lax` + `HttpOnly` + 30-day Max-Age. Real auth, NextAuth, OAuth — out (N1). The cookie does not carry a token, so there is no token threat model to design.
- **Per-line delta in S5.** Rejected for MVP. A line-level delta needs a stable line-identity story (line ids, edits to existing lines vs new lines) that A5 explicitly defers. A single disposable-income delta + band-change indicator is the minimum that satisfies R2.
- **Zero-income outcome split (resolves F3.2).** A1 in the PRD routes zero-income into the shortfall band. Tech-spec refines: zero-income keeps the shortfall **band** (so the 3-value band schema in R1 is preserved) but gets its own `OutcomeState` so S1's copy and S4's signpost can be tuned. This is in-scope refinement because A1 is "adopted if Q1 stays unresolved" and Q1's resolution is tech-spec's job.
- **WCAG conformance level (resolves S005 D-27).** Picked **WCAG 2.2 AA** — the current published standard, scoped to every sync presentational component (S4 `<DashboardView />`, S5 `<UpdateForm />`, S6 `<HistoryList />`, S9 `<FramingNotice />`). AAA would have meant designing for, e.g., 7:1 contrast on body text, which a take-home cannot justify against R18's discovery wording ("baseline expectation"). Reflow uses SC 1.4.10's published threshold (400% zoom / 320 CSS-px viewport), not the looser "200% zoom" claim in the prior tech-spec draft.
- **F4.3 routed to `/prd` (R20).** The first tech-spec draft inlined the "not financial advice" footer in S4 as a copy concern under R6 + R9. The S007 critic flagged this as a workflow-rule-2 gate-cross: a behavioural commitment without an upstream `R*`. PRD was revised append-only to add R20 (Should / Regulatory), and S9 now owns the design for the framing surface. The footer copy itself is no longer in S4 — it lives in `lib/affordability/framing.ts` and is rendered via `<FramingNotice />` everywhere R20 says it must appear.
- **Free-text `note` field removed; per-row `label` retained at low residual risk.** Earlier draft of S1 carried an optional 280-char `note` on `IncomeAndExpenditure` and a corresponding form field on S5. Nothing in the PRD justified it, and the S007 critic flagged it as a PII risk vector (stored verbatim in `ie_json`, re-rendered in S6's history disclosure). Removed entirely from S1's type, S5's form, and S7's coverage matrix. The per-row `label` (max 80 chars) is still free text — customers need to name their earner ("Casey") and expenditure lines ("Rent", "Loan") — and is stored verbatim in `ie_json` and re-rendered in `<HistoryList />`. **Residual R10 risk acknowledged:** a customer could paste PII into a label. Mitigations: (a) the 80-char cap is much narrower than the 280-char `note` would have been, (b) labels are never logged (the S7 logging-hygiene test asserts zero IE-value digits *and* zero customer-id strings, and we extend its assertion list to scan for any IE field content if a regression appears), (c) the personas the take-home ships with use only fictional labels. Honours the persona's "no scope the PRD doesn't justify" rule (the label is essential to R1's "plain-language reading") and shrinks the data-minimisation surface (R10) to the smallest size that still lets a customer make sense of their own history.
- **SC 3.3.4 (Error Prevention — Legal, Financial, Data, AA) — satisfied by A5.** The form submission creates an immutable snapshot (R2). WCAG SC 3.3.4 calls for one of: reversibility, validation-before-submit, or review-and-confirm before any legally / financially significant submission. **A5's "corrections = new snapshot" model provides reversibility**: a customer who notices a mistake submits again; the prior (incorrect) snapshot stays visible in `/history` and the new (correct) snapshot becomes the latest. No data is destroyed. No separate review-before-submit step is added — that would extend scope beyond R5(d) (validation rejection inline) and would not improve outcomes the SC requires. S7 covers reversibility via the "Immutability check" row.
- **`useActionState` round-trip not unit-tested.** `<UpdateForm />` uses React's `useActionState` hook to drive the Server Action and receive its return value. The S7 `<UpdateForm />` render row tests the form's rendering of a *provided* error state (i.e., the test passes the error payload as props), and the S7 Server Action rows test the handler as a plain async function. Neither path exercises the end-to-end React-action runtime. A future Playwright slice would close this gap; for MVP, the manual reviewer walkthrough provides the only end-to-end signal. Recorded so `/test-plan` does not inadvertently spec a `T*` that would require driving the form via the React runtime.
- **Page-vs-Component split.** Async Server Components are unsupported by Vitest per the Next.js testing docs, and Next.js 16 makes `cookies()` / `headers()` / `params` async by default. We considered (a) adding Playwright for E2E render tests, (b) using `next/experimental-testing` (does not exist in this version per the in-repo docs), and (c) splitting each route into an async `page.tsx` plus a sync `components/<View>.tsx`. Picked (c): zero new dependencies, every render assertion stays in Vitest, the async-I/O surface is naturally pushed to the smallest possible layer, and `/implement` slices stay one-session-each because the View component lives next to the page in the same slice. The cost is a thin extra component per route — acceptable for the test leverage gained.
- **No MSW (Mock Service Worker).** The product has no HTTP API surface — there are no `/api/*` route handlers, no `fetch()` calls from the client, no third-party REST calls. All mutations are server-internal Server Action invocations through React's form binding. Server Action handlers are tested as plain async functions (call them directly with `FormData` fixtures) and Next.js's `redirect` / `revalidatePath` are mocked via `vi.mock('next/navigation' | 'next/cache')`. MSW would have no network traffic to intercept and would add a runtime + setup-file footprint for zero coverage gain. If R12 (statement-share link) is later attempted, that will introduce a real HTTP surface (signed URL endpoint) and MSW becomes a candidate again — recorded in the §6 deferral note for R12.
- **`no-data` band is `null`.** PRD R1 commits to a three-value band schema (surplus / breakeven / shortfall). The no-data outcome has no I&E to compute a band from, so emitting any of the three values would be misleading. Loosened the `AffordabilityOutcome.band` type to `Band | null`; the no-data outcome carries `null`, and the UI suppresses the band chip in that case. PRD R1 is honoured (the three values remain the only valid bands); no R is invented.
- **Stretch security model for R12 (deferred — S005 handoff).** Originally not designed; **resolved by S11 (S020 stretch addendum)**. The threat-model summary lives inside S11; remaining gaps (single-use, revocation, rate limiting) are recorded as their own trade-off / out-of-scope entries below.

### Stretch addendum trade-offs (S020 — S10 / S11 / S12)

- **S10 currency type narrowing (`'GBP'` / `'GB'` literals).** Picked literal-narrowed types over a wider `Currency` union or plain `string` because MVP/stretch ships only `'GBP' / 'GB'`; widening the type would invite call-sites to read non-existent currencies. The migration's column type is `TEXT NOT NULL DEFAULT 'GBP'` so a future selector can land without a schema change — only the TypeScript literal needs widening. Recorded so `/test-plan` does not invent a coverage row for currencies the product does not ship.
- **S10 locale derived from `country_code`.** Picked deriving `en-GB` from `'GB'` over storing a third `locale` column. Adds a small `localeFor(countryCode)` lookup (one entry today) but keeps the schema narrow. If the product ever needs locale separately from country (e.g. `en-IE` for Ireland-resident GBP customers), a new column lands as a new slice — out for stretch.
- **S11 random bearer token + SHA-256 hash over signed URL (HMAC).** Considered an HMAC-signed URL (statelessly verify with a server-side secret; no DB row needed). Picked random+hash because: (a) a leaked DB does not leak usable links, (b) revocation can be added later by deleting the row (no key-rotation drama), (c) no secret material to manage in the take-home. The trade-off is a write per mint — fine at the take-home traffic profile. **N1 bound:** "leaked DB does not yield usable links" is bounded by the no-real-auth posture (N1) — an attacker who can read the cookie jar can also typically read the SQLite file, so the asymmetry only protects the link surface against a DB-only leak. Recorded in S11's threat model summary so the addendum does not over-claim.
- **S11 single-use semantics deferred.** A single-use bearer would require either an atomic `UPDATE share_links SET used_at = ?` on resolve (race-prone in SQLite without an explicit transaction) or a separate "consumed" table. Picked reuse-until-expiry as the simpler primitive that still satisfies R12's literal wording. If a real-world version were built, single-use is the recommended next step — recorded so a follow-up slice has a clear starting point.
- **S11 revocation deferred.** No revocation column on `share_links`, no "Revoke link" UI. The 24-hour expiry is the only revocation primitive in stretch. Adding revocation needs a new column + a Server Action + UI surface — too large to keep S11 as a one-session slice. Out for stretch.
- **S11 rate limiting deferred.** No per-persona or per-IP rate limit on link creation or resolution. Acceptable in the take-home traffic profile (one reviewer); a public deployment would need a rate-limit primitive (in-process counter, edge middleware, or a dependency like `@upstash/ratelimit`). Recorded in §6.
- **S11 same-response posture (resolver) and same-error posture (mint) — separately.** Two distinct surfaces, deliberately not conflated:
  - **Resolver** (`/share/[token]/page.tsx`) returns the same `<ShareUnavailable />` page (HTTP 200, identical copy, identical response headers) for the only three cases the resolver can see: "token never existed", "token expired", "token resolved but linked snapshot row is missing". The resolver has no concept of "unauthorised" — there is no recipient identity to check against.
  - **Mint** (`createShareLinkAction`) returns the same generic typed error for "snapshot does not exist" and "snapshot exists but is owned by a different persona" — this is the only place an "unauthorised" arm exists, and it is a mint-time check against the persona-cookie identity (N1-bounded; see the bearer-token trade-off above).
  - Trades a small UX cost (a recipient cannot tell "the link was never valid" from "the link expired"; a customer cannot tell "this snapshot id is for someone else" from "this snapshot id does not exist") for a clean no-information-leak posture in application code. **Acknowledged but not closed:** response-header parity (`Cache-Control`, etc.) and timing-side-channel parity between hit / miss / expiry are not exercised by the test commitments — recorded so the spec does not over-claim "indistinguishable" at the wire layer.
- **S11 reintroduces an HTTP surface — MSW reconsidered.** The S5 / §5 "No MSW" trade-off cited "no HTTP API surface" as the deciding factor. S11's `/share/[token]` page is a server-rendered route, not a JSON API, so MSW still does not apply. S12's PDF route handler is the only true HTTP-binary surface; tests call the handler as a plain async function (no `fetch` to mock), so MSW remains unnecessary. Recorded so the "No MSW" stance survives the addendum.
- **S12 PDF library: `@react-pdf/renderer` over puppeteer / playwright.** Picked `@react-pdf/renderer` for its React-component layout API, documented Node helper `renderToBuffer(element): Promise<Buffer>` (`import { renderToBuffer } from '@react-pdf/renderer'`), and a stated no-headless-browser footprint — which would match the take-home's "no Playwright / no Chromium" constraint. (The package's older instance-style `pdf(element).toBuffer()` API is still exported, but `renderToBuffer` is the officially-documented top-level Node export and is what the slice and the `renderSnapshotPdfToBuffer` wrapper target.) Puppeteer / playwright would pull in Chromium (~170 MB by current Chrome-for-testing distributions), conflict with the no-Playwright stance, and add a cold-start cost on every PDF request. `pdfkit` was rejected because it is a low-level draw API — re-implementing layout would consume the slice's budget. **Suspicion to verify at `/implement S12`:** the "lightweight, pure-Node, no Chromium binary" framing **and the exact name + signature of the documented Node API** rely on the upstream README; the addendum does not have a `package.json` / `node_modules` entry to confirm against. `/implement S12` must (a) **pin a concrete `@react-pdf/renderer` version** in `package.json` (exact `x.y.z`, no caret-only float), (b) **verify against the installed `node_modules`** that `renderToBuffer` is exported from the package root and returns `Promise<Buffer>` for the same `<SnapshotPdf />` element shape this slice writes, (c) confirm install size and runtime footprint (no Chromium binary in `node_modules/.bin`), (d) confirm rasterisation does not invoke a system browser. If any of those fails (e.g. the pinned version renamed `renderToBuffer`, or exports only `renderToStream`), update the `renderSnapshotPdfToBuffer` wrapper in `lib/pdf/render.ts` here rather than scattering the rename across call sites — and if the failure is on (a) / (c) / (d), route back here for a library reselection rather than smuggling in a heavier dependency. Recorded so a future bigger-budget slice also has a starting point if the layout needs to grow.
- **S12 no tagged-PDF / SC 1.3.1 + 1.3.2 limitation.** `@react-pdf/renderer` does not emit a tagged-PDF semantic tree; screen-reader navigation of the PDF is best-effort (reading order follows the visual order). Mitigations: text-not-colour for the band, clear semantic headings, ≥ 11 pt body. The HTML surfaces (`<DashboardView />`, `<HistoryList />`) remain the accessible primary surface; the PDF is a supplementary export. Out-of-scope for stretch closure; recorded as a known limitation in §6 and surfaced to `/test-plan` so no `T*` asserts tagged-PDF structure.
- **S12 no PDF storage.** Generated buffers are streamed straight to the response and never persisted. Picked over disk caching to keep R10 (data minimisation) tight: no PDF-with-IE-payload sitting in `.data/` to forget about, no per-user S3 prefix to worry about, no GDPR-style deletion story. Trade-off: the buffer is recomputed per download (cheap at this scale). If a future deployment needs CDN-cached PDFs, an authenticated-URL pattern with a short TTL is the recommended next step — recorded so a future slice has a starting point.
- **S11 + S12 access-log limitation under R10.** The share URL `/share/<rawToken>` carries the bearer token in the path and the PDF URL `/dashboard/snapshot/<id>/pdf` carries the snapshot UUID in the path. Next.js's own dev-mode request logger and any production access log (web server, reverse proxy, CDN) will record those paths verbatim, so the bearer / snapshot id will appear in those logs. Application-level `console.*` spies cannot catch this layer. Three options were considered: (a) move the identifier off the URL path (POST-then-redirect with a one-time fragment for S11; opaque per-session id for S12) at the cost of breaking link-sharing UX, (b) suppress access logging on those routes via Next.js / proxy config, recorded in the spec as design-level, (c) declare the limitation explicitly and weaken the R10 logging-hygiene assertions to "application-code scope only". Picked **(c)** — the cleanest take-home call per the S020 critic — because (a) sacrifices the share UX the slice is built around, and (b) is implementation work that should land with `/implement S11` / `/implement S12` after a real evaluation, not be pre-committed in the spec. Recorded in §6 Out of scope as well so reviewers see it in both places. R10's PRD wording is unchanged; the test surface is narrower than the spec's previous draft implied.
- **S11 + S12 coercion / forwarded-under-pressure risk (suspicion — no PRD citation).** Sharing a snapshot via S11 or downloading a PDF via S12 produces a forwarded artefact that a third party (creditor, employer, family member, abuser) could pressure a customer into producing on demand — an audience PRD §2 names as vulnerable (anxious / ashamed / time-poor; self-declared support needs). The product is not regulated advice (R20), but it does emit a snapshot of an FCA-flavoured affordability read. The PRD does not currently address consent / coercion at the share-and-export layer; tagging this as **suspicion** because no in-repo source supports it as a hard constraint, but credible enough to record. Three options were considered: (1) route a `/prd` round to add a coercion-aware constraint (e.g. an explicit "I want to share this" confirmation, a "shared statements must show a who-you-shared-with reminder", or a non-goal that ties stretches to consent surfaces), (2) design a consent affordance into S11 / S12 here without a PRD anchor (a workflow-rule-2 gate-cross — refused per `.cursor/rules/00-workflow.mdc`), (3) record the risk as a flagged suspicion in §5 + §6, leave the PRD untouched, and revisit only if a reviewer or a future PRD revision picks it up. Picked **(3)** for the S020 round at the user's "no PRD changes" instruction; recorded in §6 Out of scope so it is not lost.

---

## 6. Out of scope

- **R11 currency / country_code with migrations** — Could-class; **designed in S10 (stretch addendum)**. Not delivered until `/implement S10` runs. The slice adds `currency TEXT NOT NULL DEFAULT 'GBP'` + `country_code TEXT NOT NULL DEFAULT 'GB'` to the `snapshots` table and replaces the hard-coded `Intl` locale with a `formatMoney(pence, currency, countryCode)` helper.
- **R12 secure time-limited statement-sharing link** — Could-class; **designed in S11 (stretch addendum)**. Not delivered until `/implement S11` runs. Threat-model summary lives in S11; remaining gaps (single-use, revocation, rate limiting) are explicitly deferred and recorded in §5 trade-offs and (rate limiting) below.
- **R13 PDF export** — Could-class; **designed in S12 (stretch addendum)**. Not delivered until `/implement S12` runs. The PDF is generated on demand and never stored.
- **S11 rate limiting on share-link mint and resolve** — out for stretch; the 24-hour expiry is the only abuse-control primitive in S11. Production would need a per-persona / per-IP rate limit (in-process counter, edge middleware, or a dependency such as `@upstash/ratelimit`). Recorded so a future slice has a clear starting point.
- **S11 single-use link semantics and revocation UI** — out for stretch. Recorded in §5 trade-offs "S11 single-use deferred" and "S11 revocation deferred".
- **S12 tagged-PDF / SC 1.3.1 + 1.3.2 semantic tree** — out for stretch (limitation of `@react-pdf/renderer`). The HTML surfaces (`<DashboardView />`, `<HistoryList />`) remain the accessible primary surface; the PDF is a supplementary export. Recorded in §5 trade-offs "S12 no tagged-PDF".
- **S11 + S12 cross-integration** (rendering / downloading a PDF of a *shared* snapshot via a public link) — out for stretch. Each stretch slice is independent; combining them is a future slice with its own threat-model review.
- **S11 + S12 access-log redaction / token-off-URL redesign** — out for stretch. The bearer token in `/share/<rawToken>` and the snapshot UUID in `/dashboard/snapshot/<id>/pdf` will appear in any web-server / proxy / CDN access log; application-level R10 logging-hygiene tests cannot catch that layer. Three remediations exist (move identifier off URL path; suppress access logging at the framework / proxy layer; declare as a known limitation); stretch declares. Recorded in §5 trade-off "S11 + S12 access-log limitation under R10".
- **S11 + S12 coercion / forwarded-under-pressure consent affordance** — out for stretch (suspicion-level, no PRD citation). Adding an explicit consent step or a "who you shared this with" reminder would be a workflow-rule-2 gate-cross without an upstream R-row. Recorded in §5 trade-off "S11 + S12 coercion / forwarded-under-pressure risk (suspicion — no PRD citation)" so a future `/prd` revision can pick it up if reviewers want it.
- **S11 wire-layer indistinguishability of resolver miss / expiry / unknown-token** — out for stretch. Application-code response-body parity is asserted by the test commitments; response-header parity (`Cache-Control`, etc.) and timing-side-channel parity are not exercised. Recorded in §5 trade-off "S11 same-response posture (resolver) and same-error posture (mint) — separately".
- **Real authentication, account linking, Open Banking, credit-bureau integration** — N1.
- **Repayment-plan selection / arrangement confirmation / collections workflow / agent-facing UI / `POST /api/arrangements`** — N2, N3, N4 (and `NOTES.md` §7(b)). No code path here can introduce them.
- **Automated vulnerability classification** — N5. The product never infers vulnerability from numeric input; only the `/support` signpost from R7.
- **Email / SMS notifications, payments, CRM** — N6.
- **Multi-language UI** — N7. The interface is `en-GB` only.
- **Independent verification of FCA / GDPR paraphrases** — N8. We inherit `NOTES.md` §3's "not independently verified" labels; this spec does not introduce new regulatory citations.
- **Per-line delta UI / "this looks like a correction" affordance** — explicitly deferred per A5 and §5 trade-off.
- **E2E test framework (Playwright / Cypress)** — out for MVP; S7's coverage matrix against sync presentational components is the testing commitment. Async-page integration tests (`page.tsx` files) are correspondingly deferred — the page wrappers are thin I/O glue exercised by manual reviewer walkthrough.
- **Free-text customer-entered notes** — explicitly removed from S1 (§5 trade-off "Free-text note removed"). Adding any free-text input later requires a paired R-row in PRD covering its R10 posture (storage, rendering, PII expectations).
- **Production retention policy** — out per A4 + N8.
- **Open questions carried forward:** *None.* Q1–Q5 are all resolved by this spec (band thresholds + zero-income split → S1; first-snapshot delta → S5; irregular-income presentation → S1 `irregularIncomeNote` + S5 form `variable` flag; retention → kept at A4 default; corrections → kept at A5 default with no new affordance). If a reviewer or `/test-plan` surfaces a real gap, route it back to `/prd` per `.cursor/rules/00-workflow.mdc` rule 2.

---

## 7. Traceability table

### PRD → tech spec

| Requirement ID | Title | Tech-spec section ID | Notes |
|---|---|---|---|
| R1 | Meaningful affordability assessment | S1 (calculator + A1 near-breakeven note branch), S4 (`<DashboardView />` render) | S1 produces the typed outcome; S4 renders it. PRD's 3-band schema preserved by typing `band: Band \| null` for the no-data outcome (§5 trade-off). A1 ratified by appending a "near-breakeven" note when `0 < disposable ≤ 5% × income` — no fourth band introduced. |
| R2 | Snapshot + delta vs previous | S1 (`Delta` type), S2 (persistence + immutability), S5 (Server Action + delta rendering) | Immutability enforced at the repository (no UPDATE/DELETE paths). |
| R3 | Return later and view prior snapshots | S2 (`listSnapshots`), S6 (`<HistoryList />`) | Order: newest → oldest; all snapshots in record lifetime (A4). |
| R4 | Tests protect real cases | S7 (infrastructure + coverage commitments) + per-slice tests in S1, S2, S3, S4, S5, S6, S9 | Each `/implement S<n>` ships its own tests against the S7 infrastructure; S7-setup ships first per §3's recommended order. |
| R5 | Four canonical edge cases as first-class outcomes | S1 (branches a / b / c / d **and** the validation schema for case d), S4 (copy for each state), S5 (Server Action returns typed `ValidationError[]` for case d) | (a) zero-income split into its own outcome state; (b) shortfall; (c) no-data with `band: null`; (d) zod validation in S1 + inline error re-render in S5. |
| R6 | Tone appropriate for difficulty | S1 (`copy.ts`), S4 (rendering), S5 (`<UpdateForm />` form-copy strings — covered by the tone-token guard test extension), S9 (`framing.ts`), S7 (tone-token guard test scoped to all three of these copy surfaces); **S11 (`<ShareUnavailable />` copy + `<SharedStatementView />` reuses S1 / S4 / S9 strings) — inherited via stretch addendum; S12 (PDF reuses S1 `copy.ts` strings for reasons / signpost and S9 `framing.ts` for the "About this assessment" block — no new tone-bearing strings; the existing S7 tone-token guard inherits coverage automatically because it scans the source modules, resolves S021-fix F1.10)** | Forbidden-token guard is the testable contract; framing copy additionally guarded against advice-implying tokens. S11's `<ShareUnavailable />` adds one new copy string ("This link is no longer available …") that the stretch tone-token guard scans when `/implement S11` runs. S12 contributes no new copy strings — its tone surface is exactly the S1 + S9 strings under their existing guard. |
| R7 | Human-support signpost on every outcome surface | S4 (`<SupportSignpost />` rendered inside `<DashboardView />`), S6 (`<SupportSignpost />` rendered inside `<HistoryList />`, both empty and populated states), S7 (signpost-ubiquity test extended to `<HistoryList />`); **S11 (`<SharedStatementView />` — outcome surface for the recipient), S12 (PDF support-signpost text block) — both via stretch addendum, conscious-broadening recorded in §3 S11 / S12** | Emphasis scales with outcome state via copy variants and font weight, not by colour alone. The empty-state CTA in `<HistoryList />` is a separate element pointing at `/dashboard/update`; the signpost is a distinct element pointing at human support. **`<ShareUnavailable />` (S11) deliberately does NOT render the signpost** — it carries no outcome, so R7 does not attach (decision recorded in §3 S11). |
| R8 | 7-persona fixture set | S3 | Per-persona starting £-values pinned in S3; `morgan-drew` is the joint-income (multi-earner) shape. |
| R9 | Customer understands *why* + *how it has changed* | S1 (`reasons[]`), S4 (Reasoning panel + Delta panel), S9 (framing notice articulates what the result *is not* — completing the "understand what + understand why + understand the limits" arc together with S1/S4) | Plain-language reasons, no formula disclosure. |
| R10 | Data minimisation; no PII in logs | S1 (no logging in calculator), S2 (lifecycle logs only — path-string scrub added in S021, see S7 row), S1 / §5 trade-off (no free-text fields), §4 cross-cutting, S7 (logging-hygiene test); **S11 + S12 (application-code logging hygiene scoped explicitly; framework / access-log layer carried out via §5 trade-off "S11 + S12 access-log limitation under R10"); S11 (R10 + R12 joint broadening — cache / indexing posture on `/share/[token]`: `no-store, private` + `noindex, nofollow` + `robots.txt` disallow, recorded in S11 "Cache / indexing posture" + closing R10/R12 sentence, resolves S021-fix F1.6); S11 (R10 + R12 joint broadening — no persona-identity in recipient-facing DOM under `/share/*`, recorded in S11 "`AppHeader` behaviour on `/share/[token]`" + closing R10/R12 sentence, resolves S021-fix F1.7)** | Enforced by test in S7; surface area minimised by removing the free-text `note` field. **Stretch scope:** R10 attaches to S11 + S12 at the application-code layer; the bearer-token-in-URL (S11) and snapshot-id-in-URL (S12) leak via Next.js / proxy access logs is acknowledged as an out-of-stretch limitation rather than closed. **S021-fix conscious readings:** R10 + R12 are jointly read in S11 as covering "(a) third-party caches, search engines, and crawlers must not retain shared content; (b) the recipient must not see the sharer's persona identity in any DOM element under `/share/*`" — mirrors the R20 / R7 broadening pattern already in S11 / S12. If a future PRD revision wants to narrow these readings, the S11 subsections are the right places to revisit (route back to `/prd`). |
| R11 | currency + country_code + migrations | S10 (stretch addendum — designed, not delivered) | Could-class; landed as a designed `S*` in the S020 stretch addendum. Migration adds `currency` / `country_code` defaults; `formatMoney` helper replaces hard-coded `Intl.NumberFormat`. Not implemented until `/implement S10` runs. |
| R12 | Time-limited statement-share link | S11 (stretch addendum — designed, not delivered) | Could-class; landed as a designed `S*` in the S020 stretch addendum. SHA-256-hashed bearer token, 24-hour expiry, ownership-checked at mint, generic safe message on miss/expiry. Not implemented until `/implement S11` runs. Single-use, revocation, and rate limiting are explicitly deferred (§5, §6). |
| R13 | PDF export | S12 (stretch addendum — designed, not delivered) | Could-class; landed as a designed `S*` in the S020 stretch addendum. `@react-pdf/renderer` on a Next.js Route Handler; no PDF storage; `Cache-Control: no-store, private`; tagged-PDF deferred. Not implemented until `/implement S12` runs. |
| R14 | README at repo root | S8 | Refresh at the end of each `/implement` slice. |
| R15 | DECISIONS.md at repo root | S8 | Includes time-spent table for R17. |
| R16 | Full AI prompt history retained | S8 | Already enforced by `ai-history` user rule + `.specstory/` capture; S8 keeps `docs/PROMPT_HISTORY.md` current. |
| R17 | Approximate time spent recorded | S8 | Table in `DECISIONS.md`. |
| R18 | Screen-reader + motor accessibility | S4 (`<DashboardView />` a11y commitments), S5 (form a11y commitments), S6 (list / time / disclosure semantics), S9 (`<FramingNotice />` landmark), S7 (per-component `vitest-axe` smoke); **S10 (no new surface — `formatMoney` returns the same locale-aware string), S11 (`<SharedStatementView />` inherits S4 commitments; `<ShareSnapshotForm />` is a button + readonly input with `aria-describedby`; `<ShareUnavailable />` smoke is included for completeness but is not load-bearing — the page is one heading + one paragraph), S12 (PDF static document; tagged-PDF carry-out per §6) — all via stretch addendum** | Conformance level pinned at **WCAG 2.2 AA**; reflow at 400% zoom / 320 CSS-px (SC 1.4.10). **Stretch scope:** R18 attaches to S11's HTML surfaces in full; S12's PDF is a supplementary export — tagged-PDF semantic structure (SC 1.3.1 / 1.3.2 for screen-reader navigation of the PDF itself) is a known limitation of `@react-pdf/renderer` and is carried out in §6, with the HTML surfaces (`<DashboardView />` / `<HistoryList />`) remaining the accessible primary surface. |
| R19 | Stretch items tested to the R4 standard if delivered | S10, S11, S12 (test-discipline; conditional on each Stretch's delivery) | Each stretch slice in the S020 addendum carries its own coverage commitments (S10: migration / repository / `formatMoney`; S11: token / repository / Server Action / resolver / `<SharedStatementView />` / `<ShareUnavailable />` / a11y; S12: ownership / handler / PDF byte-prefix / outcome coverage / `formatMoney` integration / no-file-write). `T*` IDs assigned by `/test-plan` once a stretch is picked up. |
| R20 | Reflection-not-advice framing on every outcome screen | S9 (design + `<FramingNotice />` + `framing.ts`), S4 / S5 / S6 (rendered placement), S7 (framing-copy and framing-ubiquity tests); **S11 (`<SharedStatementView />` — outcome surface for the recipient), S12 (PDF "About this assessment" framing block) — both via stretch addendum, conscious-broadening recorded in §3 S11 / S12** | Owns the disclaimer surface that the prior tech-spec draft inlined under R6 + R9 (closes S007 critic F4.3). **`<ShareUnavailable />` (S11) deliberately does NOT render the framing notice** — it carries no outcome, so R20's "every outcome screen" wording does not attach (decision recorded in §3 S11; mirrors S007 round-2 F2.1 narrowing). If a future PRD revision wants to narrow R20 back from "outcome screen on any device" to "outcome screen within an authenticated session", that is a `/prd` change. |
