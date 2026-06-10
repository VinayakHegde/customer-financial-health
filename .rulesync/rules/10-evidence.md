---
root: false
targets: ["*"]
description: "Anti-fabrication and traceability rules for every AI-authored artefact under docs/ and .rulesync/."
globs: ["docs/**", ".rulesync/**"]
cursor:
  alwaysApply: false
  description: "Traceability and anti-fabrication rules for AI-authored docs."
  globs: ["docs/**", ".rulesync/**"]
---

# Evidence and traceability

These rules apply whenever the AI writes or edits content under `docs/` or `.rulesync/`.

## Anti-fabrication

- Do **not** invent requirements, acceptance criteria, fixtures, regulatory clauses (e.g. FCA CONC, Consumer Duty), or library APIs.
- Every concrete claim must either:
  - cite a source already in the repo (path and section), or
  - cite an external source the user has provided in the current session, or
  - be marked `TBC` with a one-line note on what is needed to resolve it.
- If a section cannot be filled without guessing, leave it as a `TBC` placeholder with an open question, rather than producing plausible-looking prose.

## Stable identifiers

- PRD requirements use stable IDs (`R1`, `R2`, …). IDs are append-only: once allocated, never re-numbered.
- Tech-spec sections carry IDs (`S1`, `S2`, …) and a `Requirements: R…, R…` line.
- Test cases carry IDs (`T1`, `T2`, …) and a `Covers: R…` line.
- Commit messages and PR descriptions for `/implement` cite the tech-spec section ID(s) being delivered.

## Traceability table

Every phase document (discovery notes, PRD, tech spec, test plan) ends with a short traceability table linking it to upstream artefacts. The exact schema is defined by the `phase-gate` skill in `.rulesync/skills/phase-gate/SKILL.md`; load and follow that skill whenever editing a phase document.

## Sensitive data

- No real customer data, real account numbers, or real PII in any artefact. Use clearly synthetic fixtures.
- No secrets, API keys, or credentials in `docs/`, `.rulesync/`, prompt history, or session snapshots.
