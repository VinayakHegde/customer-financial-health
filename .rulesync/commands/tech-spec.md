---
description: "Generate or refine docs/TECH_SPEC.md from the committed PRD."
targets: ["*"]
---

# /tech-spec

Generate or refine the technical specification.

This is **phase 3 of 5** in the workflow defined by `.rulesync/rules/00-workflow.md`. Do not produce a test plan or code in this command.

## Operating persona

**Pragmatic solution designer.** When running `/tech-spec`, the AI:

- translates approved PRD requirements into the **smallest** technical design that satisfies them.
- prioritises traceability (`S*` → `R*`), simplicity, testability, and implementation sequencing.
- avoids enterprise-style abstractions the PRD does not justify: no CQRS, no event sourcing, no microservices, no speculative service layers, no premature interfaces, no "future-proof" extension points.
- treats each `S*` section as an **implementation slice** — a unit of work small enough to land in a single `/implement` session together with its tests.
- defers anything that cannot be reduced to a concrete decision to **Out of scope** or **Trade-offs and alternatives considered**, rather than designing for hypothetical futures.
- routes true requirement gaps back to `/prd` (per workflow rule 2) instead of silently inventing requirements in the spec.

## Pre-checks (refuse if any fail)

- `docs/PRD.md` exists and has at least one `Must` requirement.
- All `Open questions` in `docs/PRD.md` that affect architecture, data shape, or external integrations are resolved (or explicitly flagged as deferred-with-impact).

## Inputs to load

- `docs/PRD.md` (required, primary source).
- `docs/TECH_SPEC.md` if it already exists (refine, preserving existing section IDs).
- `AGENTS.md` for project-wide constraints.
- For any Next.js-specific decisions, read the relevant guide under `node_modules/next/dist/docs/` first — this version may differ from training data.

## Output

Create or update `docs/TECH_SPEC.md` with the phase-gate header and these sections:

1. **Overview** — chosen approach in one paragraph.
2. **Architecture** — modules and their responsibilities; a small diagram (ASCII or mermaid) if it aids comprehension.
3. **Implementation slices** — each gets a stable ID (`S1`, `S2`, …), a `Requirements: R…` line, a brief design, data shapes, error and edge handling, and security/privacy notes where relevant. Each slice must be small enough to land in a single `/implement` session with its tests; if it isn't, split it.
4. **Cross-cutting concerns** — validation strategy, server-vs-client authority, observability, data hygiene.
5. **Trade-offs and alternatives considered** — short ADR-style entries.
6. **Out of scope** — what this spec does not cover and why.
7. **Traceability table** — per the `phase-gate` skill, mapping `S*` → `R*`.

## Rules

- Every `S*` slice must cite at least one `R*` ID from the PRD.
- Every `Must` requirement in the PRD must be covered by at least one `S*` slice. Coverage gaps must be listed under **Open questions**, not silently ignored.
- Section IDs are append-only.
- Do not introduce dependencies, runtime services, external integrations, or architectural layers that the PRD does not justify. If a slice is tempted to add one, record it under **Trade-offs and alternatives considered** with the reason it was rejected, kept minimal, or escalated back to `/prd`.
