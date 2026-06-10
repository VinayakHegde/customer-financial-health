---
description: "Run a structured product-discovery pass and append findings to docs/discovery/NOTES.md."
targets: ["*"]
---

# /discovery

Conduct or continue product discovery for: $ARGUMENTS

This is **phase 1 of 5** in the workflow defined by `.rulesync/rules/00-workflow.md`. Do not produce a PRD, tech spec, test plan, or code in this command — discovery only.

## Inputs to load

- `docs/TASK_ANALYSIS.md` if present.
- `docs/discovery/NOTES.md` if it already exists (append/refine, don't overwrite).
- Anything the user has linked in the current message.

## Output

Create or update `docs/discovery/NOTES.md` using the schema from the `phase-gate` skill (`.rulesync/skills/phase-gate/SKILL.md`) with these sections:

1. **Problem** — what specifically is being solved and for whom; cite source material.
2. **Users** — primary, secondary, tertiary; vulnerabilities and constraints relevant to FCA-regulated lending.
3. **Why now** — what triggers the work; what changes if we don't ship it.
4. **Success signals** — observable outcomes (customer, regulatory, business).
5. **Constraints** — regulatory (FCA Consumer Duty / CONC), data-protection (UK GDPR), timebox, tech stack.
6. **Assumptions and open questions** — explicit `TBC` list. This is the **only** acceptable place to park unknowns.
7. **Out of scope (for now)** — what we are deliberately not discovering this pass.

## Process

1. Ask the user any blocking questions **before** writing. Maximum three at a time.
2. Draft the notes; do not invent regulatory references or user research.
3. End with a traceability table per the `phase-gate` skill.

## Refusals

- If the user asks you to also produce a PRD in this command, refuse and direct them to `/prd` after discovery is committed.
