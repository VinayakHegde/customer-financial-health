# AI Session Snapshot: S007 — Tech spec generation, critic rounds 1 & 2, and append-only PRD R20

## Metadata

- Date: 2026-06-10
- Tool: Cursor
- Model: Claude Opus 4.7 (agent) + critic subagent (inherit model)
- Branch: `main`
- Start commit: `05cbb37e31bd30dbe928377705ee6f8f08170a0f` (S006 merge into main; tip of `main` at session start)
- End commit: (in progress — uncommitted at session close)
- Raw transcript: `.specstory/history/2026-06-10_19-45-50Z-tech-spec.md`
- Related artefacts: produces `docs/TECH_SPEC.md` (phase 3 of 5); modifies `docs/PRD.md` (append-only — R20)

## Goal of this Cursor window

1. Run the `/tech-spec` slash-command (phase 3 of 5 per `.cursor/rules/00-workflow.mdc`) to translate `docs/PRD.md` (R1–R19 at session start) into `docs/TECH_SPEC.md` per the structure in `.rulesync/commands/tech-spec.md` and the schema in `.claude/skills/phase-gate/SKILL.md`.
2. Run the `@critic` subagent against each tech-spec revision to surface gate failures, scope creep, traceability gaps, and conduct / vulnerability / FCA blind spots.
3. Route any genuinely new product scope back to `/prd` (workflow rule 2) rather than inventing it in the tech-spec.
4. Honour the persona's "smallest design that satisfies PRD; no enterprise abstractions; no speculative service layers; each `S*` fits one `/implement` session including its tests".

## Context given to AI

- `docs/PRD.md` (R1–R19 at session start; R20 added during the session — see D-36 / D-37).
- `docs/discovery/NOTES.md` (especially §6 OQ-5 SQLite direction; §6 OQ-6 persona schema; §6 A-2 mock-auth assumption).
- `docs/Ophelos Engineering Take-Home Task.pdf` (binding upstream source).
- `AGENTS.md` — "This is NOT the Next.js you know" rule; consult `node_modules/next/dist/docs/01-app/` before any Next.js claim.
- `node_modules/next/dist/docs/01-app/` — App Router conventions, Server Functions (`07-mutating-data.md`), Vitest guide (`02-guides/testing/vitest.md`, which explicitly warns Vitest does not support async Server Components).
- `.rulesync/commands/tech-spec.md` — `/tech-spec` pre-checks, output structure, persona, rules.
- `.rulesync/subagents/critic.md` — critic role definition.
- `.claude/skills/phase-gate/SKILL.md` — header schema + PRD → tech spec traceability table format.
- `.cursor/rules/00-workflow.mdc`, `.cursor/rules/10-evidence.mdc` — phase gates + anti-fabrication + append-only IDs.
- S005 handoff (`docs/ai/sessions/S005-prd-critic-and-followups.md`) — list of deferred critic findings that S007 was expected to absorb (F3.2 zero-income split, F5.1 band thresholds, F5.2 delta shape, F5.3 R3 retrieval depth/order, F5.4 joint-income schema, F7.1 I&E input surface, F4.3 "not financial advice" framing, R18 conformance level, R12 security model).

## Main prompts used

1. **`/tech-spec`** (initial invocation) — generate `docs/TECH_SPEC.md` from `docs/PRD.md` (R1–R19), absorbing the S005 deferred findings, and respecting `/tech-spec` rules.
2. **`@critic` round 1** against `docs/TECH_SPEC.md` rev 1, explicit focus areas:
   - drift from PRD; drift from chosen stack; over-engineering; missing API testability; MSW behavioural-test suitability; data handling; accessibility; whether `S*` slices are implementable one at a time.
3. **Route-back decision after round 1** — user chose "route-prd-first" path: add R20 to PRD; drop free-text `note` field from tech-spec (no PRD edit needed).
4. **PRD R20 wording question** — user picked the **tight** "Should / Regulatory" wording over the broader "debt-counselling-adjacent" variant, and over the Must-class variant.
5. **`/tech-spec`** (re-invocation against R1–R20) — produce revision 2, refining in place and preserving S1–S9 IDs; address all round-1 findings.
6. **`@critic` round 2** against revision 2 — verified the seven round-1 fixes landed; surfaced 28 new findings F1.1–F9.3.
7. **Scope question after round 2** — user chose **drop** for F2.1/F2.2/F3.1 (narrow S9 to literal R20 wording) and **all** for revision-3 scope (address every finding, not just the top-3).
8. **`@critic` resume** — asked for the full F1.1–F9.3 list (round-2 summary had shown only the top-3).
9. **Manual S1/S2 consistency review** — user spotted that S1 now allows `band: Band | null` but S2's schema declared `band TEXT NOT NULL`. Asked for the minimum schema change to persist the no-data outcome, with strict guardrails (no architecture / no slice structure / no testing strategy / no PRD traceability changes).

## Decisions made in this session

- **D-34 — tech-spec revision 1 (initial draft, 8 slices).** Chose: Next.js 16 App Router (confirms `NOTES.md` §6 A-1); SQLite + Drizzle ORM + `better-sqlite3` driver, `.data/financial-health.sqlite` gitignored (resolves `NOTES.md` §6 OQ-5); mock-auth via persona-id cookie (`NOTES.md` §6 A-2); 7 personas with pinned £-values (resolves S005 deferred F5.4); zero-income outcome split from generic shortfall (resolves S005 deferred F3.2); WCAG 2.2 AA (resolves S005 deferred R18 conformance level); Vitest + Testing Library + axe-core for tests; no MSW; no Playwright in MVP. Slices S1–S8: Affordability domain (pure), Persistence, Persona fixtures, Dashboard, Update flow, History, Tests, Submission deliverables.
- **D-35 — `@critic` round-1 verdict: Minor fixes.** Top-3 findings: **F2.1** async Server Components vs Vitest (the cited testing doc forbids it); **F4.3** "not financial advice" footer adopted in-spec under R6+R9 instead of routed to `/prd` (workflow rule 2 gate-cross); **F7.1 / F6.1 / F7.3** R18 a11y commitments uneven across slices + 280-char free-text `note` PII risk.
- **D-36 — route-back-to-PRD for F4.3 only.** F4.3 is genuinely new behavioural scope; F7.1's `note` field was over-engineering (PRD never asked for it, so deletion fixes it without a new R). PRD revised append-only: **R20** added — Should / Regulatory, *tight* wording: "On every outcome screen, the product is clearly framed as a reflection of the customer's own numbers and not as financial advice." `Why` cites brief lines 17–19 + 69–70 and `NOTES.md` §1 / §5 (Consumer Duty paraphrase). §9 traceability row added; R1–R19 untouched. R20 reuses §3's existing FCA stance — no new regulatory citations introduced (honours `NOTES.md` §6 OQ-7 + N8).
- **D-37 — tech-spec revision 2 (R1–R20, 9 slices).** All round-1 findings addressed in-spec. New **S9** owns the R20 framing commitment (`<FramingNotice />` + `lib/affordability/framing.ts`). Page-vs-Component split introduced for S4/S5/S6 so Vitest can test the render layer without async-Server-Component support. Free-text `note` deleted from S1 type, S5 form, S7 matrix. WCAG 2.2 AA pinned with concrete per-slice commitments (S4 has full set; S5/S6 weaker — flagged in round 2). `Band | null` typing introduced for the no-data outcome to preserve PRD R1's three-value band schema. S7 restructured: framework setup + coverage-matrix contract; per-slice tests ship with each `/implement S<n>`. New §5 trade-offs: "F4.3 routed to /prd (R20)", "Free-text note removed", "Page-vs-Component split", "No MSW", "no-data band is null".
- **D-38 — `@critic` round-2 verdict: Minor fixes (again).** All seven round-1 fixes landed substantively. Round-2 surfaced **28** new findings F1.1–F9.3 (4 High, 9 Medium, 11 Low, 4 suspicion-flagged). Top-3: **F5.1** slice-ordering bug (S4/S5/S6 render `<FramingNotice />` owned by S9 which was last in the order — first `/implement S4` couldn't honour the spec); **F2.1 / F1.1 / F2.2** S9 placement extended beyond R20's literal "every outcome screen" (persona-picker landing page + update-form host page + abbreviated single-sentence variant) — same gate-cross pattern as round-1 F4.3; **F4.1 / F4.2 / F4.3** WCAG 2.2-specific SCs implicit (SC 3.3.7 Redundant Entry, SC 2.5.8 Target Size 24×24, SC 2.4.11 Focus Not Obscured) — exactly the SCs that distinguish 2.2 from 2.1. Plus a `<HistoryList />` R7 mis-credit (F3.1) and the framing-ubiquity test asserting against async host pages (F6.2).
- **D-39 — revision-3 scope decision.** User chose: (a) **drop** the persona-picker and update-form-host placements rather than route back to `/prd` for an R21 — narrows S9 to R20's literal wording; (b) address **all 28** round-2 findings in revision 3 rather than only the top-3. Resumed the critic agent to surface the full F1.1–F9.3 list before fanning out.
- **D-40 — tech-spec revision 3 (R1–R20, 9 slices, all 28 round-2 findings closed).** Key resolutions:
  - **§3 intro rewritten:** `S*` IDs are stable labels (append-only), not the implementation sequence. Recommended implementation order = `S7-setup → S1 → S2 → S3 → S9 → S4 → S5 → S6 → S8` (closes F5.1, F5.2, F5.4).
  - **`<FramingNotice />` + `<SupportSignpost />` rendered inside View components** (not host pages) so the unit tests catch ubiquity by rendering the sync component alone (closes F1.4, F6.2, F3.1).
  - **S9 narrowed to literal R20:** dropped persona-picker placement, dropped update-form-host placement, dropped abbreviated single-sentence variant; gate-cross documented (closes F1.1, F2.1, F2.2).
  - **WCAG 2.2-specific SCs pinned:** SC 3.3.7 (S5 preserves user input on error re-render), SC 2.5.8 (§4 cross-cutting — 24 CSS-px targets), SC 2.4.11 (§4 cross-cutting — focus not obscured), SC 1.3.5 justification (`autocomplete="off"` reason), SC 3.3.4 (§5 trade-off — A5 reversibility satisfies it) (closes F4.1–F4.7).
  - **S7 helpers expanded:** `withPersonaCookie()` for Server Action cookie-mocking; `vi.mock('next/headers' / 'next/navigation' / 'next/cache')` strategy documented in §4 cross-cutting; forbidden-token list labeled "illustrative — /test-plan finalises" (closes F1.3, F2.3, F6.4).
  - **§7 traceability:** R7 row rewritten (S4 + S6 now both cite `<SupportSignpost />` rendered inside the View); R1 row notes A1 near-breakeven branch in S1; R9 row adds S9 (closes F3.4, F3.5).
  - **§5 trade-offs extended:** free-text-note-removed extended to acknowledge per-row `label` residual risk (closes F1.2); `useActionState` round-trip explicitly not unit-tested (closes F9.2); direct-call action testing skips RSC payload boundary acknowledged in §4 (closes F9.1); `revalidatePath` mock caveat acknowledged in §4 (closes F9.3).
  - **Matrix splits:** Logging hygiene → S2 row + S5 row (closes F5.3); First-snapshot delta → S4 render row + S5 shape row (closes F6.3); Tone token guard extended to S5 form copy (closes F3.2); R5(d) cites both S1 + S5 (closes F3.3); Signpost ubiquity extended to `<HistoryList />` (closes F6.1).
- **D-41 — S1 ↔ S2 consistency fix.** User spotted that S1's `band: Band | null` requires S2's `band TEXT NOT NULL` to relax. Minimum change applied: `band TEXT NOT NULL` → `band TEXT` with an inline comment. The no-data outcome's `outcome_state`, `disposable_pence`, `income_pence`, `expenditure_pence` all retain meaningful values (`'no-data'` / 0 / 0 / 0), so no other column constraint was relaxed.
- **D-42 — S2 ↔ S6 `listSnapshots` ordering reconciled.** While fixing D-41 I spotted a separate contradiction: S2's signature comment said "ordered oldest → newest", S6 said "newest → oldest". With user consent (fix-now path, same guardrails as D-41), S2's comment changed to "ordered newest → oldest (matches S6 / `idx_snapshots_customer_taken`)". The existing DESC index in S2 already ordered the right way; this was a documentation-only inconsistency.

## AI outputs accepted

- **`docs/PRD.md`** — append-only edit: R20 added to §6 (Should / Regulatory); §9 traceability row added for R20. R1–R19 unchanged; Q1–Q5 / A1–A5 unchanged.
- **`docs/TECH_SPEC.md`** — new file produced through three iterations (revisions 1 → 2 → 3) + the D-41 / D-42 surgical fixes. Final size 517 lines. Sections: phase-gate header, §1 Overview, §2 Architecture (with ASCII diagram), §3 Implementation slices S1–S9, §4 Cross-cutting concerns, §5 Trade-offs and alternatives considered, §6 Out of scope, §7 PRD → tech spec traceability table.
- **`docs/ai/sessions/S007-tech-spec.md`** — this snapshot.
- **`docs/PROMPT_HISTORY.md`** — S007 row appended.

## AI outputs rejected or changed

- **Revision-1 inlined "not financial advice" footer in S4 under R6 + R9.** Rejected by round-1 critic as workflow-rule-2 gate-cross. Reversed: PRD R20 added; S9 owns the design.
- **Revision-1 included a 280-char free-text `note` field on `IncomeAndExpenditure`.** Rejected by round-1 critic as a PII risk surface that PRD never authorised. Deleted from S1 type, S5 form, S7 matrix in revision 2. The user explicitly chose deletion over routing back for a new R (avoids new scope).
- **Revision-1 typed `band: Band` with `'breakeven'` as the no-data band value.** Rejected by round-1 critic as inventing a band value PRD R1 does not sanction. Loosened to `Band | null` in revision 2; PRD's three-value schema preserved.
- **Revision-2 placed `<FramingNotice />` on `/` (persona picker) and on `/dashboard/update` (form host page).** Rejected by round-2 critic (F2.1 / F1.1 / F2.2) as a workflow-rule-2 gate-cross of the same shape as round-1's F4.3 — extending R20's literal "every outcome screen" wording in-spec. Narrowed to `/dashboard` + `/history` only in revision 3.
- **Revision-2 exported an abbreviated single-sentence framing variant from `framing.ts`.** Rejected by round-2 critic (F2.2) as an in-spec invention. Dropped in revision 3 — R20 specifies one framing surface, not progressive disclosure.
- **Revision-2 had S7 as a single monolithic "tests" slice.** Rejected by round-2 critic (F5.2) as too large for one `/implement` session and as creating a chicken-and-egg with S1's tests. Revision 3 restructured S7 into "framework setup ships first" + per-slice test ownership.
- **Considered adding `R21` for free-text `note` privacy posture.** Rejected at the route-back-to-PRD question (D-36) — the simpler fix is to delete the `note` field entirely, avoiding both new scope and a PII risk vector.
- **Considered adding `R21` to broaden R20 to non-outcome screens.** Rejected at the F2.1/F2.2/F3.1 question (D-39) — narrowing S9 to R20's literal wording is the cheaper, more PRD-faithful fix.
- **Considered citing a specific WCAG version in S005 / R18.** Already rejected in S005 D-27; tech-spec deferred the conformance level. S007 D-34 pinned **WCAG 2.2 AA** — a published standard (no fabrication risk) chosen by the spec, as PRD R18 explicitly authorised tech-spec to do.

## Files changed

- `docs/PRD.md` (modified — append-only: R20 + §9 row). Line count: 153 → 155.
- `docs/TECH_SPEC.md` (new — 517 lines after revisions 1 → 2 → 3 → D-41 / D-42 fixes).
- `docs/ai/sessions/S007-tech-spec.md` (new — this file).
- `docs/PROMPT_HISTORY.md` (S007 row appended).

## Tests added or run

None. Tech-spec is a documentation-only phase per `.cursor/rules/00-workflow.mdc`. `ReadLints` against `docs/PRD.md` and `docs/TECH_SPEC.md` was clean after every edit.

## Handoff for next session (S008 — `/test-plan`)

1. **Run `/test-plan`** to produce `docs/TEST_PLAN.md` (phase 4 of 5). Pre-checks: `docs/TECH_SPEC.md` exists, has at least one `S*` slice, and every Must PRD requirement maps to at least one `S*` — all currently satisfied per `docs/TECH_SPEC.md` §7.
2. **Assign `T*` IDs to every row in `docs/TECH_SPEC.md` §3 S7's coverage matrix.** Each `T*` should be attached to its **owning slice** (the new column in the revision-3 matrix), not to S7. The matrix already has the asserted-behaviour text — `/test-plan` just needs to give each row a stable ID and a place in the per-slice test inventory.
3. **Finalise the forbidden-token lists.** S7 explicitly labels the tone and advice-implying token lists as "illustrative — `/test-plan` finalises". Pin the final list there; copy back into a single `tests/_helpers/forbiddenToneTokens.ts` constant when `/implement` ships.
4. **Carry forward the S005-handoff test-relevant findings the prior tech-spec session deferred:**
   - **F3.4** R6/R7 testability (what counts as "tone-appropriate" / "signpost present" in a test).
   - **F5.5** subjective adjectives in R6 / R9 / R10 (operationalise the words PRD couldn't pin).
   - **F7.3** R10 logging-enforcement coverage (the test plan should specify how thoroughly the `console.*` spy covers each emit-site, not just the action-call path).
   - **F7.6** R4 binding to R5 + R8 jointly (every R5 case tested with at least one R8 persona).
5. **Stretch-test discipline (R19).** Dormant unless `/implement` decides to attempt R11, R12, or R13. If a Stretch is added, `/test-plan` must extend coverage to it at the same standard as R4 — per R19. No test plan rows for Stretches are needed up front.
6. **PRD and tech-spec stay append-only.** If `/test-plan` discovers a real requirement gap or a tech-spec design gap, route it back to `/prd` (then re-derive tech-spec) per `.cursor/rules/00-workflow.mdc` rule 2. `R*` IDs are append-only (next would be `R21`); `S*` IDs are append-only (next would be `S10`); `T*` IDs are first-issue in `/test-plan` and append-only thereafter.
7. **Commit the pending work.** All S007 work is currently uncommitted on `main` (D-36 PRD edit + D-37/D-40 TECH_SPEC + this snapshot + the PROMPT_HISTORY row). Suggested split if a PR is preferred:
   - PR 1: PRD R20 follow-up (docs/PRD.md only — append-only).
   - PR 2: Tech-spec full revision trail (docs/TECH_SPEC.md new, docs/ai/sessions/S007-tech-spec.md new, docs/PROMPT_HISTORY.md S007 row).
   - The user has not asked for commits yet; do not commit without explicit consent.
8. **Known limits the test plan should not try to close.** Server Action direct-call tests skip the RSC payload boundary and the `useActionState` round-trip; `revalidatePath` is mocked. These are MVP trade-offs (documented in tech-spec §4 + §5) — `/test-plan` should not invent `T*` IDs that require driving the real React form runtime, and it should not assume revalidation is asserted automatically.
9. **Suggested next session ID: S008 — test plan.**

## Tests not yet run

None pending — tech-spec phase is documentation-only and produced no source code.
