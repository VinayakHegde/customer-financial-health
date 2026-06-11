# AI Session Snapshot: S023 — `/implement S10`

## Metadata

- Date: 2026-06-11
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `main`
- Start commit: `76f8ba1bb337f06054ee29984bc75590a36adc8b`
- Raw transcript: `.specstory/history/2026-06-11_20-45-30Z-affordability-feature-implementation-details.md`
- Related artefacts: `docs/TECH_SPEC.md` §S10 (rev 5.1), `docs/TEST_PLAN.md` §3 S10 (T46–T51 — rev S022.1), `docs/PRD.md` (R10, R11, R19)

## Goal of this Cursor window

Implement tech-spec slice **S10 — Currency and country_code (stretch)** with matching tests **T46–T51**. First stretch slice landed; unblocks `formatMoney` for S11 and S12.

## Scope restated (auditable)

| ID | Requirement |
|---|---|
| **R10** | Data minimisation / logging hygiene — no `currency` / `country_code` / `'GBP'` / `'GB'` in `console.*` (T51). Integer-pence invariant preserved at the persistence boundary (T50). |
| **R11** | `currency` + `country_code` columns added to `snapshots` with `'GBP'` / `'GB'` defaults; `Snapshot` type extended; `formatMoney` helper. |
| **R19** | Stretch tested to the same standard as R4 — branch matrix + repository round-trip + integer-pence invariant + logging hygiene. |
| **S10** | `lib/affordability/format.ts#formatMoney`, Drizzle migration `0001_*` adding `currency`/`country_code` columns, schema + repository extensions, type narrowing in `lib/affordability/types.ts`. |
| **T46–T51** | Unit + in-memory SQLite tests under `tests/s10/`. |

## Plan (TDD ordering)

1. **Tests first** — add failing tests under `tests/s10/`:
   - `t46-migration-columns.test.ts` — `PRAGMA table_info('snapshots')` shows `currency` `TEXT NOT NULL DEFAULT 'GBP'` + `country_code` `TEXT NOT NULL DEFAULT 'GB'`.
   - `t47-default-backfill.test.ts` — `createSnapshot({...})` without `currency`/`countryCode` returns `'GBP'`/`'GB'`; `getLatestSnapshot` round-trips the same.
   - `t48-repository-round-trip.test.ts` — explicit `createSnapshot({ ..., currency: 'GBP', countryCode: 'GB' })` × 2 personas; `getLatestSnapshot` + `listSnapshots` carry both fields newest → oldest.
   - `t49-format-money.test.ts` — `.toBe(...)` for the three positive cases + regex match for the negative case.
   - `t50-integer-pence-invariant.test.ts` — across the 8 distinct persona / synthetic IE fixtures (`iePatSurplus`, `ieSamNearBreakeven`, `ieJordanShortfall`, `ieAlexZeroIncome`, `ieRileyNoData`, `ieCaseyIrregular`, `ieMorganDrewJoint`, `ieBreakevenExact`), every numeric field on the persisted `outcome` is `Number.isInteger(...) === true`; `Delta.disposableDeltaPence` from `computeDelta(snapshots)` is also integer for every persona pair (second snapshot rotated by one position so every pair exercises a non-zero delta — closes critic F1.5).
   - `t51-logging-hygiene.test.ts` — `console.*` spy across `makeDb()` open + `createSnapshot` (default + explicit) contains zero occurrences of `'GBP'` / `'GB'` / `'currency'` / `'country_code'`.
2. **Confirm failing** for the right reason (tests can't compile / migration missing / `formatMoney` undefined).
3. **Implement minimum** to make them pass:
   - `lib/affordability/types.ts` — add `currency: 'GBP'` and `countryCode: 'GB'` literal-narrowed fields on `Snapshot`.
   - `lib/db/schema.ts` — two new `text(...).notNull().default('...')` columns (`currency`, `country_code`).
   - `drizzle/0001_*.sql` + `drizzle/meta/0001_snapshot.json` + journal entry — `ALTER TABLE` for both columns with the correct defaults.
   - `lib/db/snapshots.ts` — `CreateSnapshotInput` accepts optional `currency` / `countryCode`; `rowToSnapshot` projects both fields onto the `Snapshot`.
   - `lib/affordability/format.ts` — new `formatMoney(pence, currency, countryCode)` function; existing `formatPounds` left alone so the calculator's reasons output stays byte-identical (per `Existing render assertions still pass`).
   - `lib/affordability/index.ts` — re-export `formatMoney`.
4. **Refactor** only inside the slice if needed. Re-run tests after each refactor.
5. Run `npm run lint` + `npm run typecheck` + full `npm test`. All MVP tests must still pass.
6. Update this snapshot + `docs/PROMPT_HISTORY.md` row.

## Decisions

- **D-204 — `Currency` / `CountryCode` exported as named types from `lib/affordability/types.ts`.** The tech-spec inline type block uses literal-only fields (`currency: 'GBP'`, `countryCode: 'GB'`), but exporting the literal-narrowed unions as named types keeps the repository's `CreateSnapshotInput` signature `currency?: Currency` legible without spreading the literal across module boundaries. Widening to `string` (the §5 trade-off "S10 currency type narrowing") is now a one-line edit if a future slice ever introduces a selector.
- **D-205 — `formatPounds` retained alongside `formatMoney`.** `formatPounds` is the legacy helper that powers the calculator's `reasons[]` strings (`lib/affordability/calculator.ts`). It is byte-identical to `formatMoney(pence, 'GBP', 'GB')` for the currencies / countries the MVP ships, so the spec's "Existing render assertions still pass" guarantee holds. Retiring `formatPounds` in favour of `formatMoney` everywhere (and threading `snapshot.currency` / `snapshot.countryCode` through `<DashboardView />` / `<HistoryList />` / `<UpdateForm />`) is a separate refactor, not in this slice's tests, and is recorded in **Deviations** below as an out-of-slice surface.
- **D-206 — Drizzle migration generated by `drizzle-kit generate`, not hand-rolled.** Mirrors the S2 baseline workflow (`0000_naive_groot.sql` was likewise drizzle-kit-generated). Migration filename: `0001_s10_currency_country.sql`; meta updated automatically. Biome flagged trailing-newline drift on the generated `_journal.json` + `0001_snapshot.json` and was auto-fixed with `biome format --write` (drizzle-kit doesn't emit a trailing newline; Biome's formatter wants one).
- **D-207 — Snapshot literal fixtures backfilled with `currency: 'GBP'`, `countryCode: 'GB'`.** Five test files constructed `Snapshot` objects directly (`tests/_fixtures/snapshots.ts`, `tests/s4/compute-delta.test.ts`, `tests/s6/t26`/`t27`/`t28`/`t39`). All five updated to satisfy the new required fields. No behaviour change — the fields are not asserted against; the touch is purely structural to keep the type extension non-breaking.

## Files changed

- `lib/affordability/types.ts` — `Currency` (`'GBP'`) and `CountryCode` (`'GB'`) literal unions; `Snapshot` extended with `currency: Currency` + `countryCode: CountryCode`.
- `lib/affordability/format.ts` — new `formatMoney(pence, currency, countryCode)`; `localeByCountryCode` lookup `GB → en-GB`; `formatPounds` retained.
- `lib/affordability/index.ts` — re-export `formatMoney`.
- `lib/db/schema.ts` — two new columns: `text("currency").notNull().default("GBP")` + `text("country_code").notNull().default("GB")`.
- `lib/db/snapshots.ts` — `CreateSnapshotInput` accepts optional `currency?` / `countryCode?`; defaults applied via `DEFAULT_CURRENCY` / `DEFAULT_COUNTRY_CODE`; `rowToSnapshot` projects both fields onto the returned `Snapshot`; insert payload carries them through.
- `drizzle/0001_s10_currency_country.sql` (new) — `ALTER TABLE` for both columns with the correct defaults.
- `drizzle/meta/_journal.json` (regenerated) — adds entry for `0001_s10_currency_country`.
- `drizzle/meta/0001_snapshot.json` (new) — drizzle-kit snapshot for the new schema.
- `tests/s10/t46-migration-columns.test.ts` (new)
- `tests/s10/t47-default-backfill.test.ts` (new)
- `tests/s10/t48-repository-round-trip.test.ts` (new)
- `tests/s10/t49-format-money.test.ts` (new)
- `tests/s10/t50-integer-pence-invariant.test.ts` (new)
- `tests/s10/t51-logging-hygiene.test.ts` (new)
- `tests/_fixtures/snapshots.ts` — fixture extended with `currency`/`countryCode`.
- `tests/s4/compute-delta.test.ts` — `toSnapshot` helper extended.
- `tests/s6/t26-history-list-states.test.tsx`, `tests/s6/t27-signpost-ubiquity.test.tsx`, `tests/s6/t28-framing-ubiquity-history.test.tsx`, `tests/s6/t39-history-list-a11y.test.tsx` — `Snapshot` literals extended.
- `docs/ai/sessions/S023-implement-s10.md` (this file).
- `docs/PROMPT_HISTORY.md` — S023 row appended.

## Tests run

- `npm test -- tests/s10/` — 17 / 17 passed (T46 1 it, T47 1, T48 1, T49 4 it across one describe, T50 9 it via `it.each` + 1, T51 1).
- `npm test` (full suite) — **148 / 148 passed** (was 131 + 17 new S10 = 148; no MVP regressions).
- `npm run lint` — clean (after `biome format --write` on drizzle-kit's regenerated meta JSON).
- `npm run typecheck` — clean.
- `npm run build` — clean (8 static pages, no new routes).

## Deviations from spec

| Item | Spec says | Delivered | Reason |
|---|---|---|---|
| UI call-sites read `snapshot.currency` / `snapshot.countryCode` | TECH_SPEC §S10 "Read sites that get the new fields for free" — `<DashboardView />`, `<HistoryList />`, `<UpdateForm />` swap inline `Intl.NumberFormat` / `formatPounds` calls for `formatMoney(pence, snapshot.currency, snapshot.countryCode)`. | **Deferred** — `formatPounds` still owns the customer-visible `£` strings in `<DashboardView />` / `<HistoryList />` / `<UpdateForm />`; calculator `reasons[]` strings are also unchanged. | T46–T51 (the in-scope tests for this slice) do not assert against UI surfaces. The user prompt scoped this `/implement` to "format.ts + Drizzle migration adding currency / country_code defaults; type narrowing in `lib/affordability/types.ts`; tests T46–T51". The on-screen string is byte-identical for the only currency the MVP ships (£), so the deferral is behaviour-neutral; the read-site change is also behaviour-neutral. Filed for a follow-up `/implement` round when S11 needs `formatMoney` on `<SharedStatementView />` (S11's tests already require `formatMoney(snapshot.outcome.disposableIncomePence, snapshot.currency, snapshot.countryCode)` per tech-spec §S11 + test-plan T57 / T64); rolling the MVP UI surfaces into S11 keeps both threads converging on a single `formatMoney` source. |
| Source-discipline rule "no `*Pence / 100` outside `formatMoney`" has additional in-tree exceptions | TECH_SPEC §S10 line 476 — "No call site outside `formatMoney` is allowed to divide a `*Pence` value by 100; doing so re-introduces float drift in the comparisons S1 makes." | **Two pre-existing exceptions remain** — `lib/affordability/format.ts#formatPounds` (calculator `reasons[]`) and `components/UpdateForm.tsx#formatPenceForInput` (form prefill). Both are display-only divides that pre-date S10. The new `formatMoney` honours the rule. | Closes critic F1.8. The runtime invariant T50 protects (`Number.isInteger(...)` on every persisted `outcome` field + `Delta.disposableDeltaPence`) is preserved regardless of how display helpers internally divide. The TECH_SPEC source-discipline rule was authored with `formatMoney` as the only non-trivial display surface in mind; the rule's interaction with pre-existing helpers (`formatPounds`, `formatPenceForInput`) is not captured. **Routed back to `/tech-spec`** for clarification before `/implement S11` lands `<ShareSnapshotForm />`'s own prefill helper — not patched in this `/implement` round per workflow rule 2 (do not edit a later artefact to fix a gap in an earlier one). |
| Named TEST_PLAN §2.3 stretch fixtures (`snapshotJordanStoredGbp`, `snapshotPatStoredGbp`, `formattedJordanDisposable`) not exported as factories | TEST_PLAN §2.3 inventories the fixture *shapes* and lists `Used-by:` columns spanning T47–T75; mirrors how MVP fixtures live in `tests/_fixtures/ie.ts`. | **Materialised inline** — T47 / T48 / T49 build the rows in their own test bodies via `createSnapshot({...})` and `getLatestSnapshot(...)` rather than importing named factories. | Closes critic F1.6. TEST_PLAN §2.3 is shape-only, not export-required, so the inline materialisation is permitted. Factoring `snapshotJordanStoredGbp` / `snapshotPatStoredGbp` / `formattedJordanDisposable` into `tests/_fixtures/snapshots.ts` becomes worthwhile when `/implement S11` consumes them across T56 / T57 / T59 / T60 / T64 / T67 (per the §2.3 `Used-by` column); deferring the factor-out keeps this slice's touch surface minimal and lets S11 introduce the named exports under one API contract review. |

## Critic round (S023.1 — same-session, in-scope close-out)

`@critic` review of the S10 implementation diff against PRD R10 / R11 / R19, TECH_SPEC §S10 (rev 5.1), and TEST_PLAN T46–T51 (rev S022.1). Critic transcript: agent `fcdfc85d-cc46-4a71-9e59-51db63105505`. **Verdict: Minor fixes** (no Blockers). Fourteen findings (3 Should-fix, 6 Nit, 4 Suspicion-flag, 1 routed-back).

### Decisions (post-critic)

- **D-208 (F1.1, Should-fix — closed):** `tests/s10/t50-integer-pence-invariant.test.ts:24` `customerId: "morgan"` → `"morgan-drew"` to match the canonical persona id in `lib/personas.ts:100` and the persona table in TEST_PLAN §2.1. One-character behavioural-no-op fix; restores fixture-identity parity.
- **D-209 (F1.2, Should-fix — closed):** T49 negative case tightened from `expect(formatted).toContain("500.00")` to `expect(formatted.slice(1)).toBe("£500.00")` so the money-string body is locked while only the leading minus glyph stays ICU-drift-tolerant via `expect(formatted).toMatch(/^[−-]/)`. Honors the test-plan's explicit "regex absorbs ICU-version drift on the minus glyph" carve-out without leaving the body half permissive.
- **D-210 (F1.5, Should-fix — closed):** T50 second `it` rewrites the second-snapshot IE assignment from "always `ieBreakevenExact`" to "next persona's IE in `personaCases` (cyclic rotation)" so every row exercises a non-zero delta — the previous shape produced `disposableDeltaPence === 0` for the `taylor` (self-comparison) and `riley` (both states zero-disposable) rows. Added `expect(delta.kind).toBe("change")` to lock the `kind === "change"` precondition T50 implicitly relies on. Closes the trivial-pass loophole the critic flagged (was 6/8 rows non-zero, now 8/8).
- **D-211 (F1.4, Nit — closed):** Added a fifth `it()` to T49 — `formattedJordanDisposable` cross-check — that creates a Jordan snapshot via `createSnapshot` + `getLatestSnapshot`, threads `snapshot.currency` / `snapshot.countryCode` through `formatMoney(snapshot.outcome.disposableIncomePence, snapshot.currency, snapshot.countryCode)`, and asserts the result matches `/^[−-]?£[0-9,]+\.[0-9]{2}$/`. Honors TEST_PLAN T49's `Fixtures: formattedJordanDisposable (cross-check sanity)` field. T49 now ships 5 `it`s instead of 4; total S10 test count moves from 17 → 18.
- **D-212 (F1.7, Nit — closed):** Plan §1 line for T50 in this snapshot rewritten — was `"across allIeFixtures + ieBreakevenExact"` (which double-counts since `allIeFixtures` already contains `ieBreakevenExact`), now lists the eight distinct fixtures verbatim and notes the second-`it` rotation explicitly.
- **D-213 (F1.8, Nit — closed; partially routed back):** Deviations table extended to record two pre-existing in-tree exceptions to the TECH_SPEC §S10 line 476 source-discipline rule "no `*Pence / 100` outside `formatMoney`" — `formatPounds` (calculator `reasons[]`) and `<UpdateForm />#formatPenceForInput` (form prefill). The runtime invariant T50 protects is preserved either way (TEST_PLAN D-196 deliberately dropped the static-source `/100` scan). Clarifying the carve-out is a `/tech-spec` task, not an `/implement` task — workflow rule 2 forbids editing the spec from an `/implement` round. Routed back; not patched.
- **D-214 (F1.6, Nit — closed via Deviations note):** TEST_PLAN §2.3 names three stretch fixtures (`snapshotJordanStoredGbp`, `snapshotPatStoredGbp`, `formattedJordanDisposable`) that this slice materialises inline rather than exporting as factories from `tests/_fixtures/snapshots.ts`. §2.3 inventories shapes, not exports, so the inline materialisation is permitted. Recorded in Deviations table; the factor-out becomes worthwhile in `/implement S11` when T56 / T57 / T59 / T60 / T64 / T67 consume the same names per the §2.3 `Used-by` column.
- **D-215 (F1.12, Nit — closed):** PROMPT_HISTORY S023 row's build claim corrected — `"npm run build clean (8 dynamic routes)"` was a build-output mix-up between "Generating static pages using 9 workers (8/8)" (page-generation count) and the route table (6 server-rendered routes). The S019 close-out row also called this 6; no new routes shipped in S10. Updated to "6 server-rendered routes".
- **D-216 (F1.3, Should-fix — routed back to `/test-plan`, not patched):** TEST_PLAN T48 has an internal inconsistency between its GWT (`"two explicit createSnapshot calls for jordan"`) and its Fixtures field (`snapshotJordanStoredGbp`, `snapshotPatStoredGbp` ⇒ one `jordan` + one `pat`). The implementation chose the GWT half (`jordan` × 2). Picking a side belongs to `/test-plan`, not to `/implement S10` — workflow rule 2 again. Inconsistency surfaced; not patched.

### Findings consciously not raised by me, raised by the critic, and consciously deferred

- **F1.9 (Nit):** drizzle-kit migration SQL keyword order differs from the TECH_SPEC §S10 example (`ADD currency text DEFAULT 'GBP' NOT NULL` vs the spec's `ADD COLUMN currency TEXT NOT NULL DEFAULT 'GBP'`). Behaviour-identical (T46 confirms via `PRAGMA table_info` introspection); spec example was illustrative. **Not patched.**
- **F1.13 (Suspicion):** `Currency` / `CountryCode` exported as named types (D-204) — the spec used inline literals. Defensible call (cleans up `CreateSnapshotInput.currency?: Currency` signature; widening to `string` is still a one-line change per §5 trade-off "S10 currency type narrowing"). **Not changed.**

### Suspicion-flagged items (carried forward, not closed in this round)

- **F1.10:** drizzle-kit emits meta JSON without trailing newlines; Biome's formatter requires them. `npx drizzle-kit generate` will retrigger this drift on every future migration (`/implement S11` and `/implement S12` each generate a new one). Resolution options: (a) add `drizzle/meta/**` to a Biome ignore list (route through `/tech-spec` if the convention should change), (b) accept `biome format --write drizzle/meta/*.json` as a documented post-`drizzle-kit generate` step, (c) raise upstream with drizzle-kit. Carried forward to `/implement S11`'s drizzle round.
- **F1.11:** Node / ICU drift for `Intl.NumberFormat('en-GB', { style: 'currency' })`. Currently regex-tolerated on the leading minus glyph; if a future Node version changes the rest of the format shape (non-breaking spaces, symbol position, etc.), even the tightened D-209 assertion may need a second carve-out. Re-verify when CI's Node version moves.

## Status

**Closed (post-critic).** S10 shipped with the same-session critic close-out applied (D-208 → D-216). 18/18 S10 tests pass; **149/149 total** (was 131 + 18 new S10 = 149). Lint / typecheck / build all clean. Two findings routed back rather than patched (F1.3 to `/test-plan`, F1.8 to `/tech-spec`); two findings (F1.9, F1.13) consciously left unchanged.

## Handoff

Next slice per tech-spec §3 stretch ordering (`S10 → S11 → S12`): **`/implement S11`** — secure time-limited statement sharing, T52–T67 + T76. S11 reuses S10's `formatMoney` for `<SharedStatementView />`'s money strings; the deferred UI surface refactor (Deviations, above) can land alongside S11 because S11 introduces a new outcome surface that needs `formatMoney(pence, snapshot.currency, snapshot.countryCode)` from day one — single change, single review.

Prompt for next session:

> S024 `/implement S11` — secure time-limited statement sharing per tech-spec §S11 (rev 5.1). Deliver `lib/share/{token,clock,resolve}.ts`, `lib/db/share-links.ts`, `lib/db/snapshots.ts#getSnapshotById`, `lib/personas.ts#getPersonaById`, the `share_links` Drizzle migration + index, the Server Action at `src/app/actions.ts#createShareLinkAction` (or per tech-spec placement), `<ShareSnapshotForm />`, the `app/(share)/share/[token]/page.tsx` route group + minimal `layout.tsx` + `<SharedStatementView />` + `<ShareUnavailable />`, `app/(share)/share/[token]/generateMetadata`, and the project-root `middleware.ts` matcher on `/share/*` returning `Cache-Control: no-store, private` + `X-Robots-Tag: noindex, nofollow`. Tests T52–T67 + T76 ship alongside the code. While there, swap `<DashboardView />` / `<HistoryList />` / `<UpdateForm />` from `formatPounds` to `formatMoney(pence, snapshot.currency, snapshot.countryCode)` (deferred from S023 / S10).

## Handoff

Next slice per tech-spec §3 stretch ordering: **`/implement S11`** (secure time-limited statement sharing, T52–T67 + T76).
