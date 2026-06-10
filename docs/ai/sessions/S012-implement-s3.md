# AI Session Snapshot: S012 — `/implement S3`

## Metadata

- Date: 2026-06-10
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `main`
- Start commit: `f929b44`
- Raw transcript: TBC (SpecStory)
- Related artefacts: `docs/TECH_SPEC.md` (S3), `docs/TEST_PLAN.md` (T13–T14), `docs/PRD.md` (R8)

## Goal of this Cursor window

Implement tech-spec slice **S3 — Persona fixtures + persona-cookie mock auth** with matching tests **T13–T14**.

## Scope restated (auditable)

| ID | Requirement |
|---|---|
| **R8** | 7-persona fixture set with per-persona starting £-values |
| **R4** | Tests protect real cases — persona shape validated in T13 |
| **S3** | `lib/personas.ts` (fixtures), `lib/identity/persona-cookie.ts`, DB seeding in `lib/db/client.ts` |
| **T13** | Persona fixtures shape — 7 entries, zod parse, riley excluded from seed |
| **T14** | Persona cookie helper — `getPersonaId()` via mocked `next/headers` |

## Decisions

- **D-67 — `getPersonasForSeeding()` filters out `riley`.** Exposes seed eligibility for T13 without coupling tests to DB internals.
- **D-68 — Global `next/headers` mock via `vitest-setup.ts`.** Biome import sorting caused T14 to load real `cookies()` before the helper mock; registering the mock at setup time matches the S7 `withPersonaCookie` strategy for all future Server Component / Action tests.
- **D-69 — Seeding logic extracted to `lib/db/seed.ts`.** Enables integration test without hitting the production `.data/` singleton.
- **D-70 — `withPersonaCookie` mock implements `cookies().set`.** Uses `PERSONA_COOKIE_NAME` from production module; T14 covers `setPersonaId`.

## Files changed

- `lib/identity/persona-cookie.ts` (new) — `getPersonaId`, `setPersonaId`
- `lib/personas.ts` — added `getPersonasForSeeding()`
- `lib/db/seed.ts` (new) — `seedStartingSnapshotsIfEmpty`
- `lib/db/client.ts` — calls seed on first repository open
- `tests/s3/t13-persona-fixtures.test.ts` (new)
- `tests/s3/t14-persona-cookie.test.ts` (new)
- `tests/s3/seed-on-empty-db.test.ts` (new) — closes TEST_PLAN §1 seed automation gap
- `tests/_helpers/withPersonaCookie.ts` — `cookies().set` + `PERSONA_COOKIE_NAME` alignment
- `vitest-setup.ts` — side-effect import of `withPersonaCookie` mock

## Tests run

- `npm test` — 56 passed (T13–T14 + seed integration + prior slices)
- `npm run lint` — pass
- `npm run typecheck` — pass

## Deviations from spec

| Item | Spec says | Delivered | Reason |
|---|---|---|---|
| Middleware redirect (`/dashboard*`, `/history` → `/`) | TECH_SPEC S3 design paragraph | **Deferred** | TEST_PLAN §1 assigns cookie redirect to manual integration; no `T*` in S3. Implement alongside S4 page routes or S8 persona selector. |

## Status

**Complete** — slice tests green; critic follow-ups applied; changes uncommitted on `main`.

## Handoff

Next slice per tech-spec §3 recommended order: **`/implement S9`** (reflection-not-advice framing, T43 + T32) before S4–S6 which import `<FramingNotice />`.

**S4/S8 inbox:** middleware redirect for unauthenticated dashboard/history visits.

Prompt for next session:

> S013 `/implement S9` — `lib/affordability/framing.ts` + `<FramingNotice />`; tests T43, T32.
