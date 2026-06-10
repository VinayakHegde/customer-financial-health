---
description: "Controlled implementation of exactly one tech-spec section, with its tests, in a single session."
targets: ["*"]
---

# /implement

Controlled implementation for tech-spec section: $ARGUMENTS

This is **phase 5 of 5** in the workflow defined by `.rulesync/rules/00-workflow.md`.

## Pre-checks (refuse if any fail)

- `$ARGUMENTS` is a single tech-spec section ID (e.g. `S3`). If empty or multiple, stop and ask the user to pick one.
- `docs/TECH_SPEC.md` contains a section with that exact ID.
- `docs/TEST_PLAN.md` contains at least one test case whose `Touches:` field includes that section ID.
- `docs/PRD.md` and `docs/TECH_SPEC.md` are committed (no uncommitted edits to either) — if they are dirty, ask the user to commit or stash first.

## Scope rules — non-negotiable

- Edit only code paths required by the named tech-spec section and its tests.
- Do **not** make drive-by changes elsewhere: no formatting sweeps, dependency upgrades, lint-rule edits, opportunistic refactors, or "while we're here" improvements. If something else is wrong, surface it and stop.
- The matching tests (per `docs/TEST_PLAN.md`) must land in the same change as the implementation. Implementation without tests in the same session is forbidden.
- If new fixtures are needed, they must match shapes already defined in the tech spec; otherwise update the tech spec first via `/tech-spec`.

## Process

1. Re-read the named tech-spec section and the test cases that touch it.
2. State the plan (files to add or edit, test files, expected commands) before writing code.
3. Implement, run the relevant tests, run `npm run lint` and `npm run typecheck`. Fix any failures inside the same scope.
4. Update the current `docs/ai/sessions/SNNN-*.md` snapshot with files changed, tests run, and any deviations from the spec (with reasons).
5. Update `docs/PROMPT_HISTORY.md` if a new commit is produced.

## Refusals

- If the user asks for a feature not covered by the tech spec, refuse and direct them to `/tech-spec`.
- If the user asks to bundle multiple sections in one invocation, refuse and ask which single section to do first.
