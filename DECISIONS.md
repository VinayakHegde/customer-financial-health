# DECISIONS

A 10–15 minute read for the reviewer. The full audit trail (per-session snapshots, decisions D-1 onwards, critic findings) lives under [`docs/ai/sessions/`](./docs/ai/sessions/) and [`docs/PROMPT_HISTORY.md`](./docs/PROMPT_HISTORY.md). The final scoping artefacts are [`docs/PRD.md`](./docs/PRD.md), [`docs/TECH_SPEC.md`](./docs/TECH_SPEC.md), and [`docs/TEST_PLAN.md`](./docs/TEST_PLAN.md).

---

## What was built

The MVP customer-facing affordability surface, as specified in `docs/TECH_SPEC.md`. Slices delivered:

| Slice | Scope | Test cases (T*) | Owning session |
|---|---|---|---|
| **S7-setup** | Vitest harness, jsdom, `vitest-axe`, shared helpers (`makeDb`, `withPersonaCookie`, `formData`, `forbiddenToneTokens`) | T30, T31 | [S009](./docs/ai/sessions/S009-implement-s7-setup.md) |
| **S1** | Pure affordability domain — `assess()`, validation (zod), copy, framing, persona fixtures | T1–T8, T29 | [S010](./docs/ai/sessions/S010-implement-s1.md) |
| **S2** | SQLite + Drizzle persistence — schema, migration, seed, repository | T9–T12 | [S011](./docs/ai/sessions/S011-implement-s2.md) |
| **S3** | Persona cookie helper + seed-on-first-open | T13, T14 | [S012](./docs/ai/sessions/S012-implement-s3.md) |
| **S9** | `<FramingNotice />` (R20 reflection-not-advice) | T32, T43 | [S013](./docs/ai/sessions/S013-implement-s9.md) |
| **S4** | `<DashboardView />`, `<SupportSignpost />`, dashboard page, `computeDelta` | T21–T23, T33, T34, T22, T28 (dashboard half), T44, T45 | [S014](./docs/ai/sessions/S014-implement-s4.md) |
| **S4 fixes** | `.data/` mkdir; persona picker on `/`; `/support` page; no-snapshot delta; integer near-breakeven; T12 spy aggregation; invalid persona cookie redirect | — | [S015](./docs/ai/sessions/S015-fixes.md) |
| **S5** | `<UpdateForm />`, update page, `updateSnapshotAction`, pounds→pence parse | T18–T20, T24, T25, T35, T36, T37, T38 | [S016](./docs/ai/sessions/S016-implement-s5.md) |
| **S6** | `<HistoryList />`, history page | T26, T27, T28 (history half), T39 | [S017](./docs/ai/sessions/S017-implement-s6.md) |
| **S8** | `README.md`, `DECISIONS.md`, prompt-history backfill | T40, T41, T42 (manual checklists) | [S018](./docs/ai/sessions/S018-implement-s8.md) (this session) |

**Test totals at S018 close:** 131 automated tests across 48 files (Vitest + `@testing-library/react` + jsdom + `vitest-axe`). Plus T40 / T41 / T42 as **manual checklists** that S8 satisfies by shipping these very documents and the prompt-history chain.

**Requirement coverage** (full matrix in `docs/TEST_PLAN.md` §5):

- All **Must** requirements covered: R1, R2, R3, R4 (Core); R14, R15, R16, R17 (Submission).
- All in-scope **Should** covered: R5, R6, R7, R8, R9, R10, R18, R20.
- **Should** with intentional gap: R19 (only kicks in if any R11 / R12 / R13 ships — none did).

---

## What was left out

The MVP boundary held. Nothing was added beyond what the PRD authorised. The following are deliberately not delivered:

### Stretch requirements (PRD priority `Could`)

- **R11 — currency + country_code with migrations.** Not delivered. The hard-coded `Intl.NumberFormat('en-GB', { currency: 'GBP' })` boundary is small enough that adding a `currency` / `country_code` column on `snapshots` and threading it through the formatter is a self-contained future slice. Sketch in `docs/TECH_SPEC.md` §6.
- **R12 — secure time-limited statement-share link.** Not delivered. Needs a written threat model first (link scope, expiry, single-use, revocation, rate limit) before any code is appropriate. Recorded in `docs/TECH_SPEC.md` §5 trade-off "Stretch security model for R12".
- **R13 — PDF export.** Not delivered. Self-contained, but a separate feature — no half-built version felt worth shipping.

If any of these had been attempted, **R19** would have required automated tests to the same R4 standard. Since none was attempted, R19 stays a conditional gap (see `docs/TEST_PLAN.md` §5).

### Tech-spec items deferred inside MVP (recorded but not coded)

- **Async `page.tsx` integration tests.** Vitest cannot render async Server Components (per Next.js 16's testing guide); pages are I/O glue exercised by manual reviewer walkthrough. Adding Playwright would have closed this but was rejected as over-engineering for a take-home (`docs/TECH_SPEC.md` §4 / §6).
- **`useActionState` end-to-end form-action runtime.** `<UpdateForm />` uses React's `useActionState`; T24 / T25 inject the error payload as props rather than driving the React runtime. Acknowledged trade-off (`docs/TECH_SPEC.md` §5 "useActionState round-trip not unit-tested").
- **`revalidatePath` real effect.** Mocked in T18; an action-succeeds-but-revalidate-missing regression would not be caught (`docs/TECH_SPEC.md` §4).
- **400 % zoom / 320 CSS-px reflow (WCAG SC 1.4.10).** Verified by manual visual check in the reviewer walkthrough; not by `vitest-axe` (`docs/TEST_PLAN.md` §6).
- **File-based SQLite survives process restart (R3).** In-memory `makeDb()` proves repository semantics; on-disk persistence verified manually (`docs/TEST_PLAN.md` §6).

### Excluded by PRD non-goals

These were explicit before any code was written and stayed out by construction:

- **N1** — Real authentication, Open Banking, credit-bureau integration.
- **N2 / N3 / N4** — Repayment-plan selection, arrangement booking, collections workflow, agent-facing UI, `POST /api/arrangements`. Dropped at discovery (`docs/discovery/NOTES.md` §7(b)) and re-confirmed by [S003 / D-13 / D-14](./docs/ai/sessions/S003-discovery.md).
- **N5** — Automated vulnerability classification. The product never infers vulnerability from numbers; the only path to support is the explicit signpost (R7).
- **N6** — Email / SMS / CRM / payments. No transactional surface.
- **N7** — Multi-language UI (e.g. Welsh).
- **N8** — Independent verification of FCA / GDPR paraphrases. Inherited from `docs/discovery/NOTES.md` §3 with the "not independently verified" label intact.

### Process artefact

- **`docs/TASK_ANALYSIS.md`** — a pre-brief analysis written in [S001](./docs/ai/sessions/S001-task-analysis.md). **Withdrawn** in [S003 D-14](./docs/ai/sessions/S003-discovery.md): it scoped a collections / arrangement-journey workflow the brief does not ask for. Useful substance was inlined into `docs/discovery/NOTES.md`; the snapshot is preserved for prompt-history transparency. The PRD does not cite it.

---

## What is next

Ordered by my best read of reviewer-perceived value, not by effort.

1. **Playwright slice for the async page boundary.** Closes the largest acknowledged gap: form submit → action → redirect → `revalidatePath` → re-render. Would also let SC 1.4.10 reflow be automated. Adds a runtime, but only one — and only after MVP review.
2. **R11 currency / country_code migration.** A surgical `ALTER TABLE` + formatter swap; the column nullability story (back-fill default `'GBP'` / `'GB'`) is the only design beat. Pairs naturally with R19's "Stretch tested to R4 standard".
3. **R12 statement-share link** — only after a written threat model lands as a new tech-spec slice (link scope, expiry, single-use, revocation, rate limit). Brings a real HTTP surface in scope, which means MSW becomes a candidate (currently rejected per `docs/TECH_SPEC.md` §5 "No MSW").
4. **Per-line delta for R2.** Today the delta is a single disposable-£ figure plus a band-change indicator. Per-line deltas need a stable line-identity story (line ids, edits to existing lines vs new lines) — A5 explicitly defers this. Worth doing once a real customer touches the product.
5. **Carry the framing-copy guard further.** The R20 `forbiddenToneTokens` / advice-implying token list is short. A bigger lexicon (or even a small LLM-as-a-linter pass over copy) would catch drift sooner. Out of scope for MVP per `docs/TECH_SPEC.md` §5.
6. **Lower-risk follow-ups not worth listing individually** — small a11y polish (e.g. surfacing `irregularIncomeNote` in `<HistoryList />` rows, not just the dashboard); a tone-token-list expansion for R20; a cleaner separation between the two "framing" surfaces (`<FramingNotice />` for R20 vs `<SupportSignpost />` for R7) so future copy changes don't drift between them.

---

## Why those choices were made

The single throughline behind all of these calls was **the take-home brief's "don't over-engineer" framing** (brief lines 99–113) plus the project's strict five-phase workflow (`CLAUDE.md`, `.cursor/rules/00-workflow.mdc`).

Concretely:

- **Single-page-at-a-time scope.** Each `/implement S<n>` session shipped exactly one tech-spec slice plus its tests. No drive-by refactors, no opportunistic dependency bumps. When a gap was found mid-implementation, it was routed back to `/tech-spec` (or `/prd` if upstream) rather than patched inline. The clearest example is the **R20 framing requirement**: the original tech-spec draft inlined a "not financial advice" footer in S4 under R6 + R9; the round-1 critic flagged it as a workflow-rule-2 gate-cross; PRD was revised append-only to add R20, and `S9` was created as the owning slice (`docs/ai/sessions/S007-tech-spec.md`, decisions D-34 → D-42).
- **Page-vs-component split.** Vitest cannot render async Server Components and Next.js 16 made `cookies()` / `headers()` async. Rather than introduce Playwright for the take-home, every route became a thin async `page.tsx` + sync `<View />`. The View component is the unit-test surface; the page is exercised by manual walkthrough. Trade-off recorded explicitly (`docs/TECH_SPEC.md` §4 / §5 "Page-vs-Component split").
- **Free-text `note` field removed.** An earlier S1 draft carried an optional 280-char `note` on `IncomeAndExpenditure`. Nothing in the PRD justified it, and the critic flagged it as a PII risk vector. Removed entirely — narrowed the data-minimisation surface (R10) and removed a category of bug (`docs/TECH_SPEC.md` §5 "Free-text note removed").
- **Persistence: file-based SQLite.** Discovery (`NOTES.md` §6 OQ-5) committed to "lightweight ORM"; tech-spec picked Drizzle + better-sqlite3. Postgres was rejected as needing a running service for a single-reviewer demo; in-memory was rejected because R3 (return-later viewing) requires durability across processes.
- **Mock auth via cookie.** Real auth was N1 from the PRD onward. The cookie carries only a persona id; there is no token threat model to design.
- **WCAG 2.2 AA, not AAA.** R18 left the conformance level open; tech-spec pinned 2.2 AA as the published current standard. AAA would have required, e.g., 7:1 contrast on body text — not justifiable for a take-home (`docs/TECH_SPEC.md` §5 "WCAG conformance level").
- **Two `@critic` rounds on the tech spec, one on the test plan, one on S6.** Each surfaced gate-cross or under-asserted findings that would otherwise have rotted into shipped code. The full critic findings are in `docs/ai/sessions/S007-tech-spec.md`, `S008-test-plan.md`, and `S017-implement-s6.md` — they're the most useful audit trail of "what got rejected and why".
- **Append-only IDs.** R*, S*, T* were never re-numbered. T15–T17 are reserved gaps from an early test-plan numbering pass; they are documented as such (`docs/TEST_PLAN.md` §1).

The richest single source on *why* a particular call was made is the relevant per-session snapshot. The `decisions` block of each `SNNN-*.md` lists every D-* decision, what was rejected, and what trade-off was accepted.

---

## Time spent (R17)

Approximate hours per phase, rounded. "Sessions" lists the curated `SNNN-*.md` snapshots that contributed; not all of them are coding work — phases 1–4 are documentation-only.

| Phase | Sessions | Approx hours |
|---|---|---|
| 0. Scaffolding & guardrails | S000, S002, S006 | ~2 |
| 1. Discovery | S001 (withdrawn), S003 | ~3 |
| 2. PRD | S004, S005 (critic round) | ~3 |
| 3. Tech spec | S007 (3 revisions, 2 critic rounds) | ~4 |
| 4. Test plan | S008 (+ critic) | ~2 |
| 5. Implementation | S009 (S7-setup) → S017 (S6) inc. S015 fixes | ~8 |
| 5. Submission deliverables | S018 (this slice) | ~1 |
| **Total** | 18 sessions | **~23 hours** |

These are walltime estimates; AI-assisted sessions are often shorter than equivalent hand-coded work, but the count includes reading the tech-spec, writing tests first, running each critic round, and applying the resulting follow-ups.
