# Customer Financial Health — Test Plan

> **Phase:** Test plan
> **Inputs consumed:** `docs/PRD.md` (R1–R20), `docs/TECH_SPEC.md` (S1–S9, S7-setup), `docs/discovery/NOTES.md` (§6 OQ-6 persona schema; §6 A-2 mock-auth assumption)
> **Gate criteria for next phase (`/implement`):**
> - Every `Must` requirement in `docs/PRD.md` (R1–R4, R14–R17) is covered by at least one `T*` test case in §3.
> - Every `T*` cites at least one `R*` ID and at least one `S*` ID.
> - Every `Should` requirement in scope for MVP (R5–R10, R18, R20) is covered by at least one `T*`; gaps are listed explicitly under §5 **Coverage matrix**, not implied.
> - Forbidden tone and advice-implying token lists are finalised (§2) so `/implement S7-setup` can export them to `tests/_helpers/forbiddenToneTokens.ts`.
> - No test case requires E2E / Playwright, async Server Component rendering, or the React `useActionState` runtime — per tech-spec §4 / §5 acknowledged limits.
> **Status:** Draft

---

## 1. Strategy

This plan protects **customer-visible and regulatory behaviours** from the PRD — not internal call counts, private helpers, or framework wiring.

| Test type | Runner / tooling | Where tests live | What it protects |
|---|---|---|---|
| **Unit** | Vitest | `lib/**/*.test.ts`, `tests/_helpers/` | Pure domain (calculator, validation, copy, framing), repository round-trips, Server Action handlers called directly with `FormData` fixtures |
| **Component (render)** | Vitest + `@testing-library/react` + jsdom | `components/**/*.test.tsx` | Sync presentational components: outcome copy, signpost ubiquity, form error UX, history list semantics |
| **Accessibility (a11y)** | Vitest + `vitest-axe` (axe-core) | Alongside component tests | WCAG 2.2 AA smoke on every sync presentational component in pristine and error states (R18) |
| **Integration (manual)** | Reviewer walkthrough | Not automated in MVP | Async `page.tsx` I/O glue, cookie redirect, seed-on-first-request, full browser form submit → redirect |
| **E2E** | — | Out of scope | Deferred per tech-spec §6; no Playwright in MVP |

**Implementation order for tests** mirrors tech-spec §3: `S7-setup` ships first (Vitest config, helpers, token lists), then each `/implement S<n>` lands the `T*` rows it owns alongside its code.

**R4 discipline (F7.6):** every R5 edge-case branch is exercised with at least one R8 persona fixture where applicable; the calculator branch matrix (T1–T6) is the primary binding. See §2.1 persona-to-branch table for which persona hits which branch; exact breakeven uses synthetic `ieBreakevenExact` because no R8 persona produces DI = 0.

**Skipped test IDs:** T15–T17 are intentionally unused (reserved). Test IDs are append-only; an earlier draft numbering pass left these slots empty rather than reusing them.

---

## 2. Shared fixtures and token lists

### 2.1 Synthetic fixtures (no real PII)

All currency values are **integer pence**. Persona ids and labels are fictional per tech-spec S3.

| Fixture name | Shape | Used by |
|---|---|---|
| `iePatSurplus` | Single earner 320 000p; expenditure lines summing to 180 000p | T5, T8, T22, T45 |
| `ieSamNearBreakeven` | Single earner 195 000p; expenditure ~186 000p (disposable ≤ 5% × income) | T5, T8 |
| `ieJordanShortfall` | Single earner 165 000p; expenditure > income | T3, T8, T22 |
| `ieAlexZeroIncome` | Earner 0p; expenditure > 0 | T2, T8, T22 |
| `ieRileyNoData` | Empty earners and expenditure arrays | T1, T8, T26 |
| `ieCaseyIrregular` | Earner with `variable: true` | T8, T22 |
| `ieMorganDrewJoint` | Two earners (180 000p + 140 000p); joint expenditure | T8, T22 |
| `ieBreakevenExact` | Income equals expenditure exactly (disposable 0) | T4 |
| `ieNegativeAmount` | At least one `amountPence` < 0 | T7 |
| `ieNonNumericAmount` | Non-numeric amount field in FormData | T7, T19 |
| `ieOversizeLabel` | Label > 80 characters | T7 |
| `snapshotWithOutcome` | Full `Snapshot` object with denormalised `AffordabilityOutcome` | T21, T26, T33, T45 |
| `deltaFirstSnapshot` | `{ kind: 'first-snapshot' }` | T21, T23 |
| `deltaChangeImproved` / `deltaChangeWorsened` / `deltaChangeUnchanged` | `{ kind: 'change', disposableDeltaPence, bandChange, previousTakenAt }` | T33 |
| `validationErrorsFixture` | `{ ok: false, errors: ValidationError[] }` with field-level messages | T24, T25 |
| `formDataValidJordan` | FormData encoding of a valid I&E for persona `jordan` | T18 |
| `formDataInvalidNegative` | FormData with negative amount | T19 |

Seeding: tech-spec S3 inserts starting snapshots for six personas (all except `riley`) on first DB open. Tests that need an empty DB use `makeDb()` without seeding or a dedicated empty-customer id.

**Persona-to-branch applicability (F7.6):**

| Persona id | Starting outcome (tech-spec S3) | Calculator branch | Primary `T*` |
|---|---|---|---|
| `pat` | surplus | surplus | T8 |
| `sam` | surplus (near-breakeven note) | surplus | T5, T8 |
| `jordan` | shortfall | shortfall | T3, T8 |
| `alex` | zero-income | zero-income | T2, T8 |
| `riley` | no-data (no starting snapshot) | no-data | T1, T8 |
| `casey` | surplus + `irregularIncomeNote` | surplus | T8 |
| `morgan-drew` | surplus (joint household) | surplus | T8 |
| *(synthetic)* `ieBreakevenExact` | — | breakeven (exact DI = 0) | T4 |

None of the seven R8 personas produces exact breakeven (`sam` is a small surplus with a near-breakeven note, not DI = 0). T4 uses synthetic `ieBreakevenExact` for that branch.

### 2.2 Forbidden token lists (finalised)

Exported from `tests/_helpers/forbiddenToneTokens.ts` at `/implement S7-setup`. Scanned case-insensitively as whole words or phrases (substring match is acceptable for multi-word phrases).

**Tone tokens (R6)** — collections-aggressive, punitive, or urgency language:

`must`, `now`, `urgent`, `failed`, `bad`, `wrong`, `should have`, `guilty`, `irresponsible`, `irresponsible spending`, `you owe`, `pay now`, `act now`, `immediately`, `deadline`, `penalty`, `default`, `delinquent`, `shame`, `blame`

**Advice-implying tokens (R20)** — language that could imply regulated financial advice:

`recommend`, `advise`, `suggest you`, `you should`, `we recommend`, `our advice`, `financial advice`, `you must`, `best option`, `you need to`

**R20 required negation (T43):** `framingNotice()` body must contain a phrase equivalent to "not financial advice" (tech-spec S9).

**Operationalising subjective PRD adjectives (F5.5):**

| PRD term | Testable proxy |
|---|---|
| R6 "supportive, non-judgemental" | Absence of tone tokens in `copy.ts` headline, body, and `supportSignpost` strings (T29); absence of advice-implying tokens in the same surfaces |
| R7 "clear, visible signpost" | Non-empty support link `href` in every outcome state (T22, T27); copy variant differs for zero-income / shortfall vs surplus (T45) |
| R9 "plain language" | `reasons[]` present, no formula tokens (`*`, `/`, `=`) in customer-visible strings (T8) |
| R10 "no PII in logs" | `console.*` spy records zero submitted I&E amount values, zero customer/persona ids tied to row contents, and zero submitted earner or expenditure labels (T12, T20) |

---

## 3. Test cases

Each `T*` is append-only. **Owning slice** is the `/implement` session that ships the test file.

### S7-setup — Test infrastructure

#### T30 — Vitest harness boots

- **Type:** unit (infra)
- **Covers:** R4
- **Touches:** S7-setup
- **Given / When / Then:** Given `vitest.config.mts` and `package.json` scripts exist — When `pnpm test` (or `npm test`) runs with no application tests yet — Then the runner exits 0 and loads `@vitejs/plugin-react`, `vite-tsconfig-paths`, and jsdom.
- **Fixtures:** none

#### T31 — Shared helpers export

- **Type:** unit (infra)
- **Covers:** R4
- **Touches:** S7-setup
- **Given / When / Then:** Given `tests/_helpers/` — When imported in a smoke test — Then `makeDb()`, `formData()`, `withPersonaCookie()`, `renderWithPersona()`, and `forbiddenToneTokens` are all defined and usable.
- **Fixtures:** none

---

### S1 — Affordability domain (pure)

#### T1 — Calculator: no-data branch

- **Type:** unit
- **Covers:** R1, R5(c)
- **Touches:** S1
- **Given / When / Then:** Given `ieRileyNoData` (empty earners and expenditure) — When `assess(ie)` — Then `state === 'no-data'`, `band === null`, `disposableIncomePence === 0`, reasons include "don't have any income or outgoings".
- **Fixtures:** `ieRileyNoData`

#### T2 — Calculator: zero-income branch

- **Type:** unit
- **Covers:** R5(a), R1
- **Touches:** S1
- **Given / When / Then:** Given `ieAlexZeroIncome` — When `assess(ie)` — Then `state === 'zero-income'`, `band === 'shortfall'`, `disposableIncomePence < 0`.
- **Fixtures:** `ieAlexZeroIncome`

#### T3 — Calculator: shortfall branch

- **Type:** unit
- **Covers:** R5(b), R1
- **Touches:** S1
- **Given / When / Then:** Given `ieJordanShortfall` — When `assess(ie)` — Then `state === 'shortfall'`, `band === 'shortfall'`, reasons cite the £ shortfall and reference the largest expenditure line.
- **Fixtures:** `ieJordanShortfall`

#### T4 — Calculator: breakeven branch

- **Type:** unit
- **Covers:** R1, R5
- **Touches:** S1
- **Given / When / Then:** Given `ieBreakevenExact` — When `assess(ie)` — Then `state === 'breakeven'`, `band === 'breakeven'`, reasons cite income meeting outgoings.
- **Fixtures:** `ieBreakevenExact`

#### T5 — Calculator: surplus branch + near-breakeven note

- **Type:** unit
- **Covers:** R1, R5, R9
- **Touches:** S1
- **Given / When / Then:** Given `ieSamNearBreakeven` where `0 < disposable ≤ 5% × income` — When `assess(ie)` — Then `state === 'surplus'`, `band === 'surplus'`, reasons include a near-breakeven note. Given `iePatSurplus` — Then note is absent.
- **Fixtures:** `ieSamNearBreakeven`, `iePatSurplus`

#### T6 — Calculator: integer-pence invariant

- **Type:** unit
- **Covers:** R10, R4
- **Touches:** S1
- **Given / When / Then:** Given table of all persona I&E fixtures — When `assess(ie)` for each — Then every numeric field in the returned `AffordabilityOutcome` is an integer (no floats).
- **Fixtures:** all `ie*` persona fixtures

#### T7 — Validation: reject invalid input

- **Type:** unit
- **Covers:** R5(d), R4
- **Touches:** S1
- **Given / When / Then:**

| Input fixture | Expected |
|---|---|
| `ieNegativeAmount` | `ValidationError[]` with field-level message; no thrown exception |
| `ieNonNumericAmount` | Same |
| `ieOversizeLabel` | Same |
| Empty label (whitespace only) | Same |

- **Fixtures:** `ieNegativeAmount`, `ieNonNumericAmount`, `ieOversizeLabel`

#### T8 — Calculator: persona fixture matrix

- **Type:** unit
- **Covers:** R8, R4, R5, R9
- **Touches:** S1, S3
- **Given / When / Then:** Given each of the seven persona starting I&E payloads from `lib/personas.ts` — When parsed against the zod schema and passed to `assess()` — Then each produces the outcome state documented in tech-spec S3 table and the persona-to-branch table (§2.1); `reasons[]` is non-empty for all states except `no-data`; no formula tokens in reason strings; for `casey`, `irregularIncomeNote` is present and non-empty.
- **Fixtures:** all seven persona I&E fixtures

#### T29 — Tone guard: copy.ts

- **Type:** unit
- **Covers:** R6, R20
- **Touches:** S1
- **Given / When / Then:** Given `copy.ts` output for every `OutcomeState` — When `headline`, `body`, and `supportSignpost` strings are scanned — Then zero tone-token matches and zero advice-implying-token matches.
- **Fixtures:** all outcome states

---

### S2 — Persistence layer

#### T9 — Repository round-trip

- **Type:** unit (integration with in-memory SQLite)
- **Covers:** R2, R3, R4
- **Touches:** S2
- **Given / When / Then:** Given fresh `makeDb()` — When `createSnapshot` then `listSnapshots` and `getLatestSnapshot` — Then returned objects match S1 `Snapshot` shape; `ie_json` round-trips; list order is newest → oldest.
- **Fixtures:** `iePatSurplus` + assessed outcome

#### T10 — Repository immutability

- **Type:** unit
- **Covers:** R2, R4
- **Touches:** S2
- **Given / When / Then:** Given two `createSnapshot` calls for the same `customerId` — When `listSnapshots` — Then both rows exist, neither was updated or deleted, order is correct.
- **Fixtures:** two distinct I&E payloads

#### T11 — Repository: no-data band persists as null

- **Type:** unit
- **Covers:** R1, R5(c)
- **Touches:** S2
- **Given / When / Then:** Given outcome with `band: null` (no-data) — When persisted and read back — Then `band` is still `null` (schema allows nullable `band` column).
- **Fixtures:** `ieRileyNoData` outcome

#### T12 — DB logging hygiene

- **Type:** unit
- **Covers:** R10
- **Touches:** S2
- **Given / When / Then:** Given spy on `console.*` — When DB opens and two `createSnapshot` calls run with labelled earners and expenditure lines — Then log output contains none of: submitted I&E amount values, customer/persona ids tied to row contents, or submitted earner or expenditure labels (F7.3: covers `client.ts` open/migrate path and `snapshots.ts` create path only; not Server Action path — see T20).
- **Fixtures:** `ieJordanShortfall`

---

### S3 — Persona fixtures + mock auth

#### T13 — Persona fixtures shape

- **Type:** unit
- **Covers:** R8, R4
- **Touches:** S3
- **Given / When / Then:** Given `personas` array — When validated — Then exactly 7 entries; each starting I&E (where present) parses against zod schema; `riley` has no starting snapshot in seed data.
- **Fixtures:** `lib/personas.ts`

#### T14 — Persona cookie helper (mocked headers)

- **Type:** unit
- **Covers:** R8
- **Touches:** S3
- **Given / When / Then:** Given `withPersonaCookie('pat')` — When `getPersonaId()` — Then returns `'pat'`. Given `withPersonaCookie(null)` — Then returns `null`.
- **Fixtures:** none (mocked `next/headers`)

---

### S9 — Reflection-not-advice framing

#### T43 — Framing copy guard

- **Type:** unit
- **Covers:** R20, R6
- **Touches:** S9
- **Given / When / Then:** Given `framingNotice()` output — When scanned — Then body contains "not financial advice" (or equivalent); zero advice-implying token matches; zero tone token matches.
- **Fixtures:** none

#### T32 — FramingNotice component render

- **Type:** unit + a11y
- **Covers:** R20, R18
- **Touches:** S9
- **Given / When / Then:** Given render of `<FramingNotice />` — Then `<aside>` has `aria-labelledby`; support link is present with non-empty `href`; axe reports no violations.
- **Fixtures:** none

---

### S4 — Affordability surface (dashboard)

#### T21 — DashboardView: outcome states render

- **Type:** unit + a11y
- **Covers:** R1, R7, R9, R20
- **Touches:** S4, S9
- **Given / When / Then:** Given `<DashboardView />` rendered for each `OutcomeState` — Then headline, reasons panel, `<SupportSignpost />`, and `<FramingNotice />` are present; when `outcome.band === null` or `state === 'no-data'`, band chip and disposable-income line are absent from the DOM; axe clean per state.
- **Fixtures:** `snapshotWithOutcome` per state

#### T22 — DashboardView: signpost ubiquity

- **Type:** unit
- **Covers:** R7, R6
- **Touches:** S4
- **Given / When / Then:** Given `<DashboardView />` for `no-data`, `zero-income`, and `shortfall` states — Then `<SupportSignpost />` renders a non-empty support link in every case (F3.4: "visible" = link present in DOM with accessible name, not colour-only emphasis).
- **Fixtures:** `ieRileyNoData`, `ieAlexZeroIncome`, `ieJordanShortfall` outcomes

#### T23 — DashboardView: first-snapshot delta placeholder

- **Type:** unit
- **Covers:** R2, R9
- **Touches:** S4, S5
- **Given / When / Then:** Given `deltaFirstSnapshot` — When `<DashboardView />` renders — Then A2 placeholder copy appears ("first snapshot" / "once you submit again").
- **Fixtures:** `deltaFirstSnapshot`

#### T33 — DashboardView: delta change sentence

- **Type:** unit
- **Covers:** R2, R9
- **Touches:** S4
- **Given / When / Then:** Given `deltaChangeImproved`, `deltaChangeWorsened`, `deltaChangeUnchanged` — When rendered — Then disposable £ change and band-change indicator appear in plain language.
- **Fixtures:** delta change fixtures

#### T44 — SupportSignpost: standalone render + axe smoke

- **Type:** unit + a11y
- **Covers:** R7, R18
- **Touches:** S4
- **Given / When / Then:** Given standalone render of `<SupportSignpost />` for each `OutcomeState` — Then non-empty support link with accessible name; axe reports no WCAG 2.2 AA violations.
- **Fixtures:** one props fixture per outcome state

#### T45 — SupportSignpost: outcome-scaled copy variant

- **Type:** unit
- **Covers:** R7
- **Touches:** S4
- **Given / When / Then:** Given `<SupportSignpost />` (or `<DashboardView />` signpost region) rendered for `surplus`, `zero-income`, and `shortfall` outcome states — When visible signpost copy text is compared — Then zero-income and shortfall copy text differs from surplus copy text (copy variant, not colour or CSS class assertions).
- **Fixtures:** `iePatSurplus`, `ieAlexZeroIncome`, `ieJordanShortfall` outcomes

#### T34 — DashboardView: accessibility smoke

- **Type:** a11y
- **Covers:** R18
- **Touches:** S4
- **Given / When / Then:** Given `<DashboardView />` rendered with each persona fixture — When axe runs — Then no WCAG 2.2 AA violations; single `<main>`, `<h1>`, section landmarks with `aria-labelledby`.
- **Fixtures:** all persona outcomes

---

### S5 — Snapshot submission flow

#### T18 — Server Action: happy path

- **Type:** unit
- **Covers:** R2, R5(d), R4
- **Touches:** S5
- **Given / When / Then:** Given `withPersonaCookie('jordan')` and `formDataValidJordan` — When action invoked — Then snapshot created in DB; `redirect('/dashboard')` mocked and called; `revalidatePath` called for `/dashboard` and `/history`.
- **Fixtures:** `formDataValidJordan`

#### T19 — Server Action: invalid input

- **Type:** unit
- **Covers:** R5(d), R10, R4
- **Touches:** S5
- **Given / When / Then:** Given invalid FormData (negative / non-numeric) — When action invoked — Then `{ ok: false, errors }` returned; no DB write; no redirect.
- **Fixtures:** `formDataInvalidNegative`

#### T35 — Server Action: missing persona cookie

- **Type:** unit
- **Covers:** R5(d)
- **Touches:** S5
- **Given / When / Then:** Given `withPersonaCookie(null)` — When action invoked — Then typed error returned, no throw, no DB write.
- **Fixtures:** none

#### T20 — Server Action: logging hygiene

- **Type:** unit
- **Covers:** R10
- **Touches:** S5
- **Given / When / Then:** Given spy on `console.*` — When happy-path action runs with labelled earners and expenditure lines in FormData — Then log output contains none of: submitted I&E amount values, customer/persona ids tied to row contents, or submitted earner or expenditure labels (F7.3: action handler path only).
- **Fixtures:** `formDataValidJordan`

#### T36 — First-snapshot delta shape (repository level)

- **Type:** unit
- **Covers:** R2
- **Touches:** S5
- **Given / When / Then:** Given exactly one snapshot for a customer — When delta computed — Then `{ kind: 'first-snapshot' }`.
- **Fixtures:** single snapshot via `makeDb()`

#### T24 — UpdateForm: error summary and field errors

- **Type:** unit + a11y
- **Covers:** R5(d), R18
- **Touches:** S5
- **Given / When / Then:** Given injected `validationErrorsFixture` — When `<UpdateForm />` renders after a failed submit — Then error summary at top has `role="alert"` and receives focus; invalid fields marked `aria-invalid="true"` with `aria-describedby`; axe clean in error state.
- **Fixtures:** `validationErrorsFixture`

#### T25 — UpdateForm: preserve input on error (SC 3.3.7)

- **Type:** unit
- **Covers:** R5(d), R18
- **Touches:** S5
- **Given / When / Then:** Given form pre-filled with multiple earners and expenditure rows — When error state re-rendered — Then all previously entered values remain in fields (customer does not re-type to fix one bad field).
- **Fixtures:** multi-row FormData state

#### T37 — UpdateForm: accessibility smoke

- **Type:** a11y
- **Covers:** R18
- **Touches:** S5
- **Given / When / Then:** Given `<UpdateForm />` pristine and error states — When axe runs — Then no violations; every input has programmatic `<label>`; fieldsets with legends for earners/expenditure.
- **Fixtures:** prefill + error fixtures

#### T38 — UpdateForm: tone guard on form copy

- **Type:** unit
- **Covers:** R6
- **Touches:** S5
- **Given / When / Then:** Given exported form label / hint / button strings — When scanned — Then zero tone token matches.
- **Fixtures:** form copy fixture

---

### S6 — History view

#### T26 — HistoryList: empty and populated states

- **Type:** unit + a11y
- **Covers:** R3, R7, R18, R20
- **Touches:** S6, S9
- **Given / When / Then:** Given empty snapshot list — Then empty-state message and CTA to `/dashboard/update`; `<SupportSignpost />` and `<FramingNotice />` present. Given ordered snapshots — Then `<ol>` with `<time dateTime>`, band chip suppressed for no-data rows, `<details>` disclosure for I&E breakdown; signpost and framing at bottom; axe clean both states.
- **Fixtures:** empty list; multi-snapshot list

#### T27 — HistoryList: signpost ubiquity

- **Type:** unit
- **Covers:** R7
- **Touches:** S6
- **Given / When / Then:** Given empty and populated lists — Then non-empty support link in both (F3.4).
- **Fixtures:** empty + populated lists

#### T39 — HistoryList: accessibility smoke

- **Type:** a11y
- **Covers:** R18
- **Touches:** S6
- **Given / When / Then:** Given populated list — When axe runs — Then no violations; `<dl>` semantics in disclosure; disclosure summary meets target size.
- **Fixtures:** multi-snapshot list

---

### S8 — Submission deliverables (manual / checklist)

#### T40 — README completeness (manual)

- **Type:** integration (manual checklist)
- **Covers:** R14
- **Touches:** S8
- **Given / When / Then:** Given fresh clone — When reviewer follows README — Then install, migrate/seed, dev, test, and build succeed without follow-up; README links to PRD, TECH_SPEC, TEST_PLAN, DECISIONS.
- **Fixtures:** none

#### T41 — DECISIONS.md completeness (manual)

- **Type:** integration (manual checklist)
- **Covers:** R15, R17
- **Touches:** S8
- **Given / When / Then:** Given `DECISIONS.md` — Then sections cover what was built (with S* refs), what was left out, what is next, why; time-spent table present.
- **Fixtures:** none

#### T42 — AI prompt history retained (manual)

- **Type:** integration (manual checklist)
- **Covers:** R16
- **Touches:** S8
- **Given / When / Then:** Given submission — Then `.specstory/history/` has transcripts and `docs/PROMPT_HISTORY.md` + `docs/ai/sessions/` are current through latest session.
- **Fixtures:** none

---

### Cross-cutting (implemented across slices; asserted in S7-setup contract)

#### T28 — Framing ubiquity across outcome views

- **Type:** unit
- **Covers:** R20
- **Touches:** S4, S6, S9
- **Given / When / Then:** Given standalone render of `<DashboardView />` and `<HistoryList />` — Then `<FramingNotice />` is in the document in both (not on host page).
- **Fixtures:** minimal props each

---

## 4. Edge cases and adverse paths

| Scenario | Test ID(s) | Expected behaviour |
|---|---|---|
| Zero disposable income (breakeven) | T4 | Non-alarming breakeven copy; signpost present |
| Negative disposable income | T3 | Shortfall copy cites £ gap; signpost copy differs from surplus (T45) |
| Zero income with expenditure | T2 | Distinct zero-income state; stronger signpost copy variant in UI (T45) |
| No I&E submitted yet | T1, T21, T26 | `no-data` state; band chip and disposable-income line absent from DOM; empty history CTA |
| Invalid / malicious input | T7, T19, T24 | Typed field errors; no stack trace; no DB write on reject |
| First snapshot (no prior delta) | T23, T36 | Placeholder copy; no numeric delta |
| Near-breakeven surplus (A1) | T5 | Surplus band with cautionary note, not celebration |
| Irregular income flag | T8 (`casey`) | `irregularIncomeNote` present in outcome |
| Joint household (two earners) | T8 (`morgan-drew`) | Combined income assessed correctly |
| Correction via new snapshot (A5) | T10 | Prior snapshot remains after second submit |
| Error re-submit without re-typing (WCAG 3.3.7) | T25 | All field values preserved |
| Accessibility on error states | T24, T25, T37 | Error summary receives focus (T24); values preserved (T25); axe clean |
| Logging must not leak I&E data | T12, T20 | No amounts, persona ids tied to rows, or earner/expenditure labels in logs |
| Missing persona cookie on submit | T35 | Typed error, no throw |

---

## 5. Coverage matrix

Every in-scope PRD requirement must appear at least once. **Gaps are explicit.**

| Requirement | Priority | Covered by | Notes |
|---|---|---|---|
| R1 | Must | T1, T3, T4, T5, T11, T21 | Meaningful assessment + band + plain language |
| R2 | Must | T9, T10, T18, T23, T33, T36 | Snapshot + delta |
| R3 | Must | T9, T26 | Return later / history |
| R4 | Must | T6–T10, T13, T18, T19, T30, T31, T8 | Meta: tests protect real cases; F7.6 via persona matrix |
| R5 | Should | T1–T5, T7, T8, T19, T24, T25 | All four canonical edge cases |
| R6 | Should | T22, T29, T43, T38 | Tone + advice-implying guards incl. `supportSignpost` (T29); signpost emphasis via copy variant (T45) |
| R7 | Should | T21, T22, T26, T27, T44, T45 | Signpost on every outcome surface; standalone axe (T44); scaled copy (T45) |
| R8 | Should | T8, T13 | 7-persona fixture set |
| R9 | Should | T5, T8, T21, T23, T33 | Reasons + delta plain language |
| R10 | Should | T6, T12, T20 | Data minimisation / logging (F7.3 scoped to db + action paths) |
| R11 | Could | — | **Gap (intentional):** out of scope per tech-spec §6 |
| R12 | Could | — | **Gap (intentional):** out of scope |
| R13 | Could | — | **Gap (intentional):** out of scope |
| R14 | Must | T40 | Manual README checklist |
| R15 | Must | T41 | Manual DECISIONS checklist |
| R16 | Must | T42 | Manual prompt-history checklist |
| R17 | Must | T41 | Time-spent table in DECISIONS |
| R18 | Should | T24, T25, T32, T34, T37, T39, T44 | WCAG 2.2 AA axe smoke + SC 3.3.7 + error-summary focus (T24) |
| R19 | Should | — | **Gap (conditional):** dormant until R11/R12/R13 delivered |
| R20 | Should | T28, T43, T32, T21, T26, T29 | Framing on outcome screens; advice-implying guard on `copy.ts` incl. `supportSignpost` (T29) |

**Must-requirement gate:** R1–R4 and R14–R17 all have ≥1 `T*` — **pass**.

**Should-requirement gate:** R5–R10, R18, R20 covered. R19 intentionally gap until Stretch delivery.

---

## 6. Out of scope

Deliberately **not** tested in MVP (per tech-spec §4, §5, §6):

- Async Server Component `page.tsx` files (`/`, `/dashboard`, `/dashboard/update`, `/history`) — manual walkthrough only
- E2E / Playwright / Cypress
- React `useActionState` end-to-end form-action runtime (T24/T25 inject error state via props)
- Real HTTP / MSW (no API surface)
- `revalidatePath` effect in production (mocked in T18)
- RSC FormData encoding boundary regressions
- Third-party library internals (Drizzle, Next.js, axe-core ruleset churn)
- R11 / R12 / R13 unless implemented (R19 would then require new `T*` rows)
- Real authentication, Open Banking, PDF export, share-link security
- Production retention TTL jobs
- Automated vulnerability classification (N5)
- `/support` route in isolation (signpost component covered via T22/T27/T44; full page is static)
- **File-based SQLite persistence across process restart (R3)** — in-memory `makeDb()` tests (T9) prove repository semantics only; surviving restart of `.data/financial-health.sqlite` is verified manually via reviewer walkthrough and README instructions (T40), not automated
- **Never auto-classifies vulnerability (N5 / R7)** — verified manually by absence of any vulnerability-classification code path in review; no automated negative test
- **400% zoom / 320 CSS-px reflow (WCAG 1.4.10)** — axe smoke (T34, T37, T39, T44) does not fully cover viewport reflow; remains a manual visual check during reviewer walkthrough

---

## 7. Traceability table

### Tech spec → test plan

| Tech-spec section ID | Requirement IDs covered | Test case IDs | Notes |
|---|---|---|---|
| S7-setup | R4 | T30, T31 | Vitest harness + helpers ship first |
| S1 | R1, R5, R6, R8, R9, R10, R20 | T1–T8, T29 | Pure domain; branch matrix + validation + copy guards |
| S2 | R1, R2, R3, R10 | T9–T12 | In-memory SQLite via `makeDb()` |
| S3 | R8 | T8, T13, T14 | Persona fixtures + cookie mock |
| S4 | R1, R2, R6, R7, R9, R18, R20 | T21–T23, T33, T34, T22, T28, T44, T45 | `<DashboardView />` + `<SupportSignpost />` render + a11y |
| S5 | R2, R5, R6, R9, R10, R18 | T18–T20, T24–T25, T35–T38, T36 | Server Action direct-call + `<UpdateForm />` |
| S6 | R3, R7, R18, R20 | T26, T27, T39, T28 | `<HistoryList />` |
| S8 | R14, R15, R16, R17 | T40–T42 | Manual submission checklists |
| S9 | R6, R9, R18, R20 | T28, T43, T32 | Framing copy + component |

### Test plan → implementation (status tracking)

T15–T17 are reserved (unused); see §1.

| Test case ID | Requirement IDs | Tech-spec section IDs | Status |
|---|---|---|---|
| T1 | R1, R5 | S1 | Pending |
| T2 | R5, R1 | S1 | Pending |
| T3 | R5, R1 | S1 | Pending |
| T4 | R1, R5 | S1 | Pending |
| T5 | R1, R5, R9 | S1 | Pending |
| T6 | R10, R4 | S1 | Pending |
| T7 | R5, R4 | S1 | Pending |
| T8 | R8, R4, R5, R9 | S1, S3 | Pending |
| T9 | R2, R3, R4 | S2 | Pending |
| T10 | R2, R4 | S2 | Pending |
| T11 | R1, R5 | S2 | Pending |
| T12 | R10 | S2 | Pending |
| T13 | R8, R4 | S3 | Pending |
| T14 | R8 | S3 | Pending |
| T18 | R2, R5, R4 | S5 | Pending |
| T19 | R5, R10, R4 | S5 | Pending |
| T20 | R10 | S5 | Pending |
| T21 | R1, R7, R9, R20 | S4, S9 | Pending |
| T22 | R7, R6 | S4 | Pending |
| T23 | R2, R9 | S4, S5 | Pending |
| T24 | R5, R18 | S5 | Pending |
| T25 | R5, R18 | S5 | Pending |
| T26 | R3, R7, R18, R20 | S6, S9 | Pending |
| T27 | R7 | S6 | Pending |
| T28 | R20 | S4, S6, S9 | Pending |
| T29 | R6, R20 | S1 | Pending |
| T30 | R4 | S7-setup | Pending |
| T31 | R4 | S7-setup | Pending |
| T43 | R20, R6 | S9 | Pending |
| T32 | R20, R18 | S9 | Pending |
| T33 | R2, R9 | S4 | Pending |
| T34 | R18 | S4 | Pending |
| T35 | R5 | S5 | Pending |
| T36 | R2 | S5 | Pending |
| T37 | R18 | S5 | Pending |
| T38 | R6 | S5 | Pending |
| T39 | R18 | S6 | Pending |
| T40 | R14 | S8 | Pending (manual) — S018 shipped `README.md` |
| T41 | R15, R17 | S8 | Pending (manual) — S018 shipped `DECISIONS.md` (incl. time-spent table) |
| T42 | R16 | S8 | Pending (manual) — S018 backfilled `docs/PROMPT_HISTORY.md` |
| T44 | R7, R18 | S4 | Pending |
| T45 | R7 | S4 | Pending |

