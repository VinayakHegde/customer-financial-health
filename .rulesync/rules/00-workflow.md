---
root: true
targets: ["*"]
description: "Gated five-phase AI workflow for this repo: discovery → PRD → tech spec → test plan → controlled implementation. Non-negotiable."
globs: ["**/*"]
cursor:
  alwaysApply: true
  description: "Gated five-phase AI workflow: discovery → PRD → tech spec → test plan → controlled implementation."
---

# AI workflow for this repository

This repo follows a strict five-phase pipeline. Every AI-assisted change must locate itself in one of these phases and respect the gate before it.

| # | Phase | Canonical artefact | Slash-command | Gate before next phase |
|---|---|---|---|---|
| 1 | Product discovery | `docs/discovery/NOTES.md` | `/discovery` | Discovery notes committed with problem, users, constraints, open questions |
| 2 | PRD generation | `docs/PRD.md` | `/prd` | PRD committed with requirement IDs (`R1`, `R2`, …) and explicit non-goals |
| 3 | Technical specification | `docs/TECH_SPEC.md` | `/tech-spec` | Tech spec committed; every section maps to one or more requirement IDs |
| 4 | Test-plan generation | `docs/TEST_PLAN.md` | `/test-plan` | Test plan committed; every PRD requirement is covered by at least one test case |
| 5 | Controlled implementation | source code + tests | `/implement <section-id>` | One tech-spec section at a time, with the matching tests landing in the same change |

## Non-negotiable rules

1. **Do not skip phases.** If a prior artefact is missing or empty, stop and tell the user which phase is missing. Offer to run the corresponding slash-command.
2. **Do not edit a later artefact to fix a gap in an earlier one.** Fix the earlier artefact first; downstream artefacts then re-derive from it.
3. **Controlled implementation = single-section scope.** `/implement` operates on exactly one `TECH_SPEC.md` section ID per invocation. Unrelated edits (formatting sweeps, opportunistic refactors, dependency bumps) belong in their own session.
4. **Every session is recorded** per the project's ai-history rule:
   - Raw transcript: SpecStory writes to `.specstory/history/`.
   - Curated snapshot: this agent maintains `docs/ai/sessions/SNNN-*.md` and appends to `docs/PROMPT_HISTORY.md`.
5. **No implementation-specific rules are in force yet.** Coding style, framework conventions, file layout, and test-runner choices are deferred until implementation actually begins. Until then, defer to `AGENTS.md` and to the in-repo Next.js docs under `node_modules/next/dist/docs/`.

## When in doubt

Ask the user which phase the current request belongs to before producing any artefact. It is always better to clarify the phase than to silently cross a gate.
