# AI Session Snapshot: S005 - PRD critic review + minimum append-only follow-ups

## Metadata

- Date: 2026-06-10
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: doc/prd
- Start commit: e40df4c889acdb78ff4ef9a3de7f11189f4cdfd1 (S004 PRD work still uncommitted at S005 start)
- End commit: (in progress)
- Raw transcript: `.specstory/history/2026-06-10_17-12-45Z-document-review-findings-and-recommendations.md`
- Related PRD/spec/test docs: refines `docs/PRD.md` produced by S004; adds R18, R19, Q4/A4, Q5/A5 (phase 2 of 5, append-only follow-up)

## Goal of this Cursor window

1. Run `.rulesync/subagents/critic.md` against `docs/PRD.md` (phase 2 artefact) to identify gate failures, traceability gaps, and conduct / vulnerability / FCA blind spots before moving to `/tech-spec`.
2. Apply only the minimum append-only PRD changes required to resolve the findings the user accepted, preserving every existing requirement ID and avoiding edits to existing rows.
3. Confirm the PRD is ready for phase 3 (`/tech-spec`).

## Context given to AI

- `docs/PRD.md` — phase 2 artefact under review (S004 output).
- `docs/discovery/NOTES.md` — phase 1 artefact, upstream input for the PRD.
- `docs/Ophelos Engineering Take-Home Task.pdf` — the brief (binding upstream source).
- `docs/PRD_TEMPLATE.md` — canonical PRD structure.
- `.rulesync/subagents/critic.md` — read-only critic role definition (sections required: Verdict, Missing or unsupported claims, Gate failures, Traceability gaps, Conduct/regulatory/accessibility blind spots, Top three things to fix first).
- `.cursor/rules/00-workflow.mdc`, `.cursor/rules/10-evidence.mdc` — phase-gate workflow + anti-fabrication / append-only IDs.
- `.rulesync/commands/tech-spec.md` — pre-checks the PRD must satisfy before phase 3.

## Main prompts used

1. User invoked the critic role against `docs/PRD.md` with 7 explicit focus areas: missing brief requirements; scope creep; vulnerable-customer risks; FCA-context gaps; requirement ambiguity; traceability gaps; future implementation risks. Explicit instruction: do not rewrite the document; provide finding / severity / recommendation.
2. After receiving the critique, user accepted four findings for append-only resolution: **F3.1 (accessibility gap), F1.1 (stretch items must be tested if attempted), F4.1 (retention assumption missing), F7.2 (immutable-snapshot correction story)**. Explicit constraints: preserve all existing requirement IDs; add new IDs where needed; no rewrites of existing rows unless absolutely necessary; PRD stays implementation-agnostic; no new product scope beyond what is required to resolve the findings; discovery artefacts untouched.

## Decisions made in this session

- **D-25.** Critic review produced **Verdict: Minor fixes** for `docs/PRD.md`. 24 findings recorded across the 7 user-specified focus areas. Top-3 surfaced: F3.1 accessibility (High), F3.2 zero-income conflated into shortfall in A1 (High), F1.3/F6.4 self-declare path missing (Medium with conduct flavour).
- **D-26.** Four findings accepted for append-only resolution in this session: F3.1, F1.1, F4.1, F7.2. The remaining ~20 findings are deferred (see "AI outputs rejected or changed" + "Handoff" sections below).
- **D-27 (R18 framing).** Accessibility requirement framed at discovery's literal level — "screen reader" and "without precise motor input" — because neither the brief nor `NOTES.md` cites a specific WCAG level. Citing one (e.g. WCAG 2.2 AA) would have been fabrication per `.cursor/rules/10-evidence.mdc`. The specific accessibility standard and conformance level are explicitly deferred to tech-spec inside R18's statement itself, so the PRD stays implementation-agnostic.
- **D-28 (R19 framing).** Stretch-test discipline added as a separate Should-class `R*` (R19) rather than editing R4. R19 is **Should**, not Must, because its precondition (R11/R12/R13 delivered) is Could-class; obligating tests on a Could-class antecedent at a Must level would have mis-stated priority. R19 is categorised **Core** to align with R4's testing-discipline category, not with the Stretches it conditionally protects.
- **D-29 (F4.1 — retention).** Resolved via Q4 / A4 working-assumption pair rather than a new `R*` because pinning a retention period at PRD level would have introduced new product scope (a retention policy is a product behaviour, not just a clarification). A4 explicitly defers production retention to out-of-scope, and is consistent with N8 (independent FCA / GDPR verification out-of-scope for this take-home).
- **D-30 (F7.2 — corrections).** Resolved via Q5 / A5 working-assumption pair rather than editing R2. A5 commits to "corrections = new snapshot, prior snapshots remain visible", and defers any "this looks like a correction" UI affordance to tech-spec / implementation.
- **D-31 (deferred findings).** ~20 critic findings consciously not addressed in this session, on three explicit grounds (in order of frequency):
  - **(a) Tech-spec / test-plan responsibility** (operational thresholds, copy specifics, fixture schemas, security models): F3.4 R6/R7 testability, F5.2 R2 delta shape, F5.3 R3 retrieval depth/order, F5.4 R8 joint-income schema, F5.5 subjective adjectives in R6/R9/R10, F7.3 R10 logging enforcement, F7.4 R12 share-link security model, F7.5 N7 default language, F7.6 R4↔R5↔R8 dependency formalisation.
  - **(b) Would edit an existing requirement / assumption row** (ruled out by the user's "do not rewrite existing requirements" constraint): F2.1 R8 mis-category, F2.2 R7 brief-adjacency in `Why`, F3.2 A1 zero-income/shortfall split, F4.2 §3 paraphrase tagging on existing `R*` rows, F5.1 R1/A1 band-set, F6.1 §2 "Secondary" user row label, F7.1 implicit I&E input surface.
  - **(c) Would introduce new product scope** (ruled out by the user's "no new product scope" constraint): F3.3 joint-income economic-abuse risk, F4.3 "indicative / not financial advice" framing, F1.3 / F6.4 self-declare affordance.
  - **(d) Non-actionable** (cosmetic / forward-link convention already covered by phase-gate): F6.2 (=F4.2), F6.3 forward-link slot for `S*` IDs.
- **D-32 (no §3 / §7 edits).** Despite F4.1 touching `§3` GDPR paraphrase and F7.2 touching `§7` G3-adjacent territory, both findings are resolved entirely in §8 (Q/A) and §9 (traceability — only for R18 / R19). §3, §5, §7 are unchanged in this session.
- **D-33 (no §9 rows for Q/A).** Per the PRD-template convention (Q1/A1, Q2/A2, Q3/A3 have no §9 rows), Q4/A4 and Q5/A5 also get no §9 rows. Only the two new `R*` (R18, R19) gain §9 entries.

## AI outputs accepted

- **Critic review** delivered inline in chat (read-only; no file written), structured per user's 7 focus areas with finding / severity / recommendation per item, plus Verdict + Top-3.
- **`docs/PRD.md` edits** (4 append-only StrReplace operations):
  - §6 Requirements — appended **R18** (Should / Vulnerability — accessibility baseline) and **R19** (Should / Core — stretch-test discipline).
  - §8 Open questions — appended **Q4** (snapshot retention) and **Q5** (snapshot correction).
  - §8 Working assumptions — appended **A4** (retention default — lifetime-of-customer-record for the take-home) and **A5** (correction default — new snapshot; prior snapshots remain visible).
  - §9 Traceability table — appended rows for R18 and R19; no rows added for Q/A pairs (per D-33).
- **No edits** to: §1 problem statement, §2 users and JTBD, §3 regulatory and duty-of-care, §4 goals, §5 non-goals, §7 success metrics, §6 rows R1–R17, §8 Q1–Q3 / A1–A3, §9 rows R1–R17.
- **No edits** to `docs/discovery/NOTES.md` (user constraint #7).
- **No edits** to `docs/PRD_TEMPLATE.md`, `.rulesync/`, or `.cursor/rules/`.

## AI outputs rejected or changed

- **Initial framing of R18** proposed citing a specific WCAG version. Reversed — neither the brief nor `NOTES.md` carries that citation, and inventing one would have violated `.cursor/rules/10-evidence.mdc` anti-fabrication. R18 now stays at discovery's literal "screen-reader / motor accessibility" wording and defers the standard to tech-spec.
- **Considered** appending a clause to R4 ("…and to any Stretch requirement that is actually delivered") instead of adding R19. Rejected — that would have edited an existing requirement row, violating the user's constraint #1. R19 is the strict append-only alternative.
- **Considered** adding a new `R*` for snapshot retention (instead of Q4/A4). Rejected — committing to a retention period at requirement level would have introduced new product scope, violating the user's constraint #6. Working assumption is the right phase-gate home.
- **Considered** adding a new `R*` for snapshot corrections (instead of Q5/A5). Rejected for the same scope reason as retention.
- **Considered** also fixing F3.2 (A1 collapses zero-income into shortfall) and F1.3 (self-declare affordance) opportunistically. Rejected — F3.2 edits an existing assumption row; F1.3 adds new product scope. Both deferred to tech-spec per D-31.

## Files changed

- `docs/PRD.md` (modified — append-only: R18, R19, Q4/A4, Q5/A5, two §9 rows). Line count: 145 → 153.
- `docs/ai/sessions/S005-prd-critic-and-followups.md` (new — this file).
- `docs/PROMPT_HISTORY.md` (S005 row appended).

## Tests added or run

None. PRD is a documentation-only phase per `.cursor/rules/00-workflow.mdc`. `ReadLints` against `docs/PRD.md` reported no issues after the four edits.

## Handoff for next session

1. **Commit the pending PRD work.** Both S004's PRD generation and S005's append-only follow-ups are currently uncommitted on `doc/prd`. Suggested split:
   - One commit for S004 (`docs/PRD.md` initial, `docs/ai/sessions/S004-prd.md`, PROMPT_HISTORY S004 row).
   - One commit for S005 (`docs/PRD.md` R18/R19/Q4-5/A4-5 follow-ups, `docs/ai/sessions/S005-prd-critic-and-followups.md`, PROMPT_HISTORY S005 row).
   - The user has not asked for commits yet; do not commit without explicit consent.
2. **Run `/tech-spec`** to generate `docs/TECH_SPEC.md`. PRD now satisfies the `/tech-spec` pre-checks: `docs/PRD.md` exists, has Must requirements (R1–R4, R14–R17), and every open question (Q1–Q5) is paired with an adopt-as-default working assumption (A1–A5).
3. **Tech-spec must explicitly carry the deferred critic findings.** The list in D-31 is the inbox for `/tech-spec` and `/test-plan`. In particular, tech-spec should:
   - **F3.2** — decide whether to keep A1's zero-income-routes-to-shortfall rule or split zero-income into its own outcome (the spec is free to refine A1 because the PRD framing of A1 is "adopted if Q* stays unresolved" — tech-spec resolving Q* is in-scope).
   - **F5.1** — pin Q1's band thresholds (whether to add a near-breakeven band).
   - **F5.2** — define the R2 delta shape (DI £ change, band change, both).
   - **F5.3** — define R3 retrieval depth and order.
   - **F5.4** — define the R8 joint-income schema (one I&E payload with two earner slots, two I&E payloads, etc.).
   - **F7.1** — decide whether I&E is customer-entered or fixture-loaded for the take-home; R5(d) "invalid input" semantics depend on this.
   - **F4.3** — propose (or formally decline) an "indicative / not financial advice" framing under R1 / R9 and route back through PRD if accepted.
   - **R18 conformance level** — choose the accessibility standard and conformance level the PRD intentionally left abstract.
   - **R12 security model** — if R12 is attempted at all, the tech-spec defines the link's scope, expiry, single-use behaviour, and threat model.
4. **Test-plan must carry the remaining deferred findings.** F3.4 (R6/R7 testability), F5.5 (subjective adjectives in R6/R9/R10), F7.3 (R10 logging enforcement coverage), F7.6 (R4 binding to R5 + R8 jointly).
5. **PRD stays append-only.** If `/tech-spec` discovers a true requirement gap, fix it in PRD first with new `R*` IDs (or `R{n} — DROPPED (reason)`), then re-derive tech-spec — per `.cursor/rules/00-workflow.mdc` rule 2.
6. **Suggested next session ID: S006 — tech spec.**

## Tests not yet run

None pending — PRD phase is documentation-only.
