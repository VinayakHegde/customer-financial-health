# AI Session Snapshot: S003 - Discovery pass

## Metadata

- Date: 2026-06-10
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: main
- Start commit: e33b9298133103deffdc84adeed10d30a27378dc
- End commit: (in progress)
- Raw transcript: `.specstory/history/2026-06-10_13-29-42Z-ophelos-engineering-take-home-task.md`
- Related PRD/spec/test docs: none yet — this session produces the phase-1 input for the future `docs/PRD.md`

## Goal of this Cursor window

Run the `/discovery` slash-command (phase 1 of 5 per `.cursor/rules/00-workflow.mdc`) against `docs/Ophelos Engineering Take-Home Task.pdf` and produce `docs/discovery/NOTES.md` following the `phase-gate` skill schema. No PRD, tech spec, test plan, or implementation in this session.

## Context given to AI

- `docs/Ophelos Engineering Take-Home Task.pdf` — the engineering brief (now linked from the slash-command argument; not formally available in S001).
- `docs/TASK_ANALYSIS.md` — S001 analysis kept as primary product framing per session decision.
- `.claude/skills/phase-gate/SKILL.md` (generated from `.rulesync/skills/phase-gate/SKILL.md`) — header, traceability-table, and ID-convention schema.
- `.cursor/rules/00-workflow.mdc` — five-phase gated workflow.
- `.cursor/rules/10-evidence.mdc` — anti-fabrication, stable identifiers, traceability, sensitive data.
- `AGENTS.md` — Next.js docs lookup rule.
- S002 handoff (`docs/ai/sessions/S002-ai-guardrails.md`) — suggested next session ID `S003`.

## Main prompts used

- User invoked `/discovery docs/Ophelos Engineering Take-Home Task.pdf` (see raw transcript for full message).
- Two clarifying questions were asked before drafting:
  1. Confirm session ID — answered **S003**.
  2. Reconcile framing tension between the brief (financial-health visibility + tracking over time) and `docs/TASK_ANALYSIS.md` S001 (arrangement journey) — initial answer was "keep `docs/TASK_ANALYSIS.md` framing as primary; treat brief as supplementary".
- Mid-session clarification from the user: **"Use S001 as a template if needed - but PRD should be source of truth for building this feature."** This narrows D-2 from "S001 framing primary" to "S001 is background / template only; PRD is source of truth for build scope". `docs/discovery/NOTES.md` and this snapshot were updated accordingly.
- After the discovery doc was reframed, the user asked whether all open questions were resolved. Three product-shaped open questions (OQ-2, OQ-3, OQ-4) were then put to the user and answered in a single batched form. See D-6 / D-7 / D-8 below.
- The user then requested the remaining open questions (OQ-5 persistence, OQ-6 personas, OQ-7 FCA citations) also be resolved before `/prd`. They were put to the user; OQ-5 needed a clarifying re-ask after the user asked whether customer details were being stored alongside snapshots. The clarification distinguished static persona fixtures (always code/JSON, not in DB) from dynamic snapshot history (the actual subject of OQ-5). See D-10 / D-11 / D-12 below.
- **Corrective refinement turn (D-13).** User instruction: refine `docs/discovery/NOTES.md` to make the brief the binding source, drop S001 arrangement-journey scope unambiguously, and elevate submission artefacts as first-class items. Explicitly listed dropped items: repayment arrangement booking, confirmation journey, `POST /api/arrangements`, agent review queues, payment-plan confirmation. Explicit instruction: do not create `docs/PRD.md`; do not write code. See D-13 below.
- **Consistency-and-withdrawal turn (D-14).** User instruction: refine `docs/TASK_ANALYSIS.md` and `docs/discovery/NOTES.md` for consistency, with the PDF brief as the binding source of truth; remove remaining assumptions about repayment-plan selection, arrangement confirmation, collections workflow, agent review processes, and arrears-management tooling; user explicitly granted permission to **discard** `docs/TASK_ANALYSIS.md` if redundant. Explicit instruction: do not create PRD.md, do not create tech specs, do not write code. See D-14 below.

The agent did not invent additional prompts; the questions above are the only ones posed.

## Decisions made in this session

- **D-1.** Session ID is `S003`.
- **D-2 (revised).** `docs/Ophelos Engineering Take-Home Task.pdf` is the binding upstream source. `docs/TASK_ANALYSIS.md` (S001) is background / template input only and is **not** binding on PRD. **`docs/PRD.md` will be the source of truth for build scope.** This supersedes the earlier intent to keep S001 framing as primary.
- **D-3.** The framing tension between the brief and S001 is **not resolved in discovery**. It is captured as `OQ-1` in `docs/discovery/NOTES.md` §6, with a stated default ("brief MUSTs win; S001 dropped where it exceeds them") for PRD to either adopt or override. This honours the workflow rule "Do not edit a later artefact to fix a gap in an earlier one".
- **D-4.** All FCA references paraphrased from `docs/TASK_ANALYSIS.md` (Consumer Duty, CONC, FG21/1) are labelled in the discovery doc as "paraphrased; not independently verified". PRD will decide whether to verify or keep as paraphrase (`OQ-7`).
- **D-5.** Working assumption (`A-1`): Next.js web app, because the repo is already scaffolded that way. Tech-spec phase will confirm or change.
- **D-6.** `OQ-2` (tracking granularity) → **direction set: per-submission immutable snapshot.** Each I&E submission creates a snapshot; no scheduled jobs, no manual save button. PRD codifies the data shape.
- **D-7.** `OQ-3` (affordability metric) → **direction set: disposable income + categorical band (surplus / breakeven / shortfall) + plain-language explainer + delta vs previous snapshot.** Combines with `OQ-2`'s snapshot model to satisfy "track over time" + "meaningful affordability" + "explainable" simultaneously. PRD specifies exact band thresholds, copy, and the "no previous snapshot" delta state.
- **D-8.** `OQ-4` (edge cases) → **direction set: canonical 4-case set: (a) income = 0, (b) expenditure > income, (c) no-data state, (d) invalid input (negative numbers, non-numeric).** All handled as first-class outcomes with clear messages, not as form errors. PRD enumerates exact behaviour per case.
- **D-9.** *(superseded by D-10/11/12).* `OQ-5`, `OQ-6`, `OQ-7` were initially deferred from this session; the user requested they be resolved before `/prd`. See D-10/11/12.
- **D-10.** `OQ-5` (persistence model) → **direction set: SQLite via a lightweight ORM**, scoped *only* to snapshot history (the dynamic, customer-generated time-series). Customer profiles for the 7 fixture personas remain as code/JSON fixtures in the repo. Aligns with brief stretch "schema migrations" if attempted. Tech-spec phase picks the specific ORM, schema, and DB file location, consulting `node_modules/next/dist/docs/` per `AGENTS.md`. **Note:** OQ-5 is normally tech-spec territory; recording it at discovery level was an explicit user request, and tech-spec retains authority to change ORM / schema details within the SQLite-class direction.
- **D-11.** `OQ-6` (fixture personas) → **direction set: 7 personas** — surplus, breakeven, shortfall, zero-income, new-customer (no I&E yet), irregular-income, joint-income household. Covers OQ-3 bands, OQ-4 edge cases, and two SHOULD-class income shapes. PRD codifies the persona schema and per-persona starting values.
- **D-12.** `OQ-7` (FCA citation verification) → **direction set: keep paraphrases, label clearly as "paraphrased from `docs/TASK_ANALYSIS.md`; not independently verified".** Independent verification against the FCA source is out of scope for this take-home. PRD inherits the labels as-is.
- **D-13 (corrective pass).** `OQ-1` is upgraded from "DIRECTION SET (default)" to **RESOLVED**. The brief is binding; S001 contributes no scope. `docs/discovery/NOTES.md` §7 now enumerates the dropped product-scope items explicitly:
  - Repayment-arrangement booking
  - Confirmation journey (I&E → options → confirm wizard)
  - Payment-plan confirmation
  - `POST /api/arrangements` (or equivalent arrangements endpoint)
  - Agent review queues
  - Agent-facing console / override UI
  - COps-readable submission objects beyond what the customer surface naturally produces

  Concurrently, submission artefacts (prompt history, `DECISIONS.md`, `README`, time-spent note) are promoted to **first-class** success signals (§4) and constraints (§5). The COps "Secondary user" subsection in §2 was removed and replaced with an "Out-of-scope user roles" subsection. Residual S001-flavoured phrasing in §3 ("operational cost on agent channels") and §5 CONC row ("record what was offered/accepted") was rewritten to remove arrangement-journey implication. The traceability table's "handoff to human support" row was rewritten to be a signposting requirement only (not an agent queue / callback / handover).

After D-13, **all OQ-1 through OQ-7 are direction-set or resolved**.

- **D-14 (consistency-and-withdrawal pass).** `docs/TASK_ANALYSIS.md` is **withdrawn from the repo** (file deleted). Rationale: that document was a pre-brief analysis of a collections / arrangement-journey workflow that the brief does not ask for. Keeping it as "background only" was creating consistency pollution (28+ citations in `docs/discovery/NOTES.md`, each carrying scope baggage). Refining it would have required rewriting it as a duplicate of `docs/discovery/NOTES.md`. User explicitly granted permission to discard. Changes made:
  - **Deleted:** `docs/TASK_ANALYSIS.md`
  - **`docs/discovery/NOTES.md`** updated to own all previously-cited substance as repo-owned paraphrases marked "_not independently verified_" — FCA Consumer Duty / CONC / FG21/1 paraphrases (§2 vulnerability subsection; §5 Regulatory table), UK GDPR paraphrase (§5 Data protection table), user-empathy bullets (§2 Primary), Why-now paraphrases (§3), customer-outcome heading source (§4), timebox derivation (§5 Timebox), mock-auth assumption (A-2), stretch-deferral assumption (A-3). All 28+ `docs/TASK_ANALYSIS.md` citations removed; the few remaining mentions are historical / explanatory (header note about the withdrawal, OQ-1 resolution narrative, §7(b) provenance).
  - **`docs/discovery/NOTES.md` §7(b)** expanded to include the corrective-pass items from D-14: **repayment-plan selection, arrangement confirmation, collections workflow, agent review processes, arrears-management tooling** (alongside the D-13 items already there).
  - **OQ-1** restated as RESOLVED (D-13 / D-14) — historical reference to the withdrawn doc preserved for explanatory clarity.
  - **OQ-7** revised to attribute the paraphrases to this document, not to the withdrawn doc.
  - **`.rulesync/commands/discovery.md`** updated: removed `docs/TASK_ANALYSIS.md` from "Inputs to load"; added a note that the doc was withdrawn.
  - **`.rulesync/commands/prd.md`** updated: removed `docs/TASK_ANALYSIS.md` from "Inputs to load"; added a note that the PRD must not cite the withdrawn doc or reintroduce its dropped scope.
  - **`docs/PRD_TEMPLATE.md`** updated: `Inputs consumed` no longer lists `docs/TASK_ANALYSIS.md`; new "Withdrawn input" line records the withdrawal.
  - **`docs/ai/sessions/S001-task-analysis.md`** updated with a "Status update (added by S003 D-14)" block noting the withdrawal; original handoff items struck through as superseded. The S001 snapshot itself is preserved for prompt-history transparency.

After D-14, the discovery doc is **internally consistent with the brief as the sole binding upstream source**, and the repo no longer contains a parallel scope document that PRD could be tempted to cite.

## AI outputs accepted

- `docs/discovery/NOTES.md` — full discovery notes per phase-gate schema, with explicit `OQ-*` and `A-*` IDs for open questions and assumptions, and a Discovery → PRD traceability table.

## AI outputs rejected or changed

- Initial impulse to ask three blocking questions (session ID, scope reconciliation, form factor). Form-factor question dropped because tech-spec is the right phase for it; only the first two were asked.

## Files changed

- `docs/discovery/NOTES.md` (new, then refined in two passes — D-13 dropped arrangement-journey scope; D-14 owned all FCA / vulnerability / timebox / mock-auth substance and removed all `docs/TASK_ANALYSIS.md` citations)
- `docs/TASK_ANALYSIS.md` (**deleted** in D-14)
- `docs/PRD_TEMPLATE.md` (D-14: removed `docs/TASK_ANALYSIS.md` from `Inputs consumed`; added "Withdrawn input" line)
- `.rulesync/commands/discovery.md` (D-14: removed `docs/TASK_ANALYSIS.md` from "Inputs to load"; added withdrawal note)
- `.rulesync/commands/prd.md` (D-14: removed `docs/TASK_ANALYSIS.md` from "Inputs to load"; added must-not-cite-or-reintroduce note)
- `docs/ai/sessions/S001-task-analysis.md` (D-14: added "Status update" block; struck through superseded handoff items)
- `docs/ai/sessions/S003-discovery.md` (new — this file; updated with D-13 and D-14)
- `docs/PROMPT_HISTORY.md` (S003 row appended; updated to reflect D-13 and D-14)

## Tests added or run

None. Discovery is a documentation-only phase per `.cursor/rules/00-workflow.mdc`.

## Handoff for next session

1. Run `/prd` to generate `docs/PRD.md` from `docs/discovery/NOTES.md`. Use `docs/PRD_TEMPLATE.md` as the canonical structure; per D-14 it no longer lists `docs/TASK_ANALYSIS.md` as an input (the doc was withdrawn). The brief and `docs/discovery/NOTES.md` are the only inputs.
2. The PRD is the source of truth for build scope. PRD ratifies `OQ-2` through `OQ-7` (direction-set in this session) by turning each into an `R*` requirement with acceptance criteria. `OQ-1` is **resolved** at discovery (D-13 / D-14) and the PRD must not reintroduce any of the dropped items listed in §7(b) of `docs/discovery/NOTES.md`: repayment-plan selection, arrangement confirmation, collections workflow, agent review processes, arrears-management tooling, repayment-arrangement booking, payment-plan confirmation, `POST /api/arrangements`, agent-facing console / override UI, or COps-specific payloads. PRD must also not cite the withdrawn `docs/TASK_ANALYSIS.md`. PRD can override any *direction-set* item; if it does, log the divergence in the PRD itself.
3. PRD must specify what discovery did **not** specify:
   - Exact band thresholds and copy for the affordability surface (`OQ-3`).
   - The "no previous snapshot" delta state (`OQ-3`).
   - Per-case behaviour and copy for the four edge cases (`OQ-4`).
   - Snapshot data shape and history-view behaviour (`OQ-2`).
   - Per-persona starting values for the 7-persona fixture set (`OQ-6`).
   - A persistence requirement at PRD level — "snapshots persist across restarts" — leaving the SQLite-class direction (`OQ-5`) for tech-spec to pin down.
   - Acceptance criteria for the submission-artefact requirement promoted in D-13 (`README` runs on a fresh clone, `DECISIONS.md` covers built / left-out / next-up, prompt history complete, time-spent recorded).
4. Tech-spec phase (later) inherits `OQ-5`'s SQLite direction and picks the specific ORM, schema, and DB file location, consulting `node_modules/next/dist/docs/` per `AGENTS.md`.
5. `OQ-7` direction is to label paraphrased FCA citations clearly; PRD inherits as-is. No verified-citation work unless a reviewer later requests it.
6. Suggested next session ID: **S004 — PRD generation**.
