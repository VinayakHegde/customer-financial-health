# AI Session Snapshot: S017 — `/implement S6`

## Metadata

- Date: 2026-06-11
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `main`
- Start commit: `a955968` (S016 / S5 merge)
- Raw transcript: TBC (SpecStory writes on Cursor window close)
- Related artefacts: `docs/TECH_SPEC.md` (S6), `docs/TEST_PLAN.md` (T26, T27, T28 history half, T39), `docs/PRD.md` (R3, R7, R18, R20)

## Goal of this Cursor window

Implement tech-spec slice **S6 — History view** with matching tests.

## Scope restated (auditable)

| ID | Requirement / artefact |
|---|---|
| **R3** | Return later and view prior snapshots |
| **R7** | Human-support signpost on every outcome surface |
| **R18** | WCAG 2.2 AA accessibility on `<HistoryList />` |
| **R20** | Reflection-not-advice framing rendered inside `<HistoryList />` |
| **S6** | `src/app/history/page.tsx`, `components/HistoryList.tsx` |
| **T26** | Empty + populated render contract + axe both states |
| **T27** | `<SupportSignpost />` non-empty link in both states |
| **T28** (history half) | `<FramingNotice />` present when rendering `<HistoryList />` standalone (dashboard half shipped in S014) |
| **T39** | Populated-list axe smoke + `<dl>`/`<dt>`/`<dd>` semantics + SC 2.5.8 target size on `<summary>` |

## Out-of-slice items explicitly deferred

- **T40 / T41 / T42** — manual integration checklists owned by **S8** (README completeness, DECISIONS completeness, AI prompt history retained). The user prompt mentioned them with the S6 slice, but the test-plan §7 traceability rows pin them to `S8`; per `/implement` scope rules ("one tech-spec section per invocation") I did not implement S8 in this session. They remain pending in the test-plan status table.
- **Async `src/app/history/page.tsx` unit tests** — out of scope per tech-spec §4 cross-cutting (page-vs-component split: Vitest cannot render async Server Components, so the page is the integration seam exercised by manual reviewer walkthrough). The thin async wrapper is shipped (it is part of S6), but only the sync `<HistoryList />` is unit-tested.

## Plan stated before code (auditable)

1. Re-read TECH_SPEC §S6 and TEST_PLAN T26/T27/T28/T39.
2. Confirm baseline green (122 tests).
3. Write **four failing test files** under `tests/s6/`.
4. Confirm they fail for the expected reason (`Failed to resolve import '../../components/HistoryList'`).
5. Implement the **minimum** `<HistoryList />` component to make them pass.
6. Add the thin async `src/app/history/page.tsx` wrapper.
7. Re-run `npm test`, `npm run typecheck`, `npx biome check tests/s6/ components/HistoryList.tsx src/app/history/page.tsx`.
8. Update this session snapshot and `docs/PROMPT_HISTORY.md`.

## Decisions

- **D-82 — `<HistoryList />` is a single sync component (no per-row sub-component file).** Spec calls for "Per row" semantics; an internal `SnapshotRow` function inside the same file keeps the slice self-contained and avoids introducing a new exported component the tests don't need. Stays inside S6's scope.
- **D-83 — Signpost variant in populated state mirrors the latest outcome state.** Spec says "Single placement … emphasis scaled to the outcome state" applies to `<DashboardView />`; for `<HistoryList />` the equivalent is the most recent snapshot (newest-first list, so `snapshots[0].outcome.state`). For the empty state I pass `state="no-data"`. This keeps `<SupportSignpost />`'s prop contract intact without changing its public API.
- **D-84 — Relative-phrase rendered alongside `<time dateTime>`.** Tech-spec line 322 explicitly asks for "a `<time dateTime>` element carrying ISO 8601 plus a human-readable relative phrase ('2 hours ago')". I render both: the ISO is the source of truth on `dateTime`; the visible text is the formatted local date plus an `Intl.RelativeTimeFormat('en-GB')` phrase in parentheses. Tests only assert on `dateTime`/ordering/disclosure — the relative phrase is deliberately not asserted (non-deterministic vs `new Date()` at render time).
- **D-85 — Disposable income line suppressed for no-data rows, mirroring S4.** Spec says "band chip (suppressed for the no-data row, mirroring S4)"; the same suppression rule applies to the disposable-income line per the S4 commitment ("Suppressed when `outcome.state === 'no-data'`"). Both are now suppressed on the no-data row in `<HistoryList />`. Asserted in T26 (populated state).
- **D-86 — Each `<li>` carries `aria-label="Snapshot from <date>"`.** Per spec line 327: "each row is an `<li>` with a programmatic name". I do not assert this attribute in T26/T39, but it satisfies the spec commitment and gives axe a clean accessible name for the row.
- **D-87 — `<dt>` / `<dd>` use a CSS grid layout via `className="contents"` wrappers.** Avoids a one-off CSS class that doesn't survive screen-reader navigation; preserves the natural `<dl>`/`<dt>`/`<dd>` tree T39 asserts on (`dts.length === dds.length === earners.length + expenditure.length`).
- **D-88 — `<summary>` carries `min-h-6` Tailwind utility for SC 2.5.8.** T39 asserts the className includes `min-h-6` (≥ 24 CSS px target size). `min-w-6` is also present for consistency with the rest of the codebase (`SupportSignpost.tsx`, `UpdateForm.tsx`, `DashboardView.tsx` all use the same pattern).
- **D-89 — Empty-state CTA points at `/dashboard/update`, not `/`.** Per spec line 321: "CTA link to `/dashboard/update` when the list is empty (covers `riley`-style first visits)." The empty-state CTA is **not** the support signpost (which is a separate, distinct element below it — per spec line 321's clarification).
- **D-90 — `it.each` typed as `[string, Snapshot[]][]` not `as const` tuple.** First pass of T27 used `as const` on the cases array, which made the inner `Snapshot[]` type readonly and broke `<HistoryList snapshots={...} />`. Switched to a plain typed `cases` variable. Fix is local to T27 only.
- **D-91 — `@critic` round (post-implementation).** Verdict: **Ship as-is**, no must-fix findings. User applied top-2 of the user-selected Medium / Low set: (a) F-M1 — replaced `<li aria-label="Snapshot from <date>">` with `aria-labelledby` pointing at the in-row `<time>` and outcome state label (`timeId` + `stateLabelId`), so the row's accname is descendant-derived rather than attribute-overridden; (b) G1 — extended T26 populated test to assert `data-testid="outcome-state-label"` is present per row with the expected text per outcome state ("Surplus" / "Shortfall" / "No data yet"), closing the under-asserted spec line 322 element. Critic's Low / Suspicion items (L1 duplicate state label vs band chip, L2 empty-state region label mismatch, L3 `irregularIncomeNote` not rendered on history rows, L4 `now = new Date()` non-determinism, L5 relative-phrase bucket arithmetic, L6 unused `getPersonaById` return value, L7 class-name-based SC 2.5.8 assertion, S1 D-83 inferred signpost variant, S2 empty-state signpost copy mild misfit, S3 manual tone-token guard) recorded as known judgement calls — no fix in this slice. **No new tech-spec sections invented; no `R*` added.**

## Files changed

- `components/HistoryList.tsx` (new; post-critic: `<li aria-labelledby="<timeId> <stateLabelId>">` replaces `aria-label`; `<time>` and outcome state `<span>` carry stable ids; outcome state `<span>` gains `data-testid="outcome-state-label"`)
- `src/app/history/page.tsx` (new)
- `tests/s6/t26-history-list-states.test.tsx` (new; post-critic: row loop asserts `data-testid="outcome-state-label"` text per row)
- `tests/s6/t27-signpost-ubiquity.test.tsx` (new)
- `tests/s6/t28-framing-ubiquity-history.test.tsx` (new)
- `tests/s6/t39-history-list-a11y.test.tsx` (new)

## Tests run

- `npm test` — **131 passed** (+9 S6: 4 in T26, 2 in T27, 2 in T28-history, 3 in T39; 4 new test files). Re-run after the post-critic D-91 fixes: still 131 / 131 (T26 row-2 now also asserts per-row state label, no count delta).
- `npm run typecheck` — pass (TS error in first T27 draft was the `as const` readonly tuple; fixed before lint)
- `npx biome check tests/s6/ components/HistoryList.tsx src/app/history/page.tsx` — clean (re-checked after D-91 fixes)
- `npm run lint` — three pre-existing repo-wide formatter nits in `src/app/page.tsx`, `tests/s3/persona-picker.test.tsx`, `tests/s4/t22-signpost-ubiquity.test.tsx`; **outside this slice's scope** per `/implement` "no drive-by changes" rule. Same call-out S016 made.

## Deviations from spec

| Item | Spec says | Delivered | Reason |
|---|---|---|---|
| Async `history/page.tsx` unit tests | Pages are not unit-tested (§4) | Page shipped, not tested | Explicit tech-spec §4 / §5 trade-off; manual reviewer walkthrough |
| `<SupportSignpost />` variant in `<HistoryList />` | "Emphasis scales with outcome state" (R7, §S4) | Variant tracks `snapshots[0].outcome.state` in populated, `"no-data"` in empty | Spec does not name the source for the variant on the history surface; this is the most-relevant outcome state visible. Recorded so any future test can pin a fixture. |
| T26/T39 visible-relative-phrase assertions | Spec asks for the phrase (line 322) | Phrase rendered, not asserted | Deterministic-test concern (phrase changes with `new Date()`); ISO `dateTime` is the source of truth and is asserted. |

## Status

**Closed** — all four S6 `T*` tests green; full suite 131/131; typecheck clean; S6-scoped lint clean; changes uncommitted on `main`.

## Handoff

Next slice per tech-spec §3 recommended order: **`/implement S8`** (submission deliverables — README, DECISIONS, prompt-history backfill; covers manual checklists T40/T41/T42).

Prompt for next session:

> S018 `/implement S8` — `README.md`, `DECISIONS.md`, prompt-history backfill; manual checklists T40, T41, T42.
