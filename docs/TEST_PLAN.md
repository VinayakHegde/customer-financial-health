# Customer Financial Health — Test Plan

> **Phase:** Test plan
> **Inputs consumed:** `docs/PRD.md` (R1–R20), `docs/TECH_SPEC.md` (S1–S9, S7-setup; **S10 / S11 / S12 stretch addendum at rev 5.1**), `docs/discovery/NOTES.md` (§6 OQ-6 persona schema; §6 A-2 mock-auth assumption)
> **Gate criteria for next phase (`/implement`):**
> - Every `Must` requirement in `docs/PRD.md` (R1–R4, R14–R17) is covered by at least one `T*` test case in §3.
> - Every `T*` cites at least one `R*` ID and at least one `S*` ID.
> - Every `Should` requirement in scope for MVP (R5–R10, R18, R20) is covered by at least one `T*`; gaps are listed explicitly under §5 **Coverage matrix**, not implied.
> - Forbidden tone and advice-implying token lists are finalised (§2) so `/implement S7-setup` can export them to `tests/_helpers/forbiddenToneTokens.ts`.
> - No test case requires E2E / Playwright, async Server Component rendering, or the React `useActionState` runtime — per tech-spec §4 / §5 acknowledged limits.
> - **Stretch gate (R19, conditional):** the `T*` rows in §3 owned by S10 / S11 / S12 (`T46`–`T76`) are spec-only today; when `/implement S10` (or `S11` / `S12`) runs, every `T*` row owned by that slice ships alongside its code. No stretch row is allowed to fall back on the framework / proxy / access-log layer (per tech-spec §5 trade-off "S11 + S12 access-log limitation under R10") or assert PDF pixel layout (per tech-spec §S12 test-scope note).
> **Status:** Draft (S022 stretch extension — S10 / S11 / S12 test commitments lifted from tech-spec §3 rev 5.1; T46–T76 appended; T15–T17 stay `Reserved` to preserve append-only ordering; MVP T1–T14, T18–T45 are unchanged)

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

**R19 discipline (stretch addendum, S022).** Every stretch `T*` (T46–T76) cites both the feature `R*` (R11 for S10; R12 for S11; R13 for S12) **and** R19 (the test-discipline requirement). The shape of each stretch slice's coverage mirrors R4 — branch matrix + validation + repository round-trip + logging hygiene + a11y where there is a render surface — not happy-path-only. Two further stretch-wide guardrails enforced by §3 rows:

1. **Application-code scope for R10.** Stretch logging-hygiene rows (T51, T67, T74) spy on `console.*` only — never on Next.js's request logger, reverse-proxy access log, or CDN log. The bearer-token-in-URL (S11) and snapshot-id-in-URL (S12) leak into infrastructure logs is recorded as a known limitation in §6 (and in tech-spec §5 trade-off "S11 + S12 access-log limitation under R10"); no `T*` asserts against that layer.
2. **PDF presence, not layout, for S12.** Stretch PDF rows (T72, T73) assert required-content **presence** using a text-extraction helper (e.g. `pdf-parse` or `pdfjs-dist`); no `T*` asserts pixel layout, font kerning, line-wrap positions, page count beyond the library's defaults, byte-for-byte buffer equality, or tagged-PDF semantic structure (WCAG SC 1.3.1 / 1.3.2 — carried out per tech-spec §6 + §5 trade-off "S12 no tagged-PDF").

**Skipped test IDs:** T15–T17 are intentionally unused (reserved). Test IDs are append-only; an earlier draft numbering pass left these slots empty rather than reusing them. The S021 tech-spec handoff nominated T15–T17 as natural insertion points for stretch coverage, but `/test-plan` (S022) chose to **keep them reserved** and append from T46 instead — preserves the strict-append-only read of the §7 status table and avoids intermixing MVP and stretch IDs in the lower decimal range.

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

**Stretch tone-token guard.** When `<ShareUnavailable />` (S11) lands, its single new copy string — "This link is no longer available. Please ask the person who shared it to send a new one." (or its `/implement S11` equivalent) — is scanned by the same forbidden-token lists above. T76 owns the assertion. S12 contributes no new copy strings (PDF reuses S1 `copy.ts` and S9 `framing.ts`), so the existing T29 / T43 scans inherit S12 automatically — no separate stretch `T*` is allocated for S12 tone (per tech-spec §7 R6 row).

**Operationalising subjective PRD adjectives (F5.5):**

| PRD term | Testable proxy |
|---|---|
| R6 "supportive, non-judgemental" | Absence of tone tokens in `copy.ts` headline, body, and `supportSignpost` strings (T29); absence of advice-implying tokens in the same surfaces |
| R7 "clear, visible signpost" | Non-empty support link `href` in every outcome state (T22, T27); copy variant differs for zero-income / shortfall vs surplus (T45) |
| R9 "plain language" | `reasons[]` present, no formula tokens (`*`, `/`, `=`) in customer-visible strings (T8) |
| R10 "no PII in logs" | `console.*` spy records zero submitted I&E amount values, zero customer/persona ids tied to row contents, and zero submitted earner or expenditure labels (T12, T20) |

### 2.3 Stretch fixtures (S10 / S11 / S12 — spec-only until `/implement` runs)

All stretch fixtures use synthetic data and the same integer-pence + fictional-persona discipline as §2.1. Names are deliberately distinct (`share*` / `pdf*` / `pinned*`) from the MVP fixture names so an import-graph reader can tell at a glance which slice a test belongs to.

| Fixture name | Shape | Used by |
|---|---|---|
| `snapshotJordanStoredGbp` | A `Snapshot` returned by `createSnapshot` for `jordan` with `currency: 'GBP'`, `countryCode: 'GB'` populated by column defaults | T47, T48, T56, T57, T59, T60, T64, T67, T69, T72, T73, T74, T75 |
| `snapshotPatStoredGbp` | Same, for `pat` | T57, T64, T70, T72 |
| `pinnedNowUtc` | `new Date('2026-06-12T00:00:00Z')` — UTC instant used by mocked `nowUtc()` | T55, T56, T59, T60, T67 |
| `nowJustAfterExpiry` | `new Date(pinnedNowUtc.getTime() + 24 * 60 * 60 * 1000 + 1)` — one ms past the 24h boundary | T54, T55, T60 |
| `shareTokenPinned` | `{ raw: '<43-char base64url>', hash: '<64-char lowercase hex>' }` — produced once at fixture load via `generateShareToken()` and frozen so deterministic hash-lookup tests are possible | T52, T54, T55, T56, T59, T60, T64 |
| `shareLinkRowJordan` | `{ id: <uuid>, snapshotId: snapshotJordanStoredGbp.id, tokenHash: shareTokenPinned.hash, expiresAt: pinnedNowUtc + 24h, createdAt: pinnedNowUtc }` — the row `createShareLink` produces | T54, T56, T60 |
| `formattedJordanDisposable` | The string `formatMoney(snapshotJordanStoredGbp.outcome.disposableIncomePence, 'GBP', 'GB')` evaluates to (e.g. `'£234.50'`) | T49, T73 |
| `pdfTextExtractor` | Test helper (not strictly a fixture) that takes a PDF `Buffer` and returns concatenated text via `pdf-parse` (or `pdfjs-dist`'s `getTextContent`) — defined in `tests/_helpers/pdfText.ts` once `/implement S12` runs | T72, T73 |
| `shareUnavailableCopySample` | The single string `<ShareUnavailable />` renders ("This link is no longer available …") plus any sibling copy in the component, exported from the test helper so the stretch tone-token guard can scan it directly | T76 |
| `mockClock(pinned)` | Test helper (not a fixture). **Implementation note for `/implement S11`:** Vitest hoists `vi.mock(...)` calls to the top of the test file (above any imports), so `mockClock(pinned)` cannot be a function call that wraps `vi.mock` — the `pinned` value would not be available at hoist time. Two acceptable shapes: (a) export a **factory** `mockClock(pinned)` that returns the `vi.mock` factory function, then the test file writes `vi.mock('@/lib/share/clock', () => mockClock(pinned).factory)` with `pinned` defined as a top-level `const` that is also hoisted; (b) skip the wrapper entirely and have each test file write `vi.mock('@/lib/share/clock', () => ({ nowUtc: () => new Date('...') }))` inline. Either this helper or `vi.useFakeTimers(); vi.setSystemTime(pinned)` is acceptable per tech-spec §S11; `/test-plan` does not pin the choice per `T*` row — `/implement S11` picks one per file. | T55, T56, T59, T60, T67 |

**Seeding for stretch:** `<ShareSnapshotForm />` (T66) and the share-mint happy path (T56) require an already-stored snapshot for `jordan`. The S3 seed (existing) inserts starting snapshots for six personas on first DB open; `snapshotJordanStoredGbp` is the row that seeder produces once the S10 migration has added the `currency` / `country_code` columns with defaults. Tests that need a clean DB use `makeDb()` directly without the seed step (existing pattern).

**Persona-to-stretch applicability:**

| Persona id | Has starting snapshot post-S10 migration? | Stretch `T*` that consume this persona |
|---|---|---|
| `pat` | Yes (`currency: 'GBP'`, `countryCode: 'GB'` via defaults) | T48, T57, T64, T70, T72 |
| `sam` | Yes | T64, T72 |
| `jordan` | Yes | T47, T48, T56, T59, T60, T64, T67, T69, T72, T73 |
| `alex` | Yes | T64, T72 |
| `riley` | **No** (no starting snapshot — same as MVP) | T64 (`<SharedStatementView />` for a manually-minted `no-data` outcome only) |
| `casey` | Yes | T64, T72 |
| `morgan-drew` | Yes | T64, T72 |

`riley` cannot have an S11 share link minted because there is no snapshot to mint against. T56's ownership-and-happy-path matrix uses `jordan` only; T64's per-state render set substitutes a manually-assembled `no-data` outcome (the same shape T1 / T21 use) rather than a stored one.

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

### S10 — Currency and country_code (stretch — spec-only until `/implement S10`)

T46–T51 own the S10 coverage commitments listed in tech-spec §3 S10 "Tests (R19)". All rows are **`Pending (stretch)`** in §7 until `/implement S10` runs.

#### T46 — S10: Migration adds `currency` and `country_code` columns

- **Type:** unit (integration with in-memory SQLite via `makeDb()`)
- **Covers:** R11, R19
- **Touches:** S10, S2
- **Given / When / Then:** Given a fresh `makeDb()` — When all migrations run — Then the `snapshots` table has two new columns: `currency TEXT NOT NULL` with default `'GBP'` and `country_code TEXT NOT NULL` with default `'GB'`. Asserted via `sqlite_master` / `PRAGMA table_info('snapshots')` introspection, not by an `INSERT`-and-read round-trip (which is T47's job).
- **Fixtures:** none

#### T47 — S10: Default backfill on `createSnapshot` without explicit fields

- **Type:** unit
- **Covers:** R11, R19
- **Touches:** S10, S2
- **Given / When / Then:** Given a fresh `makeDb()` — When `createSnapshot({ ie, customerId: 'jordan', takenAt: '...' })` is called **without** `currency` / `countryCode` — Then the returned `Snapshot` carries `currency: 'GBP'` and `countryCode: 'GB'`; `getLatestSnapshot('jordan')` returns the same values; the row in the `snapshots` table has the column defaults applied at `INSERT` time.
- **Fixtures:** `iePatSurplus`-style IE; the resulting row becomes `snapshotJordanStoredGbp`

#### T48 — S10: Repository round-trip carries `currency` and `countryCode`

- **Type:** unit
- **Covers:** R11, R19
- **Touches:** S10, S2
- **Given / When / Then:** Given two explicit `createSnapshot({ ..., currency: 'GBP', countryCode: 'GB' })` calls for `jordan` — When `getLatestSnapshot('jordan')` then `listSnapshots('jordan')` — Then both fields are present on every returned row; `listSnapshots` returns newest → oldest order (existing S2 contract); shape matches the `Snapshot` type as exported from `lib/affordability/types.ts` post-S10.
- **Fixtures:** `snapshotJordanStoredGbp`, `snapshotPatStoredGbp`

#### T49 — S10: `formatMoney` helper — locale-aware output

- **Type:** unit
- **Covers:** R11, R10, R19
- **Touches:** S10
- **Given / When / Then:**

| Input | Expected output |
|---|---|
| `formatMoney(123450, 'GBP', 'GB')` | `'£1,234.50'` |
| `formatMoney(0, 'GBP', 'GB')` | `'£0.00'` |
| `formatMoney(1, 'GBP', 'GB')` | `'£0.01'` |
| `formatMoney(-50000, 'GBP', 'GB')` | starts with the locale's minus indicator (e.g. `'-£500.00'`) — assertion is `.startsWith('-')` or matches `/^[−-]/` so it tolerates the precise minus glyph Node's `Intl` ships |

Assertion uses `.toBe(...)` for the positive cases (deterministic in ICU); the negative case uses a regex to absorb ICU-version drift on the minus glyph.

- **Fixtures:** `formattedJordanDisposable` (cross-check sanity)

#### T50 — S10: Integer-pence invariant preserved at every persistence boundary

- **Type:** unit
- **Covers:** R10, R11, R19
- **Touches:** S10, S1, S2
- **Given / When / Then:** Given each persona's I&E fixture (and `ieBreakevenExact`) — When `createSnapshot` then `getLatestSnapshot` — Then every numeric field on the returned `Snapshot.outcome` (`totalIncomePence`, `totalExpenditurePence`, `disposableIncomePence`) is still `Number.isInteger(...) === true` after the round-trip; the `Delta.disposableDeltaPence` produced by `computeDelta(latest, previous)` is also `Number.isInteger(...) === true` across the same fixture set. **Runtime invariant only** — the tech-spec §S10 design's "no call site outside `formatMoney` may divide a `*Pence` value by 100" guidance lives at the source-discipline layer, not the test-plan layer; a developer using `* 0.01` or `Math.floor(x / 100)` would round-trip-pass anyway, so a static-source `/ 100` scan would pin implementation detail rather than behaviour. T50 protects the observable invariant only.
- **Fixtures:** all seven persona I&E fixtures + `ieBreakevenExact`

#### T51 — S10: Logging hygiene — currency / country fields do not appear in `console.*`

- **Type:** unit
- **Covers:** R10, R11, R19
- **Touches:** S10, S2
- **Given / When / Then:** Given a `console.*` spy across (a) `makeDb()` open + migrate, (b) `createSnapshot` with default `currency`/`countryCode`, (c) `createSnapshot` with explicit `'GBP'` / `'GB'` — Then the aggregated log output contains zero occurrences of `'GBP'`, `'GB'`, `'currency'`, or `'country_code'` substrings. Extends the existing T12 / T20 logging-hygiene contract to the new columns; does not replace either.
- **Fixtures:** `iePatSurplus`, `snapshotJordanStoredGbp`

---

### S11 — Secure time-limited statement sharing (stretch — spec-only until `/implement S11`)

T52–T67 + T76 own the S11 coverage commitments listed in tech-spec §3 S11 "Tests (R19)". All rows are **`Pending (stretch)`** in §7 until `/implement S11` runs. Every render row asserts the subtree-scoped persona-leak DOM contract from tech-spec §S11 (F1.3 + F1.8) — neither `<SharedStatementView />` nor `<ShareUnavailable />` nor the `(share)` group's `layout.tsx` may produce DOM elements whose `href`, `aria-label`, or rendered text references a persona id, persona name, `/dashboard`, `/dashboard/update`, or `/history`.

#### T52 — S11: Token generation — base64url + sha256-hex contract

- **Type:** unit
- **Covers:** R12, R19
- **Touches:** S11
- **Given / When / Then:** Given `generateShareToken()` from `lib/share/token.ts` — When called repeatedly — Then each call returns `{ raw, hash }` where `raw` matches `/^[A-Za-z0-9_-]{43}$/` (32 bytes → 43 base64url chars), `hash` matches `/^[0-9a-f]{64}$/` (sha256 hex, lower-case), the same `raw` always produces the same `hash` via `hashShareToken(raw)`, and 100 successive calls produce 100 distinct `raw` values.
- **Fixtures:** none (random)

#### T53 — S11: Migration adds `share_links` table + index

- **Type:** unit (integration with in-memory SQLite)
- **Covers:** R12, R19
- **Touches:** S11
- **Given / When / Then:** Given a fresh `makeDb()` — When all migrations run — Then `sqlite_master` reports a `share_links` table with the columns and constraints from tech-spec §S11 (`id TEXT PRIMARY KEY`, `snapshot_id TEXT NOT NULL`, `token_hash TEXT NOT NULL UNIQUE`, `expires_at TEXT NOT NULL`, `created_at TEXT NOT NULL`, FK on `snapshot_id → snapshots(id)`) and an index named `idx_share_links_token_hash` on `token_hash`.
- **Fixtures:** none

#### T54 — S11: Repository round-trip + expiry / unknown-hash both return `null`

- **Type:** unit
- **Covers:** R12, R19
- **Touches:** S11
- **Given / When / Then:** Given a fresh `makeDb()` + `snapshotJordanStoredGbp` + `createShareLink({ snapshotId, tokenHash, expiresAt })` for `shareLinkRowJordan` — When `getShareLinkByTokenHash(hash, pinnedNowUtc)` — Then `{ snapshotId }` is returned. When `getShareLinkByTokenHash(hash, nowJustAfterExpiry)` — `null`. When `getShareLinkByTokenHash('not-a-real-hash', pinnedNowUtc)` — `null`. **Critical:** unknown vs expired both return `null` — the repository cannot distinguish.
- **Fixtures:** `snapshotJordanStoredGbp`, `shareLinkRowJordan`, `shareTokenPinned`, `pinnedNowUtc`, `nowJustAfterExpiry`

#### T55 — S11: `nowUtc()` clock helper — both mock styles produce the same fixture behaviour

- **Type:** unit
- **Covers:** R12, R19
- **Touches:** S11
- **Given / When / Then:** Two sub-tests against the same fixtures:
  - **(a) module-mock style:** `vi.mock('@/lib/share/clock', () => ({ nowUtc: () => pinnedNowUtc }))` — `nowUtc()` returns `pinnedNowUtc`; `createShareLinkAction` produces `expiresAt = pinnedNowUtc + 24h` to the millisecond; the resolver's expired-branch fires when called with `nowJustAfterExpiry`.
  - **(b) fake-timers style:** `vi.useFakeTimers(); vi.setSystemTime(pinnedNowUtc)` — `nowUtc()` returns `pinnedNowUtc`; same `expiresAt`; same expired-branch behaviour.

  Both styles MUST pass against the same fixtures (`/implement S11` picks one per file; `/test-plan` does not pin the choice).

- **Fixtures:** `pinnedNowUtc`, `nowJustAfterExpiry`, `mockClock`

#### T56 — S11: Server Action `createShareLinkAction` — happy path

- **Type:** unit
- **Covers:** R12, R19
- **Touches:** S11
- **Given / When / Then:** Given `withPersonaCookie('jordan')`, `mockClock(pinnedNowUtc)`, and `snapshotJordanStoredGbp` — When `createShareLinkAction(formData)` is called with `snapshotId = snapshotJordanStoredGbp.id` — Then it returns `{ ok: true, url, expiresAt }` where `url` matches `/^\/share\/[A-Za-z0-9_-]{43}$/` and `expiresAt.getTime() === pinnedNowUtc.getTime() + 24 * 60 * 60 * 1000` exactly. The DB now has exactly one row in `share_links` with the matching `token_hash` and `expires_at`. **Anywhere-in-DB scan:** no column in `share_links` contains the raw token string (asserted by `SELECT *` + substring check) — only the hash is persisted.
- **Fixtures:** `snapshotJordanStoredGbp`, `pinnedNowUtc`, `shareTokenPinned` (cross-check shape)

#### T57 — S11: Server Action — cross-persona ownership rejected with no information leak

- **Type:** unit
- **Covers:** R12, R10, R19
- **Touches:** S11
- **Given / When / Then:** Given `withPersonaCookie('jordan')`, `snapshotJordanStoredGbp`, and `snapshotPatStoredGbp` — When `createShareLinkAction(formData)` is called with `snapshotId = snapshotPatStoredGbp.id` (a snapshot that exists but is owned by `pat`) — Then the returned error has the **same generic typed-error shape and same message** as for a snapshot id that does not exist at all. Repeat with `snapshotId = 'does-not-exist-uuid'` — same error shape, same message. **No DB write happens on either arm** (`share_links` row count is unchanged). The `console.*` spy across both arms records zero occurrences of `snapshotPatStoredGbp.id`.
- **Fixtures:** `snapshotJordanStoredGbp`, `snapshotPatStoredGbp`

#### T58 — S11: Server Action — persona validation (three sub-cases)

- **Type:** unit
- **Covers:** R12, R10, R19
- **Touches:** S11
- **Given / When / Then:** Three sub-cases, all sharing the same expected outcome:

| Sub-case | Setup |
|---|---|
| **(a) cookie absent** | `withPersonaCookie` is NOT called in `beforeEach`; the global `vi.mock('next/headers')` `cookies().get('personaId')` returns `undefined` (matches the S7 helper semantics — `withPersonaCookie(null)` is **not** how "cookie absent" is exercised; the absence of the helper call is) |
| **(b) cookie present, empty string value** | `withPersonaCookie('')` |
| **(c) cookie present, not a persona id** | `withPersonaCookie('does-not-exist')` |

For all three: `createShareLinkAction(formData)` returns `{ ok: false, errors: [{ field: '_', message: 'Please pick a persona first.' }] }`; **no row appears in `share_links`** after the call (assertion via `SELECT COUNT(*) FROM share_links`); `console.*` spy records zero occurrences of the cookie value across all three sub-cases. (The previous-draft "or `snapshots`" assertion is dropped — `createShareLinkAction` never writes to `snapshots` on any path, so it was vacuous.)

- **Fixtures:** none (cookie mock variations only)

#### T59 — S11: `resolveShare(token, now)` — happy path

- **Type:** unit
- **Covers:** R12, R19
- **Touches:** S11
- **Given / When / Then:** Given a fresh `makeDb()` + `snapshotJordanStoredGbp` + a freshly-minted share link via `mockClock(pinnedNowUtc)` — When `resolveShare(raw, pinnedNowUtc)` is called with the raw token returned by `createShareLinkAction` — Then it returns the linked `Snapshot` whose `id === snapshotJordanStoredGbp.id`. **Test the page-extracted helper directly, not the async Server Component page** (per tech-spec §4 page-vs-component split).
- **Fixtures:** `snapshotJordanStoredGbp`, `shareTokenPinned`, `pinnedNowUtc`

#### T60 — S11: `resolveShare` — all three miss arms collapse to `null`

- **Type:** unit
- **Covers:** R12, R10, R19
- **Touches:** S11
- **Given / When / Then:** Three independent sub-cases, all asserting `=== null`:
  - **(a) unknown token:** `resolveShare('garbage-token-that-was-never-minted', pinnedNowUtc)` → `null`.
  - **(b) expired token:** Mint a link via `mockClock(pinnedNowUtc)`; call `resolveShare(raw, nowJustAfterExpiry)` → `null`.
  - **(c) snapshot row missing:** Mint a link for `snapshotJordanStoredGbp.id`, then `DELETE FROM snapshots WHERE id = ?`; call `resolveShare(raw, pinnedNowUtc)` → `null`.

  **Cross-arm assertion:** the value returned by `resolveShare` is strictly equal across all three arms (`=== null`); the caller cannot tell the arms apart from the return value alone. The companion middleware-unit + render rows (T61, T64, T65) confirm the wire-level same-response posture.

- **Fixtures:** `snapshotJordanStoredGbp`, `shareTokenPinned`, `pinnedNowUtc`, `nowJustAfterExpiry`

#### T61 — S11: `middleware.ts` emits cache + robots headers on `/share/*` only

- **Type:** unit (middleware-unit, not HTTP round-trip)
- **Covers:** R12, R10, R19
- **Touches:** S11
- **Given / When / Then:** Import the `middleware` function from the project-root `middleware.ts` directly. Invoke it with a stub `NextRequest` whose `nextUrl.pathname` is each of:

| Path | Expected response headers |
|---|---|
| `/share/abc123` (happy-path-style token) | `Cache-Control: 'no-store, private'`, `X-Robots-Tag: 'noindex, nofollow'` |
| `/share/garbage` (unknown-token arm) | Same |
| `/share/expired-fixture-token` (expired arm) | Same |
| `/share/snapshot-missing-fixture-token` (snapshot-row-missing arm) | Same |
| `/` | Pass-through (no `Cache-Control: no-store`, no `X-Robots-Tag`) |
| `/dashboard` | Pass-through |
| `/dashboard/update` | Pass-through |
| `/history` | Pass-through |
| `/dashboard/snapshot/some-uuid/pdf` | Pass-through (S12 sets its own headers in the Route Handler `Response`; the middleware must not double-emit on this path) |

**Header parity across the four `/share/*` arms is structural** — one middleware-unit assertion covers all four because the middleware matches on pathname, not on resolver outcome. No per-arm HTTP round-trip is needed (resolves S021-fix F1.1).

- **Fixtures:** none (path strings only)

#### T62 — S11: `generateMetadata` exports the robots meta tag

- **Type:** unit
- **Covers:** R12, R10, R19
- **Touches:** S11
- **Given / When / Then:** Import `generateMetadata` from `app/(share)/share/[token]/page.tsx` — When invoked with a stub `{ params: Promise.resolve({ token: 'anything' }) }` — Then the returned metadata's `robots` property is shaped per Next.js 16's `generateMetadata` contract such that the rendered `<meta name="robots">` carries `noindex, nofollow` (equivalent JSON shapes accepted: `robots: 'noindex, nofollow'`, or `robots: { index: false, follow: false }`). HTML-only-reader fallback for T61's `X-Robots-Tag` header.
- **Fixtures:** none

#### T63 — S11: `/share/[token]` page has no static-render directive

- **Type:** unit (static source scan)
- **Covers:** R12, R10, R19
- **Touches:** S11
- **Given / When / Then:** Read the source of `app/(share)/share/[token]/page.tsx` as text. Assert it contains **zero** occurrences of `export const revalidate`, `export const dynamic = 'force-static'`, and `unstable_cache(`. `export const dynamic = 'force-dynamic'` is **permitted** (a second guardrail) but not asserted. Cheap regression guard against an accidental static pre-render of the share page. R10 citation is load-bearing here per tech-spec §S11 "R10 / R12 conscious reading (closes F1.6)" — accidental static pre-rendering of `/share/[token]` would let third-party caches retain shared snapshot content, which the joint R10 + R12 broadening explicitly disallows.
- **Fixtures:** none

#### T64 — S11: `<SharedStatementView />` renders + persona-leak DOM contract + a11y smoke

- **Type:** unit + a11y
- **Covers:** R12, R7, R20, R18, R10, R19
- **Touches:** S11, S10
- **Given / When / Then:** For each persona's outcome shape (`pat`, `sam`, `jordan`, `alex`, `casey`, `morgan-drew` from stored fixtures, plus a manually-assembled `no-data` outcome for `riley`) — render `<SharedStatementView snapshot={...} />` **inside the `(share)` route group's `layout.tsx`** (the only two surfaces that ship under `app/(share)/`):

  1. **Outcome surfaces present:** disposable figure, band chip, `reasons[]`, income / expenditure breakdown all render; `<SupportSignpost />` and `<FramingNotice />` are in the document (R7 + R20 broadening per tech-spec §S11).
  2. **`formatMoney` integration:** every money string on the page matches the output of `formatMoney(pence, snapshot.currency, snapshot.countryCode)` for the corresponding pence value (compares-by-equality, not by visual layout).
  3. **Persona-leak DOM contract (subtree-scoped, F1.3 + F1.8):** the rendered subtree (layout + view) contains **zero** elements whose `href`, `aria-label`, or rendered text matches:
     - any persona id from `personas` (`'pat'`, `'sam'`, `'jordan'`, `'alex'`, `'riley'`, `'casey'`, `'morgan-drew'`),
     - any persona label from `personas` (`'Pat …'`, etc.),
     - the strings `'/dashboard'`, `'/dashboard/update'`, `'/history'`.
  4. **Structural absence of `<AppHeader />` under `(share)`:** a static `Read`-and-scan of `app/(share)/share/[token]/page.tsx` and `app/(share)/layout.tsx` finds zero `import` statements referencing `<AppHeader />` (or `AppHeader` from `components/AppHeader.tsx`).
  5. **a11y:** `vitest-axe` reports no WCAG 2.2 AA violations on the rendered subtree.

- **Fixtures:** `snapshotJordanStoredGbp`, `snapshotPatStoredGbp`, plus the rest of §2.3 persona-to-stretch table

#### T65 — S11: `<ShareUnavailable />` — same response across all miss arms; no framing / signpost

- **Type:** unit + a11y
- **Covers:** R12, R20, R7, R18, R10, R19
- **Touches:** S11
- **Given / When / Then:** Render `<ShareUnavailable />` inside the `(share)` layout three times — once for each miss arm (unknown token, expired, snapshot-row-missing) — by passing the arm reason as a prop (or invoking the component directly, since per tech-spec §S11 the rendered output does not vary by reason):

  1. **Generic copy:** the rendered string contains "This link is no longer available" (or the `/implement S11` equivalent committed in `lib/share/copy.ts`); no per-arm variation in the rendered output (assert via React Testing Library `.toHaveTextContent(...)` deep-equality across the three renders, or snapshot-test the three renders for byte-equality).
  2. **`<FramingNotice />` is absent:** `<aside aria-labelledby="framing-notice-heading">` (the S9 framing landmark) does not appear in the document (`queryByRole('complementary', { name: /About this assessment/i })` returns `null`). Same negation for `<SupportSignpost />` — its accessible name does not appear.
  3. **Persona-leak DOM contract:** same subtree-scoped assertion as T64 (zero persona-aware references in the layout + view subtree).
  4. **a11y:** `vitest-axe` smoke clean (the page is one heading + one paragraph, so this passes trivially — not load-bearing for R18; T64 is the load-bearing R18 row for S11).

- **Fixtures:** none (the component takes no `snapshot` prop)

#### T66 — S11: `<ShareSnapshotForm />` renders + Server Action wiring + a11y

- **Type:** unit + a11y
- **Covers:** R12, R18, R19
- **Touches:** S11
- **Given / When / Then:** Render `<ShareSnapshotForm snapshotId="some-uuid" />` (a Client Component) with an injected `actionState` representing the post-mint return shape `{ ok: true, url: '/share/<token>', expiresAt: '<iso>' }`:

  1. The rendered output contains a real `<button>` element (not `<div role="button">`) for "Create share link", and after the (injected) success state, a `<input readOnly>` carrying the URL.
  2. The URL `<input>` has an accessible name (programmatic `<label>` or `aria-label`).
  3. A human-readable expiry timestamp is exposed via `aria-describedby` pointing at a sibling element (not just the raw ISO string).
  4. SC 2.5.8: every interactive element has a hit target ≥ 24 × 24 CSS px (asserted via computed-style bounding box on the rendered DOM).
  5. `vitest-axe` reports no WCAG 2.2 AA violations.

  This row does **not** exercise the React `useActionState` runtime — same MVP limitation as T24 / T25; the action is tested directly in T56–T58.

- **Fixtures:** none (props-only)

#### T67 — S11: Logging hygiene across mint + resolver — application-code scope

- **Type:** unit
- **Covers:** R10, R12, R19
- **Touches:** S11
- **Given / When / Then:** A single `console.*` spy aggregating across all four S11 paths in one test:

  1. **(a) happy-path mint:** `createShareLinkAction` under `withPersonaCookie('jordan')` with `snapshotJordanStoredGbp.id`.
  2. **(b) expired-resolver:** `resolveShare(raw, nowJustAfterExpiry)`.
  3. **(c) unknown-token resolver:** `resolveShare('garbage', pinnedNowUtc)`.
  4. **(d) snapshot-row-missing resolver:** mint a link, delete the snapshot row, then `resolveShare(raw, pinnedNowUtc)`.

  The aggregated log output contains **zero** occurrences of:
  - the raw token strings (from `(a)` and `(d)`'s raw),
  - the token hash strings (from `(a)`'s hash, `(b)`/`(c)`'s computed hash on the input),
  - the `snapshotJordanStoredGbp.id` string,
  - any digit-string from `snapshotJordanStoredGbp.outcome` (income / expenditure / disposable pence values),
  - any IE label string from `snapshotJordanStoredGbp.ie` (earner names, expenditure line labels).

  Lifecycle lines `share: link created` and `share: lookup miss` (or whatever `/implement S11` picks) are allowed as long as they carry no identifiers. **Scope:** application-code only — Next.js's own request logger is out per tech-spec §S11 "Data hygiene (R10) — Known limitation" and §5 trade-off "S11 + S12 access-log limitation under R10".

- **Fixtures:** `snapshotJordanStoredGbp`, `shareTokenPinned`, `pinnedNowUtc`, `nowJustAfterExpiry`

#### T76 — S11: `<ShareUnavailable />` copy — tone + advice-implying token scan

- **Type:** unit
- **Covers:** R6, R20, R19, R12
- **Touches:** S11
- **Given / When / Then:** Given the source string(s) for `<ShareUnavailable />` (exported as `shareUnavailableCopySample` from a small test helper or read directly from `lib/share/copy.ts` once `/implement S11` decides where the copy lives) — When scanned by the same `forbiddenToneTokens` and `forbiddenAdviceTokens` lists T29 / T43 use — Then **zero** tone-token matches and **zero** advice-implying-token matches. This is the test-plan equivalent of the S11 entry in tech-spec §7 R6 row ("`<ShareUnavailable />` adds one new copy string … that the stretch tone-token guard scans when `/implement S11` runs"). Append-only — does not modify T29's scope.
- **Fixtures:** `shareUnavailableCopySample`

---

### S12 — PDF export (stretch — spec-only until `/implement S12`)

T68–T75 own the S12 coverage commitments listed in tech-spec §3 S12 "Tests (R19)". All rows are **`Pending (stretch)`** in §7 until `/implement S12` runs. Per the §1 stretch-discipline rule, every PDF-body row asserts content **presence** via text extraction — no pixel-layout, kerning, line-wrap, page-count, byte-equality, or tagged-PDF assertions.

#### T68 — S12: Route handler exports `runtime = 'nodejs'`

- **Type:** unit (static import)
- **Covers:** R13, R19
- **Touches:** S12
- **Given / When / Then:** Static import of `app/dashboard/snapshot/[id]/pdf/route.ts` as the `route` module — assert `route.runtime === 'nodejs'`. Cheap regression guard against a future global default-runtime flip silently breaking `@react-pdf/renderer` (which needs `Buffer` / `fs` for embedded fonts — `runtime = 'edge'` would fail at import time).
- **Fixtures:** none

#### T69 — S12: Route handler — happy-path response shape

- **Type:** unit
- **Covers:** R13, R19
- **Touches:** S12, S10
- **Given / When / Then:** Given `withPersonaCookie('jordan')` and `snapshotJordanStoredGbp` — When the `GET` handler is invoked directly as a plain async function with `{ params: Promise.resolve({ id: snapshotJordanStoredGbp.id }) }` — Then the returned `Response`:

  1. has `status === 200`,
  2. carries headers `Content-Type: 'application/pdf'`,
  3. carries `Content-Disposition` matching `/^attachment; filename="financial-snapshot-\d{4}-\d{2}-\d{2}\.pdf"$/` (the date portion derived from `snapshot.takenAt.slice(0, 10)`),
  4. carries `Cache-Control: 'no-store, private'` (set directly on the `Response` by the handler — S11's middleware does **not** match this path per T61's negative assertion),
  5. `await response.arrayBuffer()` yields a non-empty `ArrayBuffer` whose first 5 bytes decode to `'%PDF-'`.

- **Fixtures:** `snapshotJordanStoredGbp`

#### T70 — S12: Route handler — cross-persona returns 404 (no information leak)

- **Type:** unit
- **Covers:** R13, R10, R19
- **Touches:** S12
- **Given / When / Then:** Two sub-cases under `withPersonaCookie('jordan')`:
  - **(a) snapshot exists but owned by another persona:** `GET` invoked with `{ params: { id: snapshotPatStoredGbp.id } }` — returns `status === 404` with body `'Not Found'`.
  - **(b) snapshot does not exist:** `GET` invoked with `{ params: { id: 'does-not-exist-uuid' } }` — returns `status === 404` with body `'Not Found'`.

  Both arms return **byte-identical** responses (same status, same body) — no leak of "exists but not yours" vs "doesn't exist". A spy on `renderSnapshotPdfToBuffer` (mocked) records **zero** calls across both arms — no PDF generation work runs on the 404 arms.

- **Fixtures:** `snapshotJordanStoredGbp`, `snapshotPatStoredGbp`

#### T71 — S12: Route handler — persona validation (missing + invalid cookie)

- **Type:** unit
- **Covers:** R13, R10, R19
- **Touches:** S12
- **Given / When / Then:** Three sub-cases:

| Sub-case | Setup | Expected |
|---|---|---|
| **(a) cookie absent** | `withPersonaCookie` not called (helper absent) | `status === 403`, body `'Forbidden'` |
| **(b) cookie present, empty** | `withPersonaCookie('')` | Same |
| **(c) cookie present, not a persona** | `withPersonaCookie('does-not-exist')` | Same |

For all three: a spy on `getSnapshotById` records **zero** DB reads; a spy on `renderSnapshotPdfToBuffer` records **zero** calls; a `console.*` spy records **zero** occurrences of the invalid cookie value (relevant to sub-cases b + c).

- **Fixtures:** none (cookie mock variations only)

#### T72 — S12: `renderSnapshotPdfToBuffer` smoke + outcome-state content coverage

- **Type:** unit
- **Covers:** R13, R19, R20, R7
- **Touches:** S12, S10, S9, S4
- **Given / When / Then:** For each `OutcomeState` (`surplus`, `breakeven`, `shortfall`, `zero-income`, `no-data`) — build a `Snapshot` carrying that outcome (use stored persona fixtures where possible per §2.3; use a manually-assembled `Snapshot` for `breakeven` and `no-data` since the seed does not produce them) — call `renderSnapshotPdfToBuffer(snapshot)`:

  1. Returned `Buffer` is non-empty and `buffer.slice(0, 5).toString('latin1') === '%PDF-'`.
  2. `pdfTextExtractor(buffer)` produces a string containing **all** of:
     - the band label appropriate to the outcome state (`'Surplus'` / `'Breakeven'` / `'Shortfall'` / `'Zero income'` / `'No data'`),
     - the disposable figure as formatted by `formatMoney(outcome.disposableIncomePence, 'GBP', 'GB')` (skipped for `no-data` where the disposable line is suppressed per tech-spec §S4 — same suppression applies in the PDF per tech-spec §S12 design bullet 6),
     - the framing-notice "not financial advice" phrase (R20 broadening on the PDF surface — tech-spec §S12 design bullet 12 + §7 R20 row),
     - the support-signpost copy block as plain text plus the support URL substring `"/support"` (R7 broadening on the PDF surface — tech-spec §S12 design bullet 11 + §7 R7 row; reuses the same `copy.ts` source as `<SupportSignpost />` so the PDF and the screen do not diverge in this layer),
     - at least one of the `outcome.reasons[]` strings — **for branches with non-empty reasons** (`surplus` / `breakeven` / `shortfall` / `zero-income`). **The `no-data` branch is exempt from this sub-bullet** because tech-spec §S1 commits `reasons[]` to "don't have any income or outgoings" only and S4's `<DashboardView />` does not foreground a `reasons` list for that outcome (T21 / T1 already cover the no-data reasons content; T72 does not re-assert it through the PDF surface).

  **Presence not layout** — assertions use `.toContain(...)`, never `.toEqual(...)` against a layout-pinned snapshot, never line / column / page position.

- **Fixtures:** all stored persona Snapshots + manually-assembled `breakeven` + `no-data` snapshots

#### T73 — S12: `formatMoney` integration — PDF money strings match on-screen render

- **Type:** unit
- **Covers:** R13, R11, R19
- **Touches:** S12, S10, S4
- **Given / When / Then:** Given `snapshotJordanStoredGbp` — When (a) `renderSnapshotPdfToBuffer(snapshot)` then `pdfTextExtractor(buffer)` produces the extracted PDF text, **and** (b) `<DashboardView snapshot={snapshot} />` is rendered to HTML and queried for its money strings — Then **every** money string visible on the dashboard (`formattedJordanDisposable`, the income total, the expenditure total) appears verbatim in the extracted PDF text. Sanity check that the money strings cannot drift between surfaces. **Presence not layout** — band labels, reasons, and framing copy live on independent code paths (different render trees) and are not asserted by this row; T72 covers them.
- **Fixtures:** `snapshotJordanStoredGbp`, `formattedJordanDisposable`

#### T74 — S12: Logging hygiene across one full GET — application-code scope

- **Type:** unit
- **Covers:** R10, R13, R19
- **Touches:** S12
- **Given / When / Then:** Given `withPersonaCookie('jordan')` and `snapshotJordanStoredGbp` — When `GET` is invoked once (full happy path) with a `console.*` spy — Then the aggregated log output contains **zero** occurrences of:
  - any digit-string from `snapshotJordanStoredGbp.outcome` (income / expenditure / disposable pence values),
  - the literal string `'jordan'` (the customer / persona id),
  - the `snapshotJordanStoredGbp.id` string,
  - any IE label string from `snapshotJordanStoredGbp.ie`.

  A lifecycle line `pdf: rendered` (or whatever `/implement S12` picks) carrying no identifiers is allowed. **Scope:** application-code only — Next.js's own request logger is out per tech-spec §S12 "Data hygiene (R10) — Known limitation" and §5 trade-off "S11 + S12 access-log limitation under R10".

- **Fixtures:** `snapshotJordanStoredGbp`

#### T75 — S12: No file written to disk during PDF generation

- **Type:** unit
- **Covers:** R10, R13, R19
- **Touches:** S12
- **Given / When / Then:** Given a happy-path `GET` invocation (same setup as T69) — When `vi.spyOn(fs.promises, 'writeFile')` and `vi.spyOn(fs, 'writeFileSync')` are wired before the call — Then **both** spies record `mock.calls.length === 0` after the call completes. Cheap regression guard against an accidental "save copy to disk" addition (R10 data-minimisation discipline; the buffer must stream to the response only).
- **Fixtures:** `snapshotJordanStoredGbp`

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

### Stretch edge cases (S10 / S11 / S12 — spec-only until `/implement` runs)

| Scenario | Test ID(s) | Expected behaviour |
|---|---|---|
| Pre-S10 snapshot rows back-filled by column defaults | T46, T47 | New `currency`/`country_code` columns default to `'GBP'`/`'GB'` at `ALTER TABLE` time; round-trip preserves both |
| Negative pence rendered with locale minus | T49 | `formatMoney(-pence, …)` starts with locale minus indicator; integer-pence invariant preserved upstream |
| `pence / 100` divide leaks outside `formatMoney` | T50 | Static-source scan catches any new divide-by-100 outside `lib/affordability/format.ts` |
| Cross-persona share mint | T57 | Same generic error for "exists but not yours" vs "doesn't exist"; no DB write; no snapshot id in logs |
| Persona cookie absent / empty / not-a-persona on share mint | T58 | Typed `_` error; zero `share_links` rows after the call; invalid cookie value not logged |
| Share link minted, snapshot row later deleted | T60(c), T65 | Resolver returns `null` (same as unknown/expired); `<ShareUnavailable />` rendered with identical copy + headers |
| Share token raw value never persisted | T56 | Anywhere-in-DB substring scan finds zero raw-token occurrences in `share_links` |
| Share link expires after 24h | T54, T55, T60(b) | `getShareLinkByTokenHash(hash, expiredNow)` returns `null`; `resolveShare(token, expiredNow)` returns `null` |
| Header parity across the four `/share/*` arms | T61 | Single middleware-unit assertion covers all four (matches on pathname, not on resolver outcome) |
| Persona-aware navigation under `/share/[token]` | T64, T65 | Zero persona-id / persona-label / dashboard / history / update references in the rendered subtree; `<AppHeader />` not imported under `app/(share)/**` |
| `<ShareUnavailable />` carries no outcome | T65 | `<FramingNotice />` and `<SupportSignpost />` are absent (R20 / R7 do not attach — mirrors S007 round-2 F2.1 narrowing) |
| Cross-persona PDF GET | T70 | Byte-identical 404 response for "exists but not yours" vs "doesn't exist"; `renderSnapshotPdfToBuffer` not called |
| Persona cookie absent / empty / not-a-persona on PDF GET | T71 | 403; no DB read; no PDF generation work; invalid cookie value not logged |
| PDF body content presence across all outcome states | T72 | Band label, disposable figure, "not financial advice" phrase, and ≥1 reason string each appear via text extraction (presence not layout) |
| Money string drift between dashboard render and PDF | T73 | Every dashboard money string appears verbatim in extracted PDF text for the same snapshot |
| Accidental PDF-to-disk persistence | T75 | Zero `fs.writeFile` / `writeFileSync` calls during one full GET |
| Tagged-PDF semantic structure (WCAG SC 1.3.1 / 1.3.2) | — | **Out of scope** — limitation of `@react-pdf/renderer`, carried out per tech-spec §6 + §5 trade-off "S12 no tagged-PDF"; T72 / T73 explicitly do not assert it |

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
| R6 | Should | T22, T29, T43, T38; **T76 (stretch broadening — `<ShareUnavailable />` copy tone guard)** | Tone + advice-implying guards incl. `supportSignpost` (T29); signpost emphasis via copy variant (T45). **Stretch broadening:** T76 scans `<ShareUnavailable />`'s single new copy string against the same forbidden-token lists T29 / T43 use (tech-spec §7 R6 row); S12 contributes no new copy strings — PDF reuses S1 + S9 sources under existing T29 / T43 scans, so no S12 tone guard is allocated. |
| R7 | Should | T21, T22, T26, T27, T44, T45; **T64, T72 (stretch broadening — `<SharedStatementView />` signpost + S12 PDF signpost text block)** | Signpost on every outcome surface; standalone axe (T44); scaled copy (T45). **Stretch broadening (R7 conscious reading recorded in tech-spec §7 R7 row):** R7 attaches to the recipient-facing share surface (T64 asserts `<SupportSignpost />` is in the document) and to the PDF surface (T72 asserts the support-signpost copy block + `/support` URL substring appear in the extracted PDF text). `<ShareUnavailable />` is deliberately **excluded** — T65 asserts `<SupportSignpost />` is absent there (no outcome on the page, so R7 does not attach; mirrors the R20 narrowing). |
| R8 | Should | T8, T13 | 7-persona fixture set |
| R9 | Should | T5, T8, T21, T23, T33 | Reasons + delta plain language |
| R10 | Should | T6, T12, T20; **T49, T50, T51 (S10 — currency / country values and integer-pence invariant)**; **T57, T58, T60, T61, T63, T64, T65, T67 (S11 — application-code logging hygiene + cache/indexing posture + persona-leak DOM contract under `/share/*`)**; **T70, T71, T74, T75 (S12 — application-code logging hygiene + no-file-write spy + cross-persona 404 parity + persona validation)** | Data minimisation / logging (F7.3 scoped to db + action paths). **Stretch broadenings (two conscious readings recorded in tech-spec §S11 + §7 R10 row):** (1) **R10 + R12 cache / indexing posture** — `no-store, private` + `noindex, nofollow` + `robots.txt` disallow on `/share/*`, asserted at the middleware-unit layer (T61) plus the `generateMetadata` robots meta layer (T62 — secondary; R10 cited via the joint reading) and the no-static-render scan (T63); (2) **R10 + R12 no-persona-identity in recipient-facing DOM under `/share/*`** — subtree-scoped persona-leak DOM contract on `<SharedStatementView />` (T64) and `<ShareUnavailable />` (T65) plus structural `<AppHeader />`-import-absence under `app/(share)/**`. **Application-code scope for stretch logging hygiene (T67 / T74):** `console.*` spies only; framework / proxy / CDN access-log content is a known limitation per tech-spec §5 trade-off "S11 + S12 access-log limitation under R10" + §6 — **no `T*` asserts against the access-log layer**. |
| R11 | Could | T46, T47, T48, T49, T50, T51, T73 | **Designed (stretch):** S10 — migration, default backfill, repository round-trip, `formatMoney` helper, integer-pence invariant preserved at the persistence boundary, logging hygiene; T73 cross-checks `formatMoney` integration on the S12 PDF. **Spec-only until `/implement S10` runs.** |
| R12 | Could | T52, T53, T54, T55, T56, T57, T58, T59, T60, T61, T62, T63, T64, T65, T66, T67, T76 | **Designed (stretch):** S11 — token, migration, repository, clock helper, Server Action (happy path / ownership / persona validation), resolver (happy path / three miss arms collapse), middleware headers, `generateMetadata` robots, dynamic-route posture, `<SharedStatementView />` + `<ShareUnavailable />` + `<ShareSnapshotForm />` render + a11y, logging hygiene, copy tone guard. **Spec-only until `/implement S11` runs.** |
| R13 | Could | T68, T69, T70, T71, T72, T73, T74, T75 | **Designed (stretch):** S12 — Route Handler `runtime`, happy-path response shape, ownership 404 parity, persona validation (missing / invalid), `renderSnapshotPdfToBuffer` smoke + outcome state coverage, `formatMoney` integration, logging hygiene, no-file-write spy. **Spec-only until `/implement S12` runs.** |
| R14 | Must | T40 | Manual README checklist |
| R15 | Must | T41 | Manual DECISIONS checklist |
| R16 | Must | T42 | Manual prompt-history checklist |
| R17 | Must | T41 | Time-spent table in DECISIONS |
| R18 | Should | T24, T25, T32, T34, T37, T39, T44; **T64, T65, T66 (stretch broadening — `<SharedStatementView />`, `<ShareUnavailable />`, `<ShareSnapshotForm />` a11y smoke)** | WCAG 2.2 AA axe smoke + SC 3.3.7 + error-summary focus (T24). **Stretch broadening (R18 conscious reading recorded in tech-spec §7 R18 row):** R18 attaches to S11's HTML surfaces in full — T64 carries the load-bearing axe smoke against `<SharedStatementView />` per persona; T65 is included for completeness (one heading + one paragraph, passes trivially — not load-bearing); T66 covers `<ShareSnapshotForm />` (real `<button>` + labelled `<input readOnly>` + `aria-describedby` to expiry + SC 2.5.8 24×24 hit target). **S12 PDF tagged-PDF (SC 1.3.1 / 1.3.2) is deliberately not asserted** by any `T*` — carry-out per tech-spec §5 trade-off "S12 no tagged-PDF" + §6 (the HTML surfaces remain the accessible primary surface; the PDF is a supplementary export). |
| R19 | Should | T46–T76 (every stretch row carries an R19 citation) | **Designed (conditional):** every stretch `T*` cites R19 in addition to its feature requirement (R11 for S10; R12 for S11; R13 for S12). The R19 contract — "tested to the R4 standard if delivered" — is enforced row-by-row through branch matrix + validation + repository round-trip + logging hygiene + a11y coverage per slice. Status remains conditional until at least one of `/implement S10` / `S11` / `S12` runs; the moment the first stretch slice lands, R19 has a live `T*` partner alongside it. |
| R20 | Should | T28, T43, T32, T21, T26, T29; **T64, T72 (stretch broadening — `<SharedStatementView />` + PDF "About this assessment" block); T76 (stretch tone surface — `<ShareUnavailable />` advice-implying token guard)** | Framing on outcome screens; advice-implying guard on `copy.ts` incl. `supportSignpost` (T29). **Stretch broadening (R20 conscious reading recorded in tech-spec §S11 + §S12 + §7 R20 row):** R20 attaches to the recipient-facing share surface (T64) and to the PDF surface (T72) because each is a read-only outcome surface for whoever opens it. T76 covers the **advice-implying token half** of R20 on `<ShareUnavailable />`'s single new copy string (paired with its R6 tone half) — note this is the advice-token surface, **not** the framing-presence surface (T65 asserts the framing notice is `<ShareUnavailable />`-absent). `<ShareUnavailable />` (S11) is deliberately **excluded** from the framing-presence half (mirrors S007 round-2 F2.1 narrowing). |

**Must-requirement gate:** R1–R4 and R14–R17 all have ≥1 `T*` — **pass**.

**Should-requirement gate:** R5–R10, R18, R20 covered. **R19 designed-conditional** — every stretch `T*` (T46–T76) cites R19 alongside its feature R; the gate moves from "dormant" to "live" the moment any of `/implement S10` / `S11` / `S12` runs. R6 / R7 / R10 / R18 / R20 also extended into the stretch surfaces per the conscious-broadening readings recorded in tech-spec §S11 / §S12 / §7.

**Stretch gate (R11 / R12 / R13, Could-class):** designed, not delivered. The §3 stretch rows are spec-only artefacts that ship alongside `/implement S10 | S11 | S12` per tech-spec §3 ordering (`S10 → S11 → S12`). Reviewers can read §3 S10 / S11 / S12 as the contract for what each stretch's PR must prove.

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

### Stretch (S10 / S11 / S12) — additional out-of-scope items

Deliberately **not** tested by any `T*` row in §3, even after the stretch slices land (per tech-spec §6 + §5 trade-offs):

- **Framework / proxy / CDN access log content** — the bearer token in `/share/<rawToken>` (S11) and the snapshot UUID in `/dashboard/snapshot/<id>/pdf` (S12) will appear verbatim in any Next.js dev logger, reverse-proxy, or CDN access log. Application-level `console.*` spies cannot reach that layer. T67 and T74 explicitly scope themselves to application code; **no `T*` is allocated against the access-log layer.** Recorded in tech-spec §5 trade-off "S11 + S12 access-log limitation under R10" and tech-spec §6.
- **S11 single-use semantics** — a token can be reopened until expiry. No `T*` asserts single-use enforcement (deferred per tech-spec §5 trade-off "S11 single-use deferred").
- **S11 revocation UI** — no "Revoke link" surface in stretch. No `T*` asserts revocation (deferred per tech-spec §5 trade-off "S11 revocation deferred"). The `share_links.id` column is a forward commitment per tech-spec §S11 schema comments, but no row is allocated against it today.
- **S11 rate limiting** — no per-persona / per-IP throttle on mint or resolve. No `T*` asserts rate-limit behaviour (deferred per tech-spec §6).
- **S11 wire-layer indistinguishability** — response-body parity across the three resolver miss arms is asserted (T60 + T65 same-copy assertion); response-header parity across the four arms is asserted via the middleware-unit row (T61) — but **timing side-channel parity** is not exercised (per tech-spec §5 trade-off "S11 same-response posture …").
- **S11 raw-token leak via web-server access log** — see access-log bullet above; tech-spec §S11 "Data hygiene (R10) — Known limitation" is the authoritative record.
- **S12 tagged-PDF / SC 1.3.1 + 1.3.2 semantic tree** — `@react-pdf/renderer` does not emit tagged PDFs; screen-reader navigation of the PDF itself is best-effort. T72 / T73 assert **presence not layout** and explicitly do not assert tagged-PDF structure (per tech-spec §S12 test-scope note + §5 trade-off "S12 no tagged-PDF" + §6 carry-out).
- **S12 PDF pixel layout / kerning / line wrap / page count / byte-for-byte equality** — no `T*` pins any of these; per tech-spec §S12 test-scope note, pinning on layout would make the suite brittle to upstream `@react-pdf/renderer` patch versions.
- **S11 ↔ S12 cross-integration** — generating a PDF download for a snapshot reached via a public share link is a future slice; no `T*` exercises that combined path.
- **S12 `@react-pdf/renderer` library verification** — the "lightweight / no Chromium / pure-Node / `renderToBuffer` exported from package root" framing is a suspicion-level commitment per tech-spec §5 trade-off "S12 PDF library". `/implement S12` must verify against the installed `node_modules` before pinning; no `T*` asserts the verification list (it is an `/implement`-time pre-check, not a runtime test).
- **S11 + S12 coercion / forwarded-under-pressure risk** — no `T*` asserts consent affordances or "who you shared with" reminders (suspicion-level, no PRD citation; tech-spec §5 trade-off "S11 + S12 coercion / forwarded-under-pressure risk (suspicion — no PRD citation)" and §6 carry-out).
- **End-to-end React `useActionState` runtime for `<ShareSnapshotForm />`** — T66 asserts the rendered shape with an injected `actionState` only, same MVP limitation as T24 / T25 (per tech-spec §5 trade-off "`useActionState` round-trip not unit-tested").
- **Async Server Component page `app/(share)/share/[token]/page.tsx`** — Vitest cannot render async Server Components; T59 / T60 exercise the page-extracted `resolveShare` helper directly, T61 exercises the middleware unit directly, T62 exercises `generateMetadata` directly. End-to-end integration of those four units in production is a manual reviewer walkthrough, not an automated row.
- **Async Route Handler binding for `app/dashboard/snapshot/[id]/pdf/route.ts`** — T68–T75 call the exported `GET` function as a plain async function with `{ params: Promise.resolve(...) }`; the Next.js routing layer's binding (parameter parsing, header negotiation, body streaming) is exercised by the framework and not re-asserted.

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
| **S10 (stretch)** | **R11, R19** | **T46, T47, T48, T49, T50, T51** | **Spec-only until `/implement S10` runs.** Migration adds `currency` / `country_code` columns; `formatMoney` helper replaces hard-coded `Intl.NumberFormat`; integer-pence invariant preserved upstream of the display divide. |
| **S11 (stretch)** | **R6, R7, R10, R12, R18, R19, R20** | **T52, T53, T54, T55, T56, T57, T58, T59, T60, T61, T62, T63, T64, T65, T66, T67, T76** | **Spec-only until `/implement S11` runs.** Token generation; repository round-trip + expiry; clock helper (two mock styles); Server Action (happy / ownership / persona validation); resolver (happy + three miss arms collapse to null); middleware emits cache + robots headers on `/share/*` only; `generateMetadata` robots; no-static-render scan; `<SharedStatementView />` + `<ShareUnavailable />` + `<ShareSnapshotForm />` render + a11y + persona-leak DOM contract; logging hygiene (application-code scope); `<ShareUnavailable />` copy tone guard. |
| **S12 (stretch)** | **R10, R11, R13, R19, R20** | **T68, T69, T70, T71, T72, T73, T74, T75** | **Spec-only until `/implement S12` runs.** Route Handler `runtime = 'nodejs'`; happy-path response shape; ownership-check 404 parity (no leak); persona validation (missing + invalid); `renderSnapshotPdfToBuffer` smoke + outcome-state content coverage (presence not layout); `formatMoney` integration (money-string drift guard); logging hygiene (application-code scope); no-file-write spy. |

### Test plan → implementation (status tracking)

T15–T17 are reserved (unused); see §1. T46–T76 are stretch rows owned by S10 / S11 / S12 and remain `Pending (stretch)` until each `/implement` slice runs.

**Status values:** `Implemented` — the corresponding Vitest test file ships and passes against the current code. `Pending (manual)` — manual checklist verified by reviewer walkthrough, not by an automated runner (no Vitest path can satisfy these). `Pending (stretch)` — designed test row that ships alongside `/implement S10 | S11 | S12`; spec-only today. `Reserved` — intentional gap from an early test-plan numbering pass (T15, T16, T17); see §1 "Skipped test IDs".

| Test case ID | Requirement IDs | Tech-spec section IDs | Status |
|---|---|---|---|
| T1 | R1, R5 | S1 | Implemented |
| T2 | R5, R1 | S1 | Implemented |
| T3 | R5, R1 | S1 | Implemented |
| T4 | R1, R5 | S1 | Implemented |
| T5 | R1, R5, R9 | S1 | Implemented |
| T6 | R10, R4 | S1 | Implemented |
| T7 | R5, R4 | S1 | Implemented |
| T8 | R8, R4, R5, R9 | S1, S3 | Implemented |
| T9 | R2, R3, R4 | S2 | Implemented |
| T10 | R2, R4 | S2 | Implemented |
| T11 | R1, R5 | S2 | Implemented |
| T12 | R10 | S2 | Implemented |
| T13 | R8, R4 | S3 | Implemented |
| T14 | R8 | S3 | Implemented |
| T15 | — | — | Reserved |
| T16 | — | — | Reserved |
| T17 | — | — | Reserved |
| T18 | R2, R5, R4 | S5 | Implemented |
| T19 | R5, R10, R4 | S5 | Implemented |
| T20 | R10 | S5 | Implemented |
| T21 | R1, R7, R9, R20 | S4, S9 | Implemented |
| T22 | R7, R6 | S4 | Implemented |
| T23 | R2, R9 | S4, S5 | Implemented |
| T24 | R5, R18 | S5 | Implemented |
| T25 | R5, R18 | S5 | Implemented |
| T26 | R3, R7, R18, R20 | S6, S9 | Implemented |
| T27 | R7 | S6 | Implemented |
| T28 | R20 | S4, S6, S9 | Implemented |
| T29 | R6, R20 | S1 | Implemented |
| T30 | R4 | S7-setup | Implemented |
| T31 | R4 | S7-setup | Implemented |
| T43 | R20, R6 | S9 | Implemented |
| T32 | R20, R18 | S9 | Implemented |
| T33 | R2, R9 | S4 | Implemented |
| T34 | R18 | S4 | Implemented |
| T35 | R5 | S5 | Implemented |
| T36 | R2 | S5 | Implemented |
| T37 | R18 | S5 | Implemented |
| T38 | R6 | S5 | Implemented |
| T39 | R18 | S6 | Implemented |
| T40 | R14 | S8 | Pending (manual) — S018 shipped `README.md`; S019 refreshed it for the UI-polish surface; verified by reviewer walkthrough on the S019 re-verification of `/implement S8` (D-109) |
| T41 | R15, R17 | S8 | Pending (manual) — S018 shipped `DECISIONS.md` (incl. time-spent table); S019 added the polish row; verified by reviewer walkthrough on the S019 re-verification of `/implement S8` |
| T42 | R16 | S8 | Pending (manual) — S018 backfilled `docs/PROMPT_HISTORY.md`; S019 appended its own row; verified by reviewer walkthrough on the S019 re-verification of `/implement S8` |
| T44 | R7, R18 | S4 | Implemented |
| T45 | R7 | S4 | Implemented |
| T46 | R11, R19 | S10, S2 | Pending (stretch) — designed in S022; ships with `/implement S10` |
| T47 | R11, R19 | S10, S2 | Pending (stretch) — designed in S022; ships with `/implement S10` |
| T48 | R11, R19 | S10, S2 | Pending (stretch) — designed in S022; ships with `/implement S10` |
| T49 | R11, R10, R19 | S10 | Pending (stretch) — designed in S022; ships with `/implement S10` |
| T50 | R10, R11, R19 | S10, S1, S2 | Pending (stretch) — designed in S022; ships with `/implement S10` |
| T51 | R10, R11, R19 | S10, S2 | Pending (stretch) — designed in S022; ships with `/implement S10` |
| T52 | R12, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T53 | R12, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T54 | R12, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T55 | R12, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T56 | R12, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T57 | R12, R10, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T58 | R12, R10, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T59 | R12, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T60 | R12, R10, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T61 | R12, R10, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T62 | R12, R10, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T63 | R12, R10, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` (R10 added in S022 critic round per F2.2) |
| T64 | R12, R7, R20, R18, R10, R19 | S11, S10 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T65 | R12, R20, R7, R18, R10, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T66 | R12, R18, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T67 | R10, R12, R19 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |
| T68 | R13, R19 | S12 | Pending (stretch) — designed in S022; ships with `/implement S12` |
| T69 | R13, R19 | S12, S10 | Pending (stretch) — designed in S022; ships with `/implement S12` |
| T70 | R13, R10, R19 | S12 | Pending (stretch) — designed in S022; ships with `/implement S12` |
| T71 | R13, R10, R19 | S12 | Pending (stretch) — designed in S022; ships with `/implement S12` |
| T72 | R13, R19, R20, R7 | S12, S10, S9, S4 | Pending (stretch) — designed in S022; ships with `/implement S12` (R7 + S4 added in S022 critic round per F1.1 + F2.1 — support-signpost text presence asserted on the PDF surface) |
| T73 | R13, R11, R19 | S12, S10, S4 | Pending (stretch) — designed in S022; ships with `/implement S12` |
| T74 | R10, R13, R19 | S12 | Pending (stretch) — designed in S022; ships with `/implement S12` |
| T75 | R10, R13, R19 | S12 | Pending (stretch) — designed in S022; ships with `/implement S12` |
| T76 | R6, R20, R19, R12 | S11 | Pending (stretch) — designed in S022; ships with `/implement S11` |

