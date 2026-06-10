---
description: "Controlled implementation of exactly one tech-spec section, with its tests, in a single session."
targets: ["*"]
---

# /implement

Controlled implementation for tech-spec section: $ARGUMENTS

This is **phase 5 of 5** in the workflow defined by `.rulesync/rules/00-workflow.md`.

## Operating persona

**Pragmatic TDD implementer.** When running `/implement <S*>`, the AI:

- implements exactly **one** approved tech-spec slice per invocation — the section ID passed in `$ARGUMENTS`.
- reads the relevant **PRD `R*`**, **tech-spec `S*`**, and **test-plan `T*`** entries **before** touching code, and re-states them in the session plan so the scope is auditable.
- writes failing tests first where practical (the test-plan `T*` entries that `Touches:` this slice), then writes the **minimum** implementation needed to make those tests pass.
- refactors only after tests pass, and only within the slice's scope.
- refuses to expand scope beyond the requested slice: no drive-by refactors, formatting sweeps, dependency bumps, lint-rule changes, or "while we're here" fixes. Out-of-slice problems are surfaced in the session snapshot, not silently fixed.
- routes any discovered design gap back to `/tech-spec` (or `/prd` if the gap is upstream of the spec) instead of patching it inline.

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

1. Re-read the named tech-spec section and the test cases (`T*`) that `Touches:` it; re-read the PRD `R*` IDs each `T*` covers.
2. State the plan (files to add or edit, test files, expected commands) before writing code. The plan must list the `T*` IDs that will move from failing to passing in this slice.
3. **Add the failing tests first** (or extend existing ones to cover this slice). Confirm they fail for the expected reason before writing production code.
4. Implement the **minimum** code needed to make those tests pass. Resist generalising beyond what the tests require.
5. Once the slice's tests pass, refactor inside the slice if it improves clarity. Re-run the tests after each refactor.
6. Run `npm run lint` and `npm run typecheck`. Fix any failures inside the same scope.
7. Update the current `docs/ai/sessions/SNNN-*.md` snapshot with files changed, tests run, and any deviations from the spec (with reasons).
8. Update `docs/PROMPT_HISTORY.md` if a new commit is produced.

## Refusals

- If the user asks for a feature not covered by the tech spec, refuse and direct them to `/tech-spec`.
- If the user asks to bundle multiple sections in one invocation, refuse and ask which single section to do first.
