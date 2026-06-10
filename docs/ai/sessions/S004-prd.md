# AI Session Snapshot: S004 - PRD generation

## Metadata

- Date: 2026-06-10
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: doc/prd
- Start commit: e40df4c889acdb78ff4ef9a3de7f11189f4cdfd1
- End commit: (in progress)
- Raw transcript: `.specstory/history/2026-06-10_16-33-38Z-product-requirements-document-guidelines.md`
- Related PRD/spec/test docs: produces `docs/PRD.md` (phase 2 of 5)

## Goal of this Cursor window

Run the `/prd` slash-command (phase 2 of 5 per `.cursor/rules/00-workflow.mdc`) using `docs/PRD_TEMPLATE.md` as the canonical structure and `docs/Ophelos Engineering Take-Home Task.pdf` + `docs/discovery/NOTES.md` as the only authoritative sources. Produce a lean PRD focused on the MVP, free of implementation details. Do not cite the withdrawn `docs/TASK_ANALYSIS.md`.

## Context given to AI

- `docs/Ophelos Engineering Take-Home Task.pdf` — the brief (binding upstream source).
- `docs/discovery/NOTES.md` — discovery output, §1 Problem, §2 Users, §4 Success signals, §5 Constraints, §6 OQ-1..OQ-7 (resolved or direction-set), §7(b) explicitly dropped scope.
- `docs/PRD_TEMPLATE.md` — canonical structure for `docs/PRD.md`.
- `.rulesync/commands/prd.md` — `/prd` command pre-checks and rules.
- `.claude/skills/phase-gate/SKILL.md` — header / traceability schema.
- `.cursor/rules/00-workflow.mdc`, `.cursor/rules/10-evidence.mdc` — workflow gates and anti-fabrication.
- S003 handoff (`docs/ai/sessions/S003-discovery.md`) — items the PRD must specify.

## Main prompts used

- User invoked `/prd` with explicit instructions:
  1. Use `docs/PRD_TEMPLATE.md` as the required structure.
  2. Use brief PDF + discovery notes as authoritative sources only.
  3. Do not use the withdrawn `docs/TASK_ANALYSIS.md`.
  4. Generate a lean PRD focused on the MVP.
  5. Avoid implementation details.

## Decisions made in this session

- **D-15.** PRD requirement IDs start at `R1` and run to `R17` (first-issue). IDs are append-only per `.cursor/rules/10-evidence.mdc`; future revisions must use `R{n} — DROPPED (reason)` rather than reusing IDs.
- **D-16.** Must-class requirements correspond exactly to the brief's MUST list (R1, R2, R4) plus a derived persistence commitment (R3: "snapshots persist across restarts") and the four submission artefacts the brief grades alongside the code (R14 README, R15 DECISIONS.md, R16 prompt history, R17 time-spent). Persistence is committed at PRD level only — technology choice is intentionally deferred to tech-spec (per `NOTES.md` §6 OQ-5 and the template's anti-pattern rule against framework names in PRD).
- **D-17.** Should-class requirements ratify the brief's three SHOULDs as five operationally-distinct rows: edge cases (R5), tone (R6), human-support signpost (R7), explainability (R9), data minimisation (R10). The 7-persona fixture set is added as R8 Should because R4 ("tests protect real cases") is load-bearing without it.
- **D-18.** Stretch items become Could-class (R11, R12, R13) and remain explicitly outside the MVP unless time permits. Per the user's "lean PRD" instruction they are not promoted into Should.
- **D-19.** Three open questions retained, each paired with a working assumption so tech-spec is not blocked: Q1/A1 band thresholds (default DI > 0 / = 0 / < 0; tech-spec may add a near-breakeven band), Q2/A2 first-snapshot delta state (friendly placeholder), Q3/A3 irregular-income input (per-month as-entered, with a small "may vary" note rather than an averaging-window UI). All three can be adopted as-defaulted if unresolved.
- **D-20.** Non-goals (N2/N3/N4) explicitly close the door on the `§7(b)` discovery items (arrangement booking, plan confirmation, collections workflow, agent UI, COps payloads) so the PRD itself enforces the OQ-1 resolution rather than leaving it implicit.
- **D-21.** FCA / GDPR paraphrases are inherited from `NOTES.md` with their "_not independently verified_" labels intact (per OQ-7). Section 3 cites the brief lines for the FCA-authorisation stance but does not introduce new regulator citations.
- **D-22.** Persona fixtures are described at PRD level by their narrative descriptors only (surplus / breakeven / shortfall / zero-income / new-customer / irregular-income / joint-income). Per-persona starting £-values are deferred to tech-spec / fixtures because they sit at the boundary the template's anti-patterns flag as "field-level granularity".
- **D-23 (mid-session refinements requested by user).**
  - **R3 wording** changed from the engineer-flavoured "Snapshots persist across application restarts" to the customer-facing "The customer can return later and view previously submitted snapshots." Underlying persistence commitment is unchanged; tech-spec still inherits `NOTES.md` §6 OQ-5's SQLite direction. G2 (Section 7) and the Persistence row in the traceability table updated for consistency.
  - **R1 wording (later superseded by D-24)** was strengthened to lead with "**calculation transparency**" so the requirement carried an explicit lexical bridge to the brief's "explainability of decisions" (lines 17–19) and "how decisions are surfaced to users" (lines 69–70). R1's `Why` citation was expanded to include those brief-line ranges. R9 was reworded to clarify the pairing: R1 surfaces the calculation, R9 surfaces the rationale. Traceability row updated to make the bridge visible. **This change was reversed in D-24** — see below.
- **D-24 (correction — D-23's R1/R9 wording reversed).** The user pointed out that "calculation transparency" leaned toward formula-disclosure, which is exactly the framing the brief warns against ("We're not assessing whether you can implement a formula. We're looking for evidence that you can think about a problem from a user's perspective…" — brief lines 99–102). The PRD must commit to user *outcomes*, not to the system displaying its working. Revisions:
  - **R1** restated as a user-outcome commitment: "The customer can see a meaningful affordability assessment of their current position — disposable income, a categorical band (surplus / breakeven / shortfall), and a plain-language reading of what the result means for them — and leaves understanding their position, not just receiving a verdict." `Why` citation now includes brief lines 99–102 (user-perspective lens) alongside lines 17–19 / 69–70.
  - **R9** restated as a user-outcome commitment: "The customer can understand the reasoning behind their assessment — *why* their band was assigned, and *how* their position has changed since the previous snapshot — in plain language."
  - **R1 / R9 boundary** clarified in R9's Notes column and in the traceability row: R1 = the customer understands *what* their position is; R9 = the customer understands *why* and *how it has changed*. The FCA explainability obligation is honoured by user understanding, not by formula disclosure.
  - R1 stays Must–Core; R9 stays Should–Regulatory. The lexical bridge to the brief's explainability lines is preserved (in R1's `Why` and in the traceability row's Notes), but as the *justification* for the requirement rather than as part of the requirement statement itself.

## AI outputs accepted

- `docs/PRD.md` — full PRD per `docs/PRD_TEMPLATE.md` structure with phase-gate header, Sections 1–9, Requirements R1–R17, Open questions Q1–Q3 paired with Working assumptions A1–A3, and Discovery → PRD traceability table.
- `docs/ai/sessions/S004-prd.md` — this session snapshot.
- `docs/PROMPT_HISTORY.md` — S004 row appended.

## AI outputs rejected or changed

- Initial draft considered listing additional `Won't`-class rows for the §7(b) dropped items (e.g. arrangements endpoint, agent UI). Removed because Non-goals N2–N4 already cover them and adding `Won't` rows would duplicate without adding contract value.
- Initial draft considered specifying exact band-threshold £-values directly in R1. Moved to working assumption A1 instead, with thresholds expressible by Q1, so PRD does not over-commit to numbers the brief is silent on.
- Initial impulse to list per-persona starting £-values inline in R8 dropped — those are field-level fixture detail per the template's anti-patterns; PRD commits to the persona descriptors only.

## Files changed

- `docs/PRD.md` (new)
- `docs/ai/sessions/S004-prd.md` (new — this file)
- `docs/PROMPT_HISTORY.md` (S004 row appended)

## Tests added or run

None. PRD is a documentation-only phase per `.cursor/rules/00-workflow.mdc`.

## Handoff for next session

1. Run `/tech-spec` to generate `docs/TECH_SPEC.md`. Each tech-spec section ID (`S1`, `S2`, …) must list the requirement IDs it covers. Every Must requirement in `docs/PRD.md` (R1–R4, R14–R17) needs at least one tech-spec section. Should and Could requirements (R5–R10, R11–R13) are still in scope; tech-spec decides which to design now and which to leave as deferred.
2. Tech-spec resolves the technology choices PRD intentionally left abstract: the persistence technology backing R3 (per `NOTES.md` §6 OQ-5: SQLite via a lightweight ORM is the discovery-set direction; tech-spec picks the specific ORM, schema, and DB file location, consulting `node_modules/next/dist/docs/` per `AGENTS.md`); the framework/form-factor confirmation for `NOTES.md` §6 A-1; and the per-persona starting £-values for the R8 fixtures.
3. Tech-spec also makes the three open questions concrete:
   - Q1 / A1 — pin numeric band thresholds (whether to keep DI > 0 / = 0 / < 0 or add a near-breakeven band).
   - Q2 / A2 — confirm or refine the first-snapshot delta-state copy.
   - Q3 / A3 — confirm or refine the irregular-income presentation.
4. Test plan (phase 4) covers every PRD requirement at least once; R4 + R8 together set the bar for what "protect something real" means here.
5. PRD is append-only. If tech-spec discovers a requirement gap, fix the gap in PRD first (revising via a session that adds new `R*` IDs or marks dropped ones), then re-derive tech-spec — per `.cursor/rules/00-workflow.mdc` rule 2 ("Do not edit a later artefact to fix a gap in an earlier one").
6. Suggested next session ID: **S005 — tech spec**.
