---
name: phase-gate
description: >-
  Shared schema for every phase artefact in this repo (discovery notes, PRD, tech spec, test plan). Load this
  skill before writing or editing any document in docs/ so the header, gate-criteria block, and traceability
  table stay consistent across phases. Activate whenever the work involves docs/discovery/NOTES.md, docs/PRD.md,
  docs/TECH_SPEC.md, or docs/TEST_PLAN.md.
targets: ["*"]
---

# phase-gate

Every phase artefact in this repo starts with the same header and ends with the same traceability table. Use the templates below verbatim, filling in the bracketed placeholders.

## Header (top of every phase document)

```
# [Document title]

> **Phase:** [Discovery | PRD | Tech spec | Test plan]
> **Inputs consumed:** [list of upstream artefact paths, or "none — first phase"]
> **Gate criteria for next phase:**
> - [criterion 1, e.g. "All Must requirements have IDs"]
> - [criterion 2]
> - [criterion 3]
> **Status:** [Draft | Ready for review | Committed]
```

## Traceability table (bottom of every phase document)

Use the table that matches the current phase. Always include it — even an empty table with `_None yet_` is preferable to omission.

### Discovery → PRD

| Discovery insight | Likely PRD requirement | Notes |
|---|---|---|
| [short phrase] | [draft R-ID or "TBC"] | [why this matters] |

### PRD → tech spec

| Requirement ID | Title | Tech-spec section ID | Notes |
|---|---|---|---|
| R1 | … | S1 | … |

### Tech spec → test plan

| Tech-spec section ID | Requirement IDs covered | Test case IDs | Notes |
|---|---|---|---|
| S1 | R1, R2 | T1, T3 | … |

### Test plan → implementation

| Test case ID | Requirement IDs | Tech-spec section IDs | Status |
|---|---|---|---|
| T1 | R1 | S1 | Pending |

## ID conventions

- `R*` — PRD requirement IDs. Append-only.
- `S*` — tech-spec section IDs. Append-only.
- `T*` — test case IDs. Append-only.
- Dropped items keep their ID and gain a `— DROPPED (reason)` suffix; never reuse a retired ID.

## Anti-patterns to refuse

- Writing a phase document without the header block.
- Writing a phase document without the traceability table.
- Renumbering existing `R*`, `S*`, or `T*` IDs to "tidy up".
- Filling a phase document with content the upstream artefacts do not support — leave a `TBC` instead.

## When to load this skill

Load and follow this skill at the start of any work touching:

- `docs/discovery/NOTES.md`
- `docs/PRD.md`
- `docs/TECH_SPEC.md`
- `docs/TEST_PLAN.md`

Each of the five phase slash-commands (`/discovery`, `/prd`, `/tech-spec`, `/test-plan`, `/implement`) references this skill instead of restating the schema.
