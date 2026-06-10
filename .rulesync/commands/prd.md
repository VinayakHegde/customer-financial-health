---
description: "Generate or refine docs/PRD.md from committed discovery notes."
targets: ["*"]
---

# /prd

Generate or refine the Product Requirements Document.

This is **phase 2 of 5** in the workflow defined by `.rulesync/rules/00-workflow.md`. Do not produce a tech spec, test plan, or code in this command.

## Pre-checks (refuse if any fail)

- `docs/discovery/NOTES.md` exists and is non-trivial. If missing or empty, stop and instruct the user to run `/discovery` first.
- The discovery notes include explicit `Problem`, `Users`, and `Success signals` sections.

## Inputs to load

- `docs/discovery/NOTES.md` (required, primary source).
- `docs/Ophelos Engineering Take-Home Task.pdf` (the brief — cite directly for any requirement that traces to a brief MUST / SHOULD / Stretch).
- `docs/PRD.md` if it already exists (refine, preserving existing requirement IDs).

Note: a pre-brief analysis lived at `docs/TASK_ANALYSIS.md` and was withdrawn in S003 (D-14). The PRD must not cite the withdrawn doc and must not reintroduce its dropped scope items (see `docs/discovery/NOTES.md` §7(b)): repayment-plan selection, arrangement confirmation, collections workflow, agent review processes, arrears-management tooling, `POST /api/arrangements`, agent-facing UI.

## Output

Create or update `docs/PRD.md` with the phase-gate header (per `.rulesync/skills/phase-gate/SKILL.md`) and these sections:

1. **Problem statement** — derived from discovery; one paragraph.
2. **Users and jobs-to-be-done**.
3. **Goals** — outcomes we want; verifiable.
4. **Non-goals** — explicit list; this is mandatory, not optional.
5. **Requirements** — each item gets a stable ID (`R1`, `R2`, …), a one-line statement, a `Priority` (Must / Should / Could / Won't), and a one-line `Why` linking to discovery.
6. **Success metrics** — how we know each goal is met.
7. **Open questions** — `TBC` items that must be resolved before tech spec.
8. **Traceability table** — per the `phase-gate` skill.

## Rules

- Requirement IDs are append-only. Never re-number `R*` IDs across revisions; if a requirement is removed, mark it `R{n} — DROPPED (reason)` rather than reusing the ID.
- No requirement may exist without a discovery-source citation.
- If discovery has unresolved open questions that block requirement authoring, list them in **Open questions** and stop, rather than guessing.
