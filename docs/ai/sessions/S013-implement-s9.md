# AI Session Snapshot: S013 — `/implement S9`

## Metadata

- Date: 2026-06-10
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `main`
- Start commit: `c1ab6ed`
- Raw transcript: TBC (SpecStory)
- Related artefacts: `docs/TECH_SPEC.md` (S9), `docs/TEST_PLAN.md` (T43, T32), `docs/PRD.md` (R6, R9, R18, R20)

## Goal of this Cursor window

Implement tech-spec slice **S9 — Reflection-not-advice framing** with matching tests **T43** and **T32**.

## Scope restated (auditable)

| ID | Requirement |
|---|---|
| **R20** | Reflection-not-advice framing on every outcome screen |
| **R6** | Tone appropriate for difficulty — framing copy guarded |
| **R9** | Clarity of what the result is and is not |
| **R18** | Accessible notice (landmark, contrast, focus, target size) |
| **S9** | `lib/affordability/framing.ts` (exists from S1) + `components/FramingNotice.tsx` |
| **T43** | Framing copy guard — negation phrase + tone/advice token scan |
| **T32** | FramingNotice render — `<aside aria-labelledby>`, support link, axe clean |

## Decisions

- **D-71 — `framingAdviceForbiddenTokens` excludes `"financial advice"`.** T43 must allow the required negation phrase in the body while still scanning for advice-implying language; tech-spec S9 names a narrower R20 guard set than the full `adviceImplyingTokens` list used by T29 on `copy.ts`.
- **D-72 — Vitest-native attribute assertions in T32.** `@testing-library/jest-dom` is not installed; `getAttribute()` checks match the rest of the suite.
- **D-73 — Known test limits after S013 critic follow-up.** R9 (clarity beyond negation) and WCAG SC 2.5.8 (24×24 CSS px target) are not directly asserted — T32 relies on axe smoke + CSS classes on the link; a human reviewer walkthrough closes the gap in MVP. R9 proxy: T43 negation substring + body copy visible in T32.

## Files changed

- `components/FramingNotice.tsx` (new) — sync presentational component
- `tests/s9/t43-framing-copy-guard.test.ts` (new; critic follow-up: TECH_SPEC S9 comment + href scan)
- `tests/s9/t32-framing-notice.test.tsx` (new; critic follow-up: `aria-labelledby` ↔ heading id, body text)
- `tests/_helpers/forbiddenToneTokens.ts` — added `framingAdviceForbiddenTokens`

## Tests run

- `npm test` — 58 passed (T43, T32 + prior slices; re-run after critic follow-up)
- `npm run lint` — pass
- `npm run typecheck` — pass

## Critic follow-up

- `@critic` verdict: **Minor fixes** — applied top-3 items (T32 wiring assertions, T43 spec alignment, D-73 known limits).

## Deviations from spec

| Item | Spec says | Delivered | Reason |
|---|---|---|---|
| R9 clarity | Explicit test coverage | Negation + rendered body only | TEST_PLAN has no dedicated R9 assertion for framing; proxy via T43/T32 |
| SC 2.5.8 target size | 24×24 px minimum on support link | CSS `min-h-6 min-w-6`; not measured in tests | Axe does not enforce target size; accepted MVP limit (D-73) |

## Status

**Closed** — user confirmed S013 complete. Slice tests green; critic follow-up applied; changes uncommitted on `main`.

## Handoff

Next slice per tech-spec §3 recommended order: **`/implement S4`** (`<DashboardView />` renders `<FramingNotice />`; T21, T22, T23, T28 partial).

Prompt for next session:

> S014 `/implement S4` — `<DashboardView />` + dashboard route; tests T21–T23, T28 (dashboard half).
