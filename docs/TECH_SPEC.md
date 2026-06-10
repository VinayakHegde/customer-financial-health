# Customer Financial Health — Technical Specification

> **Phase:** Tech spec
> **Inputs consumed:** `docs/PRD.md` (R1–R20), `docs/discovery/NOTES.md` (§6 OQ-5 SQLite direction; §6 OQ-6 persona schema), `AGENTS.md`, `node_modules/next/dist/docs/01-app/` (Next.js 16 App Router conventions, Server Functions, Vitest guide, async `cookies()`/`headers()` ramifications), the S007 critic review of the prior tech-spec draft.
> **Gate criteria for next phase (`/test-plan`):**
> - Every `Must` requirement in `docs/PRD.md` (R1–R4, R14–R17) maps to at least one `S*` slice in §7 (Traceability table).
> - Every `S*` slice cites at least one `R*` ID.
> - All architecturally-blocking PRD open questions (Q1–Q5) are either resolved here or carried under §6 **Open questions** with their impact named.
> - Data shape for `Snapshot` and `IncomeAndExpenditure` is concrete enough that `/test-plan` can write `T*` cases against it without further design.
> - Page-vs-Component split is explicit for every route, so `/test-plan` knows which surface is async-I/O and which is sync-render.
> **Status:** Draft (revision 3 — incorporates S007 round-2 critic findings F1.1–F9.3; closes the slice-ordering and WCAG 2.2-specific-SC gaps found in revision 2)

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

- **Data hygiene (R10).** Logging in this module is limited to `db: migration applied` / `db: opened path=<path>` — no row contents, no IE payloads, no customer ids in log output. Errors surface as typed `Error` with generic messages; the original error stays in the Node-side stack only.

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
  | Repository logging hygiene | A spy on `console.*` during db open + 2 createSnapshot calls records zero IE-value digits and zero customer-id strings | S2 | R10 |
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
- **Stretch security model for R12 (deferred — S005 handoff).** Not designed here. If `/implement` decides to attempt R12, a new `S*` slice is required first, with a written threat model (link scope, expiry, single-use, revocation, rate limit). Until then, R12 is out (§6).

---

## 6. Out of scope

- **R11 currency / country_code with migrations** — Could-class; not delivered in this spec. If picked up later, a new slice would add `currency TEXT NOT NULL DEFAULT 'GBP'` + `country_code TEXT NOT NULL DEFAULT 'GB'` to the `snapshots` table and replace the hard-coded `Intl` locale.
- **R12 secure time-limited statement-sharing link** — Could-class; not designed here. A new `S*` slice is required first; see §5 trade-off note.
- **R13 PDF export** — Could-class; not designed here.
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
| R6 | Tone appropriate for difficulty | S1 (`copy.ts`), S4 (rendering), S5 (`<UpdateForm />` form-copy strings — covered by the tone-token guard test extension), S9 (`framing.ts`), S7 (tone-token guard test scoped to all three of these copy surfaces) | Forbidden-token guard is the testable contract; framing copy additionally guarded against advice-implying tokens. |
| R7 | Human-support signpost on every outcome surface | S4 (`<SupportSignpost />` rendered inside `<DashboardView />`), S6 (`<SupportSignpost />` rendered inside `<HistoryList />`, both empty and populated states), S7 (signpost-ubiquity test extended to `<HistoryList />`) | Emphasis scales with outcome state via copy variants and font weight, not by colour alone. The empty-state CTA in `<HistoryList />` is a separate element pointing at `/dashboard/update`; the signpost is a distinct element pointing at human support. |
| R8 | 7-persona fixture set | S3 | Per-persona starting £-values pinned in S3; `morgan-drew` is the joint-income (multi-earner) shape. |
| R9 | Customer understands *why* + *how it has changed* | S1 (`reasons[]`), S4 (Reasoning panel + Delta panel), S9 (framing notice articulates what the result *is not* — completing the "understand what + understand why + understand the limits" arc together with S1/S4) | Plain-language reasons, no formula disclosure. |
| R10 | Data minimisation; no PII in logs | S1 (no logging in calculator), S2 (lifecycle logs only), S1 / §5 trade-off (no free-text fields), §4 cross-cutting, S7 (logging-hygiene test) | Enforced by test in S7; surface area minimised by removing the free-text `note` field. |
| R11 | currency + country_code + migrations | — (out of scope; design sketched in §5 / §6) | Could-class; not delivered. |
| R12 | Time-limited statement-share link | — (out of scope; requires new `S*` + threat model; MSW reconsidered if attempted) | Could-class; not delivered. |
| R13 | PDF export | — (out of scope) | Could-class; not delivered. |
| R14 | README at repo root | S8 | Refresh at the end of each `/implement` slice. |
| R15 | DECISIONS.md at repo root | S8 | Includes time-spent table for R17. |
| R16 | Full AI prompt history retained | S8 | Already enforced by `ai-history` user rule + `.specstory/` capture; S8 keeps `docs/PROMPT_HISTORY.md` current. |
| R17 | Approximate time spent recorded | S8 | Table in `DECISIONS.md`. |
| R18 | Screen-reader + motor accessibility | S4 (`<DashboardView />` a11y commitments), S5 (form a11y commitments), S6 (list / time / disclosure semantics), S9 (`<FramingNotice />` landmark), S7 (per-component `vitest-axe` smoke) | Conformance level pinned at **WCAG 2.2 AA**; reflow at 400% zoom / 320 CSS-px (SC 1.4.10). |
| R19 | Stretch items tested to the R4 standard if delivered | — (conditional on R11/R12/R13 delivery) | Would attach to whichever `S*` slice delivers a Stretch. |
| R20 | Reflection-not-advice framing on every outcome screen | S9 (design + `<FramingNotice />` + `framing.ts`), S4 / S5 / S6 (rendered placement), S7 (framing-copy and framing-ubiquity tests) | Owns the disclaimer surface that the prior tech-spec draft inlined under R6 + R9 (closes S007 critic F4.3). |
