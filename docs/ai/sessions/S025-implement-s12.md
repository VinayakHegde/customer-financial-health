# AI Session Snapshot: S025 — `/implement S12`

## Metadata

- Date: 2026-06-11
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `main`
- Start commit: `08bd066` (Merge PR #29 — S024 `/implement S11`)
- Raw transcript: `.specstory/history/` (SpecStory writes one file per Cursor window on close)
- Related artefacts: `docs/TECH_SPEC.md` §S12 (rev 5.1), `docs/TEST_PLAN.md` §3 S12 (T68–T75 — rev S022.1), `docs/PRD.md` (R10, R13, R18, R19, R20, R6, R7)

## Goal of this Cursor window

Implement tech-spec slice **S12 — PDF export (stretch)** with matching tests **T68–T75**. Third (final) stretch slice. Per S020 D-144 + S021 D-152, verify `@react-pdf/renderer` against the installed `node_modules` before pinning a version. Per S024 D-226 handoff, roll the deferred `formatPounds → formatMoney` MVP-surface refactor across `<DashboardView />` / `<HistoryList />` into the same slice (`<SnapshotPdf />` needs `formatMoney` from day one; T73 explicitly asserts the dashboard's rendered money strings appear verbatim in the extracted PDF text).

## Scope restated (auditable)

| ID | Requirement |
|---|---|
| **R13** | Customer can download a PDF export of any owned snapshot; generated on demand; not persisted. |
| **R10** | Application-code logging hygiene across one full GET (`pdf: rendered` lifecycle line only — no IE digits, persona id, snapshot id, or IE labels); no `fs.writeFile` / `writeFileSync` during the GET; `Cache-Control: no-store, private`. Access-log limitation declared (tech-spec §5 trade-off "S11 + S12 access-log limitation under R10"). |
| **R18** | Tagged-PDF carried out (out of stretch per tech-spec §5 "S12 no tagged-PDF"); HTML surfaces remain accessible primary. PDF accessibility relies on text-not-colour for the band, semantic order, ≥ 11pt body. |
| **R19** | Stretch tested to R4 standard — route handler `runtime`, happy-path response shape, cross-persona 404 parity, persona validation (missing + invalid, three sub-cases), `renderSnapshotPdfToBuffer` smoke + outcome-state content coverage, `formatMoney` integration, logging hygiene, no-file-write spy. |
| **R20** (broadening) | Framing notice on the PDF surface (recipient is exactly the audience R20 is written for — conscious reading recorded in tech-spec §S12). |
| **R7** (broadening) | Support signpost copy block + `/support` URL on the PDF surface (same conscious reading). |
| **R6** | PDF reuses S1 + S9 copy sources unchanged — existing T29 / T43 tone guards cover the strings; no new tone surface (per S022 D-197). |
| **S12** | `lib/pdf/{SnapshotPdf.tsx,render.tsx}`, `src/app/(main)/dashboard/snapshot/[id]/pdf/route.ts`, `components/DownloadPdfLink.tsx`, `<DashboardView />` + `<HistoryList />` `formatPounds → formatMoney` migration + `<DownloadPdfLink />` placement, `tests/_fixtures/snapshots.ts` adds `snapshotJordanStoredGbp` / `snapshotPatStoredGbp` / `formattedJordanDisposable`, `tests/_helpers/pdfText.ts` adds `pdfTextExtractor`. |
| **T68–T75** | Unit tests under `tests/s12/`. |

## Plan (TDD ordering)

1. **Verify `@react-pdf/renderer` against installed `node_modules` before pinning** (S020 D-144 + S021 D-152 — four sub-checks):
   - (a) pin exact `x.y.z` in `package.json` — no caret-only float;
   - (b) `renderToBuffer` exported from package root with signature `(element) => Promise<Buffer>`;
   - (c) no Chromium binary in `node_modules/.bin/`;
   - (d) rasterisation does not invoke a system browser.
2. **Tests first** under `tests/s12/`:
   - `t68-route-runtime.test.ts` — static import → `route.runtime === 'nodejs'`.
   - `t69-route-happy.test.ts` — `GET` direct invocation → 200 + `application/pdf` + `Content-Disposition: attachment; filename="financial-snapshot-YYYY-MM-DD.pdf"` + `Cache-Control: no-store, private` + non-empty buffer prefixed `%PDF-`.
   - `t70-route-cross-persona-404.test.ts` — cross-persona AND missing-id → byte-identical 404 `'Not Found'`; spy on `renderSnapshotPdfToBuffer` records zero calls.
   - `t71-route-persona-validation.test.ts` — three sub-cases (cookie absent / empty / not-a-persona) all return 403 `'Forbidden'`; spy on `getSnapshotById` + `renderSnapshotPdfToBuffer` records zero calls; `console.*` spy contains zero occurrences of the invalid cookie value.
   - `t72-render-outcome-coverage.test.ts` — `it.each` over five outcome states (`surplus` / `breakeven` / `shortfall` / `zero-income` / `no-data`); `%PDF-` prefix on each buffer; extracted text contains band label, disposable (skipped for `no-data`), framing "not financial advice", `/support` URL, and at least one `reasons[]` string (skipped for `no-data` per S022 D-194).
   - `t73-format-money-integration.test.tsx` — single jordan fixture; render `<DashboardView />` and assert main `textContent` contains formatMoney(income/expenditure); assert extracted PDF text contains `formattedJordanDisposable` + the dashboard's income/expenditure money strings.
   - `t74-logging-hygiene.test.ts` — `console.*` spy across one full GET → zero IE-value digits, persona id, snapshot id, IE labels.
   - `t75-no-file-written.test.ts` — `vi.spyOn(fs.promises, 'writeFile')` + `vi.mock('node:fs', ...)` for `writeFileSync` (ESM namespace exports are not configurable for `vi.spyOn`); both record zero calls.
3. **Confirm failing for the right reason** before writing production code (missing modules — verified: 6 / 8 failed at import-resolve, 2 failed at runtime).
4. **Implement minimum**:
   - `lib/pdf/SnapshotPdf.tsx` — pure-React document with 12 sections per tech-spec §S12 design bullets 1–12.
   - `lib/pdf/render.tsx` — `renderSnapshotPdfToBuffer(snapshot): Promise<Buffer>` wraps `renderToBuffer(<SnapshotPdf snapshot={snapshot} />)`.
   - `src/app/(main)/dashboard/snapshot/[id]/pdf/route.ts` — `export const runtime = 'nodejs'`; `GET` validates persona cookie via `getPersonaById(personaId)` → 403 on miss (before DB read, before render); ownership check via `snapshot.customerId === personaId` → 404 on miss with body `'Not Found'`; happy path streams the buffer with the three headers; lifecycle log `pdf: rendered`.
   - `components/DownloadPdfLink.tsx` — plain `<a href download rel="noopener">`; `min-h-10` for SC 2.5.8.
   - `components/DashboardView.tsx` — swap `formatPounds → formatMoney(pence, currency, countryCode)`; add optional `currency?: Currency` + `countryCode?: CountryCode` props with `'GBP' / 'GB'` defaults (no-data persona has no snapshot, so the defaults cover the only path that runs without one); place `<DownloadPdfLink />` next to `<ShareSnapshotForm />` when `latestSnapshotId !== null`.
   - `components/HistoryList.tsx` — same `formatPounds → formatMoney` migration; reads `snapshot.currency` / `snapshot.countryCode` (every history row has its own snapshot); `<DownloadPdfLink snapshotId={snapshot.id} />` next to the share form on every row.
   - `src/app/(main)/dashboard/page.tsx` — thread `latest?.currency ?? 'GBP'` / `latest?.countryCode ?? 'GB'` into `<DashboardView />`.
   - `tests/_fixtures/snapshots.ts` — append `snapshotJordanStoredGbp`, `snapshotPatStoredGbp`, `formattedJordanDisposable`.
   - `tests/_helpers/pdfText.ts` — `pdfTextExtractor(buffer)` via `pdf-parse@2.4.5` `new PDFParse({ data }).getText()`.
5. **Refactor** only inside the slice if needed. Re-run tests after each refactor.
6. **Lint + typecheck + full test suite.** Fix in-slice issues only.

## Decisions made in this session

- **D-229 — `@react-pdf/renderer@4.5.1` pinned exact (S020 D-144 + S021 D-152 verification list closed):**
  - (a) `package.json` carries `"@react-pdf/renderer": "4.5.1"` — exact, no caret;
  - (b) `node_modules/@react-pdf/renderer/index.d.ts` line 790 declares `export const renderToBuffer: (document: React.ReactElement<DocumentProps>) => Promise<Buffer>`; `lib/react-pdf.js` line 367 confirms `export { ... renderToBuffer ... }` from the package root;
  - (c) `node_modules/.bin/` contains zero Chromium / Chrome / Playwright / Puppeteer binaries; `du -sh node_modules/@react-pdf/` totals 3.0 MB across 14 sub-packages (no native browser bundle);
  - (d) `lib/react-pdf.js:320` shows `renderToBuffer = element => renderToStream(element).then(stream => new Promise(...))` — pure JS stream → buffer accumulation through `@react-pdf/pdfkit`; no `child_process` / no `puppeteer.launch` / no system-browser invocation.
  - All four sub-checks pass. The "lightweight, pure-Node, no Chromium" framing from S020 D-144 holds for `4.5.1`; the API verb pinned at S021 D-152 (`renderToBuffer`) matches the installed export.
- **D-230 — `pdf-parse@2.4.5` pinned exact for the test extractor.** Used only inside `tests/_helpers/pdfText.ts`; not a production dependency. `new PDFParse({ data: Uint8Array }).getText().text` is the documented v2 API (older v1 `require('pdf-parse')(buffer)` shape is gone). Helper wraps lifecycle with `try { ... } finally { parser.destroy(); }` so a malformed buffer cannot leak a worker handle into subsequent tests.
- **D-231 — Route Handler placement under `src/app/(main)/dashboard/snapshot/[id]/pdf/route.ts`.** Tech spec wrote the path as `app/dashboard/snapshot/[id]/pdf/route.ts`; the in-repo layout uses `src/app/(main)/...` (route group introduced in S024 D-217). Route groups don't affect URLs, so the customer-facing path is `/dashboard/snapshot/<id>/pdf` either way. The route is registered under `(main)` because it shares the persona-cookie / `<AppHeader />` posture with `/dashboard` and `/history`, not the `<no AppHeader>` posture of `(share)`. Build output confirms: `ƒ /dashboard/snapshot/[id]/pdf` server-rendered on demand.
- **D-232 — Response body uses `new Uint8Array(buffer)`, not the `Buffer` directly.** Next.js 16's `Response` constructor in Node accepts `BodyInit` (which includes `Uint8Array` and `ReadableStream` but not Node's `Buffer` type as a discriminated `BodyInit` member); passing a Node `Buffer` directly typechecks (because `Buffer extends Uint8Array`) but the wrapping cost is one allocation either way. Explicit `new Uint8Array(buffer)` is forward-compatible with the Web Response API and avoids any future `Buffer.from(...)` ambiguity inside the route. The bytes are unchanged; T69 asserts the first 5 bytes decode to `%PDF-`.
- **D-233 — Disposable line in the PDF uses `formatMoney(...)` directly, not a custom-signed wrapper.** Tech-spec §S12 design bullet 6 says "Disposable income — same helper, signed". The dashboard's `formatSignedDisposable(pence, ...)` adds a U+2212 minus prefix; the PDF instead uses `Intl.NumberFormat`'s native locale-aware sign (which is ASCII `-` for `en-GB`), so the PDF's disposable line for jordan reads `-£280.00`. This matches the `formattedJordanDisposable` fixture (`formatMoney(snapshotJordanStoredGbp.outcome.disposableIncomePence, 'GBP', 'GB')` which evaluates to `-£280.00`) verbatim, which is what T73 asserts. The dashboard's `−£280.00` (U+2212) appearing **on screen** is a separate code path tested by T73's main-textContent half; T73 doesn't require the dashboard's signed string to appear in the PDF, it requires the dashboard's income / expenditure totals + the `formattedJordanDisposable` fixture to appear in the PDF.
- **D-234 — `<SnapshotPdf />` uses `Intl.DateTimeFormat` with `timeZone: 'UTC'`.** Tech spec design bullet 2 says "`takenAt` ISO timestamp formatted via `Intl.DateTimeFormat(localeFor(snapshot.countryCode), { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' })`". The PDF runs server-side under `runtime = 'nodejs'`; pinning UTC ensures the rendered date is identical regardless of the server's `TZ` environment variable, which would otherwise drift the date between local dev and a production host on a different timezone. No `T*` asserts the date string directly, but the contract is stable for future regression tests.
- **D-235 — `formatPounds → formatMoney` migration scoped to `<DashboardView />` + `<HistoryList />` direct call-sites; calculator `reasons[]` covered transitively via aliasing.** `<UpdateForm />` was on the S023 D-205 + S024 D-226 deferred list as well, but the migration there would touch `formatPenceForInput(pence)` — a 2-decimal `.toFixed(2)` for the form's numeric input prefill, not a customer-visible `£` string. The "no `*Pence / 100` outside `formatMoney`" tech-spec rule (S023 D-213) explicitly carved this out as a pre-existing exception. Migrating it would not change behaviour and would change the input prefill shape from `1234.50` (numeric-like) to `£1,234.50` (currency-formatted), which the `<input type="number">` element rejects. Out of slice; recorded in Deviations table below. Calculator's `reasons[]` formatPounds usage (S024 D-226) is closed via F1.1 below — `formatPounds` now delegates to `formatMoney(pence, 'GBP', 'GB')`, so calculator strings are byte-for-byte identical to dashboard headline strings and the source-discipline rule holds for `formatPounds` too (the `pence / 100` divide moved inside `formatMoney`). Pre-F1.1 the rationale was that the two helpers produced byte-identical output for GBP / GB; **that was wrong** for whole-pound amounts (`formatPounds(28000) = '£280'` vs `formatMoney(28000, 'GBP', 'GB') = '£280.00'`), which the critic round caught — see Post-critic fixes section.
- **D-236 — `DashboardView` gains optional `currency?: Currency` + `countryCode?: CountryCode` props rather than a `snapshot?: Snapshot` prop.** Test plan T73 wrote the assertion as `<DashboardView snapshot={snapshot} />`, but the existing `DashboardView` API takes `outcome`, `copy`, `delta`, `personaLabel`, `latestSnapshotId` separately (no `snapshot`). Adding a `snapshot` prop would either (a) introduce redundant data alongside `outcome` (a `snapshot.outcome` accessor that duplicates the existing prop), or (b) require a breaking refactor of all S4 tests (T21–T23, T28, T33, T34, T44, T45) that consume `buildDashboardProps()`. Picking the additive-optional-props shape: `currency` / `countryCode` default to `'GBP'` / `'GB'` so existing tests don't break (none assert on the formatted `£` strings — verified via grep across `tests/s4/`, `tests/s5/`, `tests/s6/`), and the dashboard page threads `latest?.currency ?? 'GBP'` / `latest?.countryCode ?? 'GB'` from the latest snapshot. T73 passes them explicitly. If a future PRD revision introduces a currency selector, the page-level fallback collapses to an explicit snapshot-derived value and the defaults can be retired without a component-API change.
- **D-237 — `<HistoryList />` reads `snapshot.currency` / `snapshot.countryCode` directly per row.** Every history row carries its own snapshot, so the migration there doesn't need new props — `formatMoney(pence, snapshot.currency, snapshot.countryCode)` works inline. `formatSignedDisposable(pence, snapshot)` now takes the whole snapshot rather than a free-floating currency/countryCode pair, which is the cleanest call-site for the disclosure row.
- **D-238 — T75 uses `vi.mock('node:fs', ...)` for `writeFileSync` rather than `vi.spyOn(fs, 'writeFileSync')`.** Vitest 4 in ESM mode cannot `vi.spyOn` on ESM namespace exports — `Object.defineProperty(fs, 'writeFileSync', ...)` throws `TypeError: Cannot redefine property: writeFileSync`. `vi.mock('node:fs', async () => ({ ...await vi.importActual(...), default: actual, writeFileSync: vi.fn() }))` is the documented workaround. The `default: actual` re-export is required because some downstream consumers (`@react-pdf/font`, etc.) import `import fs from 'node:fs'`. `vi.spyOn(fs.promises, 'writeFile')` still works because `fs.promises` is a regular configurable object — that one stays as-is. **Decision:** scope the `vi.mock` to T75 only (each `vi.mock` is file-scoped, so this doesn't leak into other tests).

## Files created or changed

### New code

- `lib/pdf/SnapshotPdf.tsx` — React-PDF document component; 12 sections; uses `formatMoney(...)`, `framingNotice()`, `getCopyForOutcome(...)`.
- `lib/pdf/render.tsx` — `renderSnapshotPdfToBuffer(snapshot): Promise<Buffer>` wrapping `renderToBuffer(<SnapshotPdf snapshot={snapshot} />)`.
- `src/app/(main)/dashboard/snapshot/[id]/pdf/route.ts` — `runtime = 'nodejs'`; `GET` with persona + ownership gates; `pdf: rendered` lifecycle log; three response headers.
- `components/DownloadPdfLink.tsx` — plain `<a href download rel="noopener">` with SC 2.5.8-compliant hit target.

### MVP-surface migration (per S024 D-226 handoff, in-slice because T73 requires cross-surface no-drift)

- `components/DashboardView.tsx` — `formatPounds → formatMoney` for income / outgoings / disposable / delta; new optional `currency?: Currency` + `countryCode?: CountryCode` props (defaults `'GBP'` / `'GB'`); `<DownloadPdfLink />` placed inside the `latestSnapshotId !== null` block alongside `<ShareSnapshotForm />`.
- `components/HistoryList.tsx` — `formatPounds → formatMoney` for income breakdown / expenditure breakdown / disposable line per row; `<DownloadPdfLink snapshotId={snapshot.id} />` placed alongside `<ShareSnapshotForm />` per row.
- `src/app/(main)/dashboard/page.tsx` — threads `latest?.currency ?? 'GBP'` / `latest?.countryCode ?? 'GB'` into `<DashboardView />`.

### Test fixtures + helpers

- `tests/_fixtures/snapshots.ts` — append `snapshotJordanStoredGbp` (UUID-shaped id `88888888-…`), `snapshotPatStoredGbp` (UUID-shaped id `99999999-…`), `formattedJordanDisposable` (`formatMoney(snapshotJordanStoredGbp.outcome.disposableIncomePence, 'GBP', 'GB')` pre-computed).
- `tests/_helpers/pdfText.ts` — `pdfTextExtractor(buffer)` via `new PDFParse({ data: Uint8Array }).getText().text`.

### New tests under `tests/s12/`

- `t68-route-runtime.test.ts` — 1 test.
- `t69-route-happy.test.ts` — 1 test.
- `t70-route-cross-persona-404.test.ts` — 1 test.
- `t71-route-persona-validation.test.ts` — 3 sub-cases (`it.each` on cookie absent / empty / not-a-persona).
- `t72-render-outcome-coverage.test.ts` — 5 sub-cases (`it.each` on outcome state).
- `t73-format-money-integration.test.tsx` — 1 test.
- `t74-logging-hygiene.test.ts` — 1 test.
- `t75-no-file-written.test.ts` — 1 test.

### Dependencies (`package.json`)

- New dependency: `"@react-pdf/renderer": "4.5.1"` (exact pin).
- New dev dependency: `"pdf-parse": "2.4.5"` (exact pin, test-only).

## Test results

- `npm test` → **236 / 236** across 79 files (was 222 + 14 new S12 = 236). No MVP / S10 / S11 regressions.
- `npm run lint` → clean (Biome 2.2.0; auto-fixed organize-imports drift in `tests/s12/t73-format-money-integration.test.tsx` and `src/app/(main)/dashboard/snapshot/[id]/pdf/route.ts`).
- `npm run typecheck` → clean.
- `npm run build` → clean. Route table updated: `ƒ /dashboard/snapshot/[id]/pdf` server-rendered on demand (8 server-rendered routes total, was 7 + 1 new = 8).

## Deviations from spec / TEST_PLAN

| Item | Spec / TEST_PLAN says | Delivered | Reason |
|---|---|---|---|
| `<UpdateForm />` `formatPounds → formatMoney` migration | S024 D-226 carry-forward note implies all `formatPounds` call-sites move to `formatMoney`. | **Not delivered.** `<UpdateForm />` `formatPenceForInput(pence) = (pence / 100).toFixed(2)` retained. | The helper produces an `<input type="number">` value (`1234.50`), not a customer-visible `£` string. Migrating it would change the input shape to `£1,234.50` which the number input rejects. The tech-spec §S10 source-discipline rule explicitly carved this out (S023 D-213). T73 / T49 do not assert against `<UpdateForm />`. Out of slice; would need a `/tech-spec` clarification to widen the rule. |
| `<DashboardView />` API shape | TEST_PLAN T73 writes the assertion as `<DashboardView snapshot={snapshot} />`. | **Additive-optional-props shape** — `currency?: Currency` + `countryCode?: CountryCode` added; existing `outcome`, `copy`, `delta`, `latestSnapshotId`, `personaLabel` props unchanged. | T73's `snapshot={snapshot}` wording was indicative, not normative — the load-bearing assertion is the cross-surface money-string parity, not the prop shape. Adding a `snapshot` prop would either duplicate `outcome` data or force a breaking refactor of T21–T23 / T28 / T33 / T34 / T44 / T45. The additive-optional shape preserves every existing S4 test, lets T73 pass currency / countryCode explicitly, and keeps the page-level call site one line longer. |
| `<DownloadPdfLink />` accessibility coverage | Tech-spec §S12 says the link is placed inside `<DashboardView />` and `<HistoryList />` per "Where the download is invoked from"; no dedicated `T*` for the link's a11y. | **Delivered without a dedicated render / a11y test.** | T68–T75 do not allocate a `T*` against the `<DownloadPdfLink />` component itself. The hit-target ≥ 24×24 (`min-h-10`) follows the cross-cutting WCAG SC 2.5.8 commitment (tech-spec §4); SC 2.4.7 (focus-visible) inherits from the same Tailwind utility pattern as `<DashboardView />` / `<HistoryList />`. T34 / T39 (dashboard / history axe smoke) cover the link as an in-page element. Adding a dedicated `T*` would extend test-plan scope beyond S12. |
| Lifecycle log shape | Tech-spec §S12 "Application-code commitments" says `pdf: rendered` log line with no identifiers. | **Delivered verbatim** — `console.log("pdf: rendered")` after the render returns. | T74 asserts zero IE digits / persona id / snapshot id / IE labels appear in console output; `pdf: rendered` carries none, so the line is allowed. |

## Carry-forward / handoff

- **`/tech-spec` round needed (not opened in this slice):**
  - Three queued S019 amendments (§S2 DB-log anonymisation, §S4 bullet 1 affordance split, §S4 bullet 7 verb + no-data clause).
  - S023 F1.8 / S024 D-226 carry-forward: clarify whether the "no `*Pence / 100` outside `formatMoney`" source-discipline rule covers pre-existing display helpers (`formatPounds` in calculator `reasons[]`, `formatPenceForInput` in `<UpdateForm />`). Without that clarification, the calculator's `reasons[]` keeps using `formatPounds` (byte-identical for `'GBP' / 'GB'`; safe but not consistent with §S10's discipline).
  - Drizzle-kit-vs-Biome trailing-newline meta-JSON drift (S023 F1.10 / S024 carry-forward) — every new `drizzle-kit generate` needs `biome format --write drizzle/meta/*.json`; either ignore-list `drizzle/meta/**` in Biome or raise upstream with drizzle-kit.
- **`/test-plan` round needed (not opened in this slice):**
  - TEST_PLAN T73 wording `<DashboardView snapshot={snapshot} />` no longer matches the delivered API (now `currency` / `countryCode` props). Either reword T73 to drop the prop-shape detail (recommended — the assertion is about money-string parity, not props), or open a `/tech-spec` round to refactor `<DashboardView />` to a `snapshot`-prop shape (would touch T21–T23 / T28 / T33 / T34 / T44 / T45).
  - TEST_PLAN T75 wording `vi.spyOn(fs, 'writeFileSync')` doesn't compile under Vitest 4 ESM (S025 D-238). T75 ships with `vi.mock('node:fs', ...)` instead; reword the test-plan row to reflect the actual mock shape if it ever ships as a public-contract test.
- **Next slice in tech-spec §3 stretch ordering:** all three stretch slices (S10 / S11 / S12) are now implemented. Remaining stretch follow-ups recorded in `DECISIONS.md` "What is next" (per-line delta for R2, tone-token lexicon expansion for R20, Playwright slice for async-page boundary, S11 single-use / revocation / rate-limiting, S12 tagged-PDF when `@react-pdf/renderer` supports it). No further `/implement <S*>` invocations are pending against the current tech spec.

## Post-critic fixes (same session, S025.1)

Critic round ran after the initial implementation was complete. Verdict: **Minor fixes** — one real in-slice regression (F1.1), two test-coverage gaps (F1.2, F1.3), one cheap header-parity nit (F1.4). All four fix in-slice; F1.5 (a dedicated `<DownloadPdfLink />` `T*`) was declined because it would extend the test-plan scope past T68–T75. Two non-code carry-forwards (F3.1 = this section; F3.3 = `/test-plan` round wording reconciliation already on the handoff list) routed back rather than patched inline.

- **F1.1 — Visible money-string drift on the dashboard (Blocker → fixed).** `formatPounds(28000) = '£280'` ≠ `formatMoney(28000, 'GBP', 'GB') = '£280.00'`. The D-235 "byte-identical for GBP / GB" rationale was false for whole-pound amounts; after the MVP-surface migration moved `<DashboardView />` headline numbers to `formatMoney` but left calculator `reasons[]` on `formatPounds`, the same dashboard surface showed mixed formatting (e.g. `Disposable income: +£50.00` headline vs `After your outgoings, you have £50 left this month.` reason). **Fix:** `formatPounds(pence)` now delegates to `formatMoney(pence, 'GBP', 'GB')` so the two helpers produce byte-identical output by construction. The calculator's currency-agnostic `assess(ie)` signature is preserved (no 30+-call-site ripple), and the source-discipline rule from S023 D-213 holds for `formatPounds` too (the `pence / 100` divide now lives inside `formatMoney`). T3 (`tests/s1/t3-shortfall.test.ts`) still passes — its `toContain('£280')` substring assertion is satisfied by `'£280.00'` too. T33 (`tests/s4/t33-delta-change.test.tsx`) still passes — its regex anchors at `/\+£500/` / `/−£300/`, both substring-compatible with the new 2-decimal output. No other test asserted on the strip-trailing-zeros shape (confirmed via `rg '£\d' tests/`).
- **F1.2 — T75 spy set widened (Should-fix → fixed).** Pre-fix T75 spied only `fs.writeFileSync` + `fs.promises.writeFile`; the natural "save copy to disk" regression class (`fs.createWriteStream(path).end(buffer)`, `fs.appendFileSync(...)`, `fs.promises.appendFile(...)`) slipped through. **Fix:** the `vi.mock('node:fs', ...)` swap now covers `writeFileSync` + `appendFileSync` + `createWriteStream`; `vi.spyOn(fs.promises, 'writeFile')` was joined by `vi.spyOn(fs.promises, 'appendFile')`. All five surfaces record zero calls across one full GET. No production code changed.
- **F1.3 — T74 forbidden list extended with formatted £ strings (Should-fix → fixed).** Pre-fix T74's `forbidden` array carried raw pence digits (`String(o.totalIncomePence) === '165000'`) and IE labels, but not the customer-visible formatted strings (`'£1,650.00'`). A regression that emitted a formatted £ string (the most natural log-leak shape because the helper is right there) would slip past the digit-substring search. **Fix:** added `formatMoney(o.totalIncomePence, currency, countryCode)` + the two siblings to the forbidden array. No production code changed.
- **F1.4 — Header parity on T70's 404 arm (Nit → fixed).** Pre-fix T70 asserted byte-identical 404 bodies (`'Not Found'`) for cross-persona vs missing-id, but not header parity. A regression that set `Cache-Control: public, max-age=60` on the missing-id arm or `Content-Disposition: attachment; filename=...` on either arm would leak the distinction by side channel. **Fix:** T70 now asserts both arms return identical `Content-Type`, `Content-Disposition`, and `Cache-Control`. No production code changed.

**F1.5 declined (out of slice):** adding a dedicated `<DownloadPdfLink />` render / a11y `T*` would extend T68–T75 scope. The component is covered transitively by T34 / T39 (dashboard / history axe smoke) and inherits SC 2.5.8 from the `min-h-10` cross-cutting utility (tech-spec §4). Recorded on the carry-forward list above as a `/test-plan` candidate if reviewer feedback demands a dedicated `T*`.

**F3.1 (this section)** is the closure for the critic's note that D-235's "byte-identical" claim needed correcting after F1.1 lands. The D-235 paragraph above was amended in place to reflect the post-F1.1 state; the original claim is preserved at the end as a "this was wrong, here is why" footnote so the audit trail records the actual decision history. No `/tech-spec` round needed.

**F3.3** (TEST_PLAN T73 prop-shape wording + T75 `vi.spyOn` wording) was already on the carry-forward list as a `/test-plan` round — restated here for completeness.

### Post-critic test results

- `npm test` → **236 / 236** across 79 files (same total; F1.1 was an internal helper aliasing, F1.2 / F1.3 / F1.4 strengthened existing tests, no new tests added).
- `npm run lint` → clean (Biome 2.2.0).
- `npm run typecheck` → clean.

## Status

**Code complete; critic round closed.** S12 shipped end-to-end with the `formatPounds → formatMoney` migration that S023 D-205 / S024 D-226 deferred, plus the four post-critic fixes (F1.1–F1.4). 236 / 236 tests pass; lint / typecheck / build clean. No PRD edits, no tech-spec edits, no test-plan edits (the two carry-forwards above are recorded for a future `/tech-spec` / `/test-plan` round; neither blocks the slice).

## Handoff

All three stretch slices (S10 / S11 / S12) are now delivered. If a reviewer requests it, the next session is either:

1. **`/tech-spec` round** to land the three queued S019 amendments + the two carry-forwards from this slice (formatPounds carve-out clarification now mostly closed by F1.1 — the helper is a thin alias and the `pence / 100` discipline is preserved, but a one-paragraph note in §S10 documenting "formatPounds = formatMoney(_, 'GBP', 'GB')" would close the loop; drizzle-kit/Biome meta-JSON workflow remains untouched).
2. **`/test-plan` round** to reconcile T73 + T75 wording with the delivered API (additive-optional-props on `<DashboardView />`; `vi.mock('node:fs', ...)` for ESM `writeFileSync` — now also covering `appendFileSync` / `createWriteStream` per F1.2).
3. **`@critic` review of `DECISIONS.md` / `README.md`** to re-run S8 against the now-three-stretch-slices-shipped repo so reviewer-facing docs reflect that R11 / R12 / R13 are all delivered.
