---
description: "Generate or refine docs/TEST_PLAN.md from the committed PRD and tech spec."
targets: ["*"]
---

# /test-plan

Generate or refine the test plan.

This is **phase 4 of 5** in the workflow defined by `.rulesync/rules/00-workflow.md`. Do not write production code in this command. Test fixtures are allowed only if the tech spec defines their shape.

## Pre-checks (refuse if any fail)

- `docs/PRD.md` exists with stable `R*` IDs.
- `docs/TECH_SPEC.md` exists with stable `S*` IDs and covers all `Must` requirements.

## Inputs to load

- `docs/PRD.md` (required).
- `docs/TECH_SPEC.md` (required).
- `docs/TEST_PLAN.md` if it already exists (refine, preserving existing test IDs).

## Output

Create or update `docs/TEST_PLAN.md` with the phase-gate header and these sections:

1. **Strategy** — short statement of test types in use (unit, integration, accessibility, E2E) and where each lives.
2. **Test cases** — each gets a stable ID (`T1`, `T2`, …) and the following fields:
   - `Type` — unit | integration | a11y | E2E.
   - `Covers` — one or more `R*` IDs.
   - `Touches` — one or more `S*` IDs.
   - `Given / When / Then` or table-driven inputs/outputs.
   - `Fixtures` — named synthetic fixtures, no real PII.
3. **Edge cases and adverse paths** — zero/negative disposable income, validation bypass attempts, accessibility on error states, etc., as relevant to the PRD.
4. **Coverage matrix** — every `R*` in the PRD appears at least once in some `T*`. Gaps are listed explicitly, not implied.
5. **Out of scope** — what is deliberately not tested (e.g. third-party libraries, framework internals).
6. **Traceability table** — per the `phase-gate` skill, mapping `T*` → `R*` and `T*` → `S*`.

## Rules

- Test IDs are append-only.
- No test case may exist without at least one `Covers: R*` link.
- If a `Must` requirement has no test case, list it under **Coverage matrix** as a gap and stop, rather than fabricating a token test.
