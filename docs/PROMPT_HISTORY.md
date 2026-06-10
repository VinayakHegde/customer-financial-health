# Prompt History

This project was built using Cursor with AI-assisted development.

Raw Cursor transcripts are stored in:

- `.specstory/history/`

Curated session snapshots are stored in:

- `docs/ai/sessions/`

| Session | Purpose | Raw transcript | Snapshot | Commit(s) | Outcome |
|---|---|---|---|---|---|
| S000 | Next.js scaffold | `.specstory/history/2026-06-10_10-20-18Z-next.js-app-setup-with-typescript-and-tailwind-css.md` | `docs/ai/sessions/S000-nextjs-scaffold.md` | `88f3124`, `d97043e`, `b8a98c8` | App scaffolded; snapshot renumbered S001→S000 in `be002b4`; lint/typecheck/build pass |
| S001 | Task analysis | `.specstory/history/2026-06-10_10-49-02Z-task-analysis-for-ai-session-s001.md` | `docs/ai/sessions/S001-task-analysis.md` | `a23e372`, `be002b4`, `4173435`, `1140f85` | `docs/TASK_ANALYSIS.md` on `docs/task-analysis`; analysis only, no app code. **Artefact withdrawn in S003 D-14** — pre-brief analysis scoped a collections / arrangement-journey workflow the brief does not ask for; useful substance inlined into `docs/discovery/NOTES.md`. Snapshot preserved for prompt-history transparency. |
| S002 | AI guardrails (Rulesync) | `.specstory/history/2026-06-10_11-12-19Z-minimal-rulesync-setup-for-product-development.md` | `docs/ai/sessions/S002-ai-guardrails.md` | `922468e`, `38b2148`, `52699ba`, `ac6ff05`, `70489e0`, `3f460ae` on `ai-guardrails` | Minimal Rulesync scaffold (2 rules, 5 phase commands, 1 critic subagent, 1 phase-gate skill) targeting Cursor + Claude Code; generated tool files gitignored; CLAUDE.md untracked; no implementation rules yet |
| S003 | Discovery pass (+ corrective refinement + withdrawal of TASK_ANALYSIS.md) | `.specstory/history/2026-06-10_13-29-42Z-ophelos-engineering-take-home-task.md`, `.specstory/history/2026-06-10_15-57-27Z-discovery-notes-refinement-based-on-prd.md` | `docs/ai/sessions/S003-discovery.md` | (in progress) on `main` | `docs/discovery/NOTES.md` produced per phase-gate schema; brief is binding; PRD is source of truth for build scope; **OQ-1 RESOLVED (D-13 / D-14)** — pre-brief arrangement-journey items dropped (repayment-plan selection, arrangement confirmation, collections workflow, agent review processes, arrears-management tooling, repayment-arrangement booking, payment-plan confirmation, `POST /api/arrangements`, agent console / override UI, COps-specific payloads); **D-14:** `docs/TASK_ANALYSIS.md` withdrawn (file deleted), all useful substance inlined into `docs/discovery/NOTES.md` as repo-owned paraphrases; `.rulesync/commands/{discovery,prd}.md` and `docs/PRD_TEMPLATE.md` updated to remove the withdrawn input; submission artefacts (`README`, prompt history, `DECISIONS.md`, time-spent) promoted to first-class success signals + constraints; **OQ-2 through OQ-7 direction-set** — per-submission immutable snapshots; disposable + band + explainer + delta; canonical 4-case edge set; SQLite via lightweight ORM (snapshot history only; tech-spec picks ORM); 7-persona fixture set (surplus / breakeven / shortfall / zero-income / new-customer / irregular-income / joint-income); FCA paraphrases owned by NOTES.md and labelled "not independently verified" |
