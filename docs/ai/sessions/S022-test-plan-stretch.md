# AI Session Snapshot: S022 — `/test-plan` for S10 / S11 / S12

## Metadata

- Date: 2026-06-11
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `feat/s020-tech-spec-stretch-addendum` (continuation of S021's branch — `docs/TECH_SPEC.md` rev 5.1 is the input)
- Start commit: `e3dccc8` (S021 close-out — `docs/TECH_SPEC.md` revision 5.1 committed, append-only stretch-blocker round)
- End commit: (uncommitted at session close — `docs/TEST_PLAN.md` extension + this snapshot + `docs/PROMPT_HISTORY.md` row)
- Raw transcript: SpecStory writes one file per Cursor window on close (see `.specstory/history/` for the matching file)
- Related artefacts: `docs/PRD.md` (R11, R12, R13, R19, R6, R7, R10, R18, R20), `docs/TECH_SPEC.md` (S10, S11, S12 — revision 5.1), `docs/TEST_PLAN.md` (extension: T46–T76 appended)

## Phase

Phase 4 of 5 (test plan) — second invocation of `/test-plan`. The first invocation (S008) generated T1–T45 for the MVP slices S1–S9; this invocation generates T46–T76 for the stretch slices S10–S12. The `/implement` gate for stretch is moved from "dormant" to "designed-conditional" because every stretch `T*` now exists with explicit `R*` + `S*` citations and is `Pending (stretch)` in §7.

## Goal of this Cursor window

Run `/test-plan` (phase 4 of 5) restricted to the three stretch slices the S020 addendum + S021 close-out produced:

- **S10** — currency and country_code with migrations (R11, R19)
- **S11** — secure time-limited statement sharing (R12, R19)
- **S12** — PDF export (R13, R19)

The user's instruction was scoped: extend `docs/TEST_PLAN.md` with the `T*` rows for S10 / S11 / S12 only. Do not touch the MVP rows (T1–T45) or any upstream artefact. Do not skip phases. Append-only.

## Scope restated (auditable)

| ID | Requirement |
|---|---|
| **R11** | `currency` and `country_code` fields + migrations (Could, Stretch) |
| **R12** | Secure time-limited statement-share link (Could, Stretch) |
| **R13** | PDF export of the statement with appropriate branding (Could, Stretch) |
| **R19** | Stretch items tested to R4 standard if delivered (Should, conditional) |
| **R6 / R7 / R10 / R18 / R20** | Inherited into stretch surfaces via the conscious-broadening readings already recorded in tech-spec §S11 / §S12 / §7 (S020 + S021 rounds) — `<SharedStatementView />` is a read-only outcome surface; the PDF is a read-only outcome surface; `<ShareUnavailable />` is **not** an outcome surface (T65 asserts framing notice absent) |
| **S10** | `lib/affordability/format.ts`, migration adds `currency`/`country_code` defaults, `Snapshot` type extension |
| **S11** | `lib/share/token.ts` + `lib/share/resolve.ts` + `lib/share/clock.ts` + `lib/db/share-links.ts` + `app/dashboard/share/actions.ts` + `app/(share)/share/[token]/page.tsx` + `<SharedStatementView />` + `<ShareUnavailable />` + `<ShareSnapshotForm />` + `middleware.ts` matcher on `/share/*` |
| **S12** | `app/dashboard/snapshot/[id]/pdf/route.ts` + `lib/pdf/SnapshotPdf.tsx` + `lib/pdf/render.ts` (wraps `renderToBuffer` from `@react-pdf/renderer`) |

## Decisions

- **D-176 — Pre-checks pass.** PRD has stable R11 / R12 / R13 / R19. Tech-spec has stable S10 / S11 / S12 at revision 5.1 (S021 close-out). Inputs documented in the test plan header `Inputs consumed:` line.
- **D-177 — Append-only ID range starts at T46.** T15–T17 stay `Reserved` per the existing §1 "Skipped test IDs" paragraph. The S021 handoff nominated T15–T17 as natural stretch insertion points, but `/test-plan` (S022) chose to **keep them reserved** and append from T46 to preserve a strict-append-only read of the §7 status table and avoid intermixing MVP and stretch IDs in the lower decimal range. Recorded explicitly in §1.
- **D-178 — 31 new test rows lifted directly from tech-spec §3 commitments.** T46–T51 (S10) = 6 rows; T52–T67 + T76 (S11) = 17 rows; T68–T75 (S12) = 8 rows. Total stretch rows = 31. T76 is appended to the end of the §3 S11 subsection (after T67) rather than slotting numerically between T67 and T68 — keeps `<ShareUnavailable />` tone-guard physically adjacent to T65 (`<ShareUnavailable />` render) in the §3 reading order without renumbering anything.
- **D-179 — R19 cited on every stretch row.** Every T46–T76 row's `Covers:` list includes R19 in addition to the feature `R*` (R11 / R12 / R13). The §1 strategy paragraph adds an "R19 discipline" subsection that mirrors the existing "R4 discipline (F7.6)" wording — branch matrix + validation + repository round-trip + logging hygiene + a11y per slice, not happy-path-only.
- **D-180 — Two stretch-wide guardrails enforced in §1, not in individual rows.**
  - **R10 application-code scope.** Stretch logging-hygiene rows (T51, T67, T74) spy on `console.*` only. The bearer-token-in-URL (S11) and snapshot-id-in-URL (S12) leak into Next.js / proxy / CDN access logs is a known limitation per tech-spec §5 "S11 + S12 access-log limitation under R10"; **no `T*` asserts against that layer** (recorded in §6 as well).
  - **S12 presence-not-layout.** Stretch PDF rows (T72, T73) assert required-content presence via a text-extraction helper. No `T*` asserts pixel layout, font kerning, line-wrap, page count, byte-for-byte equality, or tagged-PDF semantic structure (carried out per tech-spec §6 + §5 trade-off "S12 no tagged-PDF").
- **D-181 — F1.1 (S021 Blocker) closure mirrored at test-plan layer.** T61 asserts headers against the project-root `middleware.ts` function directly (single middleware-unit assertion); the four `/share/*` arms (unknown / expired / snapshot-row-missing / happy-path) share header parity **structurally** because the middleware matches on pathname not on resolver outcome. Negative arms (`/`, `/dashboard*`, `/history`, `/dashboard/snapshot/<id>/pdf`) pass through with no `Cache-Control: no-store` / no `X-Robots-Tag` — locks in the middleware's matcher scope. T62 (`generateMetadata` robots meta) is a separate row covering the HTML-only-reader fallback.
- **D-182 — F1.3 + F1.8 (S021) closure mirrored at test-plan layer.** T64 and T65 assert the **subtree-scoped** persona-leak DOM contract (`<SharedStatementView />` + `<ShareUnavailable />` + `(share)/layout.tsx`); zero elements whose `href`, `aria-label`, or rendered text references a persona id / persona label / `/dashboard` / `/dashboard/update` / `/history`. Plus a static `Read`-and-scan assertion against the two `app/(share)/**` files for "does not import `<AppHeader />`" — structural absence is the load-bearing assertion, not a per-render check.
- **D-183 — Three sub-cases for persona-cookie validation, matching tech-spec §S11 + §S12 wording.** T58 (S11) and T71 (S12) each carry three sub-cases — cookie absent (`withPersonaCookie` helper not invoked), cookie present empty (`withPersonaCookie('')`), cookie present not-a-persona (`withPersonaCookie('does-not-exist')`). "Cookie absent" is the absence of the helper call, NOT `withPersonaCookie(null)` — closes the S021-fix F1.9 wording at the test-plan layer.
- **D-184 — Three resolver miss arms collapse to a single `null` (T60).** Tech-spec §S11 commits `resolveShare(token, now)` to return `null` for all three of: unknown token, expired token, snapshot-row-missing. T60 has three sub-cases, all asserting `=== null`, plus a cross-arm equality assertion (`return value is strictly equal across the three arms`). The wire-level same-response posture is then asserted at the render layer (T64 / T65) and the header layer (T61).
- **D-185 — Two clock-mock styles must both pass (T55).** Tech-spec §S11 leaves the choice between `vi.mock('@/lib/share/clock', ...)` (module mock) and `vi.useFakeTimers(); vi.setSystemTime(...)` (fake-timers) to `/implement S11` per file. T55 codifies that **both** styles must produce identical fixture behaviour — `expiresAt = pinned + 24h` and the resolver's expired-branch firing deterministically. Keeps the test plan from over-pinning a choice that belongs in `/implement`.
- **D-186 — PDF text extraction is a presence assertion only (T72, T73).** Per tech-spec §S12 test-scope note: PDF rows use a text-extraction helper (e.g. `pdf-parse` or `pdfjs-dist`'s `getTextContent`) to extract the rendered text from the `Buffer` and then `.toContain(...)` against the expected substrings — band labels, disposable figure, "not financial advice" phrase, money strings. No `.toEqual(...)` against pinned layouts. Helper module is `tests/_helpers/pdfText.ts`; defined when `/implement S12` runs.
- **D-187 — `<ShareUnavailable />` (S11) deliberately excluded from R20 + R7.** T65 asserts the framing notice and signpost are **absent** from `<ShareUnavailable />`. Mirrors S007 round-2 F2.1 narrowing of S9 to outcome screens; `<ShareUnavailable />` carries no outcome, so neither R20 nor R7 attaches there (recorded in §5 R20 row notes + tech-spec §S11).
- **D-188 — R6 stretch tone guard gets its own `T*` (T76) rather than extending T29.** T29 is `Implemented` and append-only; extending its scope would silently broaden a passing test. T76 is a new row scoped specifically to `<ShareUnavailable />`'s single new copy string (the only stretch surface that adds tone-bearing copy). S12 contributes no new copy strings (PDF reuses S1 `copy.ts` + S9 `framing.ts` per tech-spec §7 R6 row), so no S12 tone guard is allocated.
- **D-189 — Stretch fixtures live in §2.3, distinct names.** New §2.3 subsection lists `snapshotJordanStoredGbp`, `snapshotPatStoredGbp`, `pinnedNowUtc`, `nowJustAfterExpiry`, `shareTokenPinned`, `shareLinkRowJordan`, `formattedJordanDisposable`, `pdfTextExtractor`, `shareUnavailableCopySample`, `mockClock`. `share*` / `pdf*` / `pinned*` prefixes are deliberately distinct from the MVP fixture names so an import-graph reader can tell at a glance which slice a test belongs to. Persona-to-stretch applicability table mirrors §2.1's persona-to-branch table. `riley` is flagged as having no stored snapshot (no S11 mint possible).
- **D-190 — §6 stretch out-of-scope items mirror tech-spec §6 carry-outs.** Added explicit "out of scope" bullets for: framework / proxy / CDN access logs; S11 single-use semantics; S11 revocation UI; S11 rate limiting; S11 wire-layer timing side-channel; S12 tagged-PDF / SC 1.3.1 + 1.3.2; S12 pixel layout / kerning / line wrap / byte equality; S11 ↔ S12 cross-integration; `@react-pdf/renderer` library verification (an `/implement S12` pre-check, not a runtime test); coercion / forwarded-under-pressure consent; React `useActionState` runtime for `<ShareSnapshotForm />`; async Server Component page integration; async Route Handler binding. Each bullet cross-references the originating tech-spec §5 trade-off or §6 entry.
- **D-191 — §7 traceability table extended with three new tech-spec → test-plan rows (S10 / S11 / S12) and 31 new test-plan → implementation status rows (T46–T76, all `Pending (stretch)`).** New status value `Pending (stretch)` documented in the status-values legend alongside the existing `Implemented` / `Pending (manual)` / `Reserved`.
- **D-192 — Header status bumped + stretch gate clause added.** `Status:` line records the S022 stretch extension and the choice to keep T15–T17 reserved. A new gate-criteria bullet is added under "Stretch gate (R19, conditional)": every `T*` row owned by a delivered stretch ships alongside its code; no row falls back on the framework / access-log layer; no row asserts PDF pixel layout. The existing MVP gate criteria (Must / Should / forbidden tokens / no-E2E / no-`useActionState`-runtime) are unchanged.

## Files changed

- `docs/TEST_PLAN.md` — extended:
  - Header `Inputs consumed:` line cites S10 / S11 / S12 at revision 5.1; `Status:` line records the S022 stretch extension; new gate-criteria bullet for stretch.
  - §1 Strategy — appended "R19 discipline (stretch addendum, S022)" subsection with the two stretch-wide guardrails (R10 application-code scope; S12 presence-not-layout); reworded §1 "Skipped test IDs" paragraph to record the T15–T17-stay-reserved decision (D-177).
  - §2 — appended §2.3 stretch fixtures with synthetic-data + integer-pence discipline; persona-to-stretch applicability table; a separate stretch tone-token guard note.
  - §3 — three new top-level subsections inserted before the existing "Cross-cutting" subsection:
    - **S10 (stretch)** — T46–T51 (migration / default backfill / repository round-trip / `formatMoney` helper / integer-pence invariant / logging hygiene).
    - **S11 (stretch)** — T52–T67 + T76 (token / migration / repository round-trip + expiry / clock helper / Server Action happy + ownership + persona validation / resolver happy + three miss arms collapse / middleware headers / `generateMetadata` robots / no-static-render scan / `<SharedStatementView />` + `<ShareUnavailable />` + `<ShareSnapshotForm />` render + a11y + persona-leak DOM contract / logging hygiene application-code scope / `<ShareUnavailable />` copy tone guard).
    - **S12 (stretch)** — T68–T75 (Route Handler `runtime` / happy-path response shape / cross-persona 404 parity / persona validation missing + invalid / `renderSnapshotPdfToBuffer` smoke + outcome-state content coverage / `formatMoney` integration / logging hygiene application-code scope / no-file-write spy).
  - §4 — appended "Stretch edge cases (S10 / S11 / S12)" table with 17 scenarios mapping to T* rows.
  - §5 coverage matrix — R11 / R12 / R13 rows moved from `Gap (intentional)` to listing T46–T75; R19 row moved from `Gap (conditional)` to listing T46–T76; R20 row extended with stretch broadening note (T64 + T72, with `<ShareUnavailable />` exclusion called out); gate-criteria paragraphs updated (Must / Should / Stretch).
  - §6 Out of scope — appended "Stretch (S10 / S11 / S12) — additional out-of-scope items" subsection (13 bullets mirroring tech-spec §6 + §5 trade-offs).
  - §7 traceability — added three rows to the tech-spec → test-plan table (S10 / S11 / S12); status legend extended with `Pending (stretch)`; status table extended with 31 new T* rows (T46–T76).
- `docs/ai/sessions/S022-test-plan-stretch.md` — new (this file).
- `docs/PROMPT_HISTORY.md` — S022 row appended.

## AI outputs accepted

- 31 new `T*` rows (T46–T76) covering S10 / S11 / S12.
- Two stretch-wide guardrails recorded in §1 (R10 application-code scope; S12 presence-not-layout) instead of being asserted per-row — keeps the §3 row text legible.
- T15–T17 stay `Reserved`; the append-only discipline reads as strict.
- §7 status legend gains `Pending (stretch)` as a fourth value.

## AI outputs rejected or changed

- **Rejected:** allocating T15 / T16 / T17 to S10 / S11 / S12 anchors. The S021 handoff suggested it; this session preferred strict append-only continuation from T46 (D-177).
- **Rejected:** extending T29 to cover `<ShareUnavailable />` copy. T29 is `Implemented`; broadening it silently would change a passing test's scope. T76 is a new row instead (D-188).
- **Rejected:** asserting PDF pixel layout / byte equality / page count. Tech-spec §S12 test-scope note forbids it; T72 / T73 are presence-only assertions (D-180, D-186).
- **Rejected:** asserting against framework / proxy / CDN access logs. Tech-spec §5 + §6 record this as a known limitation; T67 / T74 are application-code-only (D-180).
- **Rejected:** allocating a `T*` against `<ShareUnavailable />` carrying `<FramingNotice />`. T65 asserts the framing notice is **absent** there (D-187).

## Tests added or run

None executed. Test plan is documentation-only (phase 4). All 31 new rows are `Pending (stretch)` until `/implement S10` / `S11` / `S12` runs.

The existing MVP suite (131 tests across T1–T14, T18–T45) is unchanged; not re-run because no executable code changed.

## Deviations from spec

None. Every `T*` row in §3 is lifted directly from the corresponding tech-spec §3 "Tests (R19)" bullet in rev 5.1; no row commits behaviour beyond what S10 / S11 / S12 already promise. Cross-references to tech-spec subsections are kept tight so reviewers can trace each `T*` back to its design-level commitment.

## `@critic` round (same session, post-draft)

After the draft above was written, the user invoked `@critic` against `docs/TEST_PLAN.md` with respect to `docs/TECH_SPEC.md`. Verdict: **Minor fixes** — no Blockers; all six F1.x stretch-accuracy checks pass (F1.1 middleware-unit + parity + negatives; F1.3 + F1.8 subtree-scoped DOM contract + import-graph; F1.9 cookie-absent reframe; F1.12 tagged-PDF exclusion; F1.13 vacuous-snapshots drop; F1.2 cross-arm `=== null`). Critic transcript: agent `2ae20b0d-c13e-4fac-adfa-34d6392a9cb0` (returned summary in user-visible high-level summary across two re-emit prompts).

Eleven findings + two suspicion-flagged items + twelve consciously-not-raised items. User chose **apply all 11**, with the constraint "do not deviate from the original PRD and requirement doc". Every fix below was cross-checked against PRD R1–R20 and tech-spec rev 5.1 to confirm it is a bookkeeping / clarification / narrowing edit — no new behavioural scope, no new `R*`, no new `S*`. Decisions D-193 → D-203 record the closure.

### Critic findings closed

| ID | Severity | Headline | Closure |
|---|---|---|---|
| **F1.1 + F2.1** | Should-fix | R7 broadening to S12 PDF unasserted in T72 | **D-193** — T72 Covers extended to `R13, R19, R20, R7`; Touches extended to add S4; GWT bullet 4 added asserting the support-signpost copy block plus `"/support"` URL substring appear in the extracted PDF text (per tech-spec §S12 design bullet 11 + §7 R7 row). §7 status row for T72 reconciled. |
| **F1.2** | Nit | T72 no-data `reasons[]` skip-note rationale contradictory | **D-194** — T72 GWT bullet 5 rewritten to explain the no-data exemption clearly (S1 commits `reasons[]` to a single placeholder phrase; T1 / T21 already cover the no-data reasons content; T72 does not re-assert it through the PDF surface). |
| **F2.2** | Nit | T63 missing R10 citation | **D-195** — T63 Covers extended to `R12, R10, R19`; closing sentence cites the tech-spec §S11 R10 + R12 conscious reading (accidental static pre-rendering of `/share/[token]` would let third-party caches retain shared content, which the joint broadening disallows). §7 status row reconciled. |
| **F4.1** | Should-fix | T50 static-source `/ 100` scan over-commits beyond tech-spec §S10 promise | **D-196** — T50's static-source-scan half dropped. Runtime persona-fixture `Number.isInteger(...)` half kept and extended to also exercise `Delta.disposableDeltaPence` (per tech-spec §S10 "Integer-pence invariant" bullet — `5% × income` comparison and the delta both stay in integer pence). The "no `*Pence / 100` outside `formatMoney`" rule lives at the source-discipline layer, not the test-plan layer — a developer using `* 0.01` would round-trip-pass, so a static-source scan would pin implementation detail rather than behaviour. |
| **F5.1** | Should-fix | §5 R6 row missing T76 stretch citation | **D-197** — §5 R6 row extended to list T76 with a "stretch broadening" note pointing at tech-spec §7 R6 row; S12 explicitly recorded as contributing no new tone surface (PDF reuses S1 + S9 sources under existing T29 / T43 scans). |
| **F5.2** | Should-fix | §5 R7 row missing T64 + T72 stretch citation | **D-198** — §5 R7 row extended to list T64, T72 with a "stretch broadening (R7 conscious reading recorded in tech-spec §7 R7 row)" note; `<ShareUnavailable />` explicitly excluded (T65 asserts `<SupportSignpost />` absent there — mirrors R20 narrowing). |
| **F5.3** | Should-fix (highest impact) | §5 R10 row silent on stretch broadening | **D-199** — §5 R10 row extended to list 14 stretch `T*` rows (T49, T50, T51, T57, T58, T60, T61, T63, T64, T65, T67, T70, T71, T74, T75) plus the two R10 + R12 conscious-broadening readings (cache / indexing posture on `/share/*`; no-persona-identity in recipient-facing DOM under `/share/*`); the application-code-only scope for stretch logging hygiene is restated with the access-log-layer "no `T*` allocated" guardrail cross-referenced to tech-spec §5 trade-off "S11 + S12 access-log limitation under R10" and §6. Closes the largest "Gaps are explicit" honesty gap the critic flagged. |
| **F5.4** | Should-fix | §5 R18 row missing T64 / T65 / T66 stretch citation | **D-200** — §5 R18 row extended to list T64, T65, T66 with a "stretch broadening" note that records which row is load-bearing (T64) versus included for completeness (T65 — trivially passes; T66 — `<ShareSnapshotForm />` with SC 2.5.8 24×24 + `aria-describedby` to expiry); S12 PDF tagged-PDF (SC 1.3.1 / 1.3.2) explicitly recorded as a carry-out per tech-spec §5 trade-off "S12 no tagged-PDF" + §6. |
| **F5.5** | Nit | §5 R20 row could list T76 alongside the existing T64 / T72 stretch citation | **D-201** — §5 R20 row extended to list T76; the row body distinguishes the **framing-presence half** of R20 (T64 + T72 — outcome surfaces; `<ShareUnavailable />` excluded) from the **advice-implying token half** of R20 (T76 paired with R6 on `<ShareUnavailable />`'s new copy string). |
| **F7.1** | Nit | §2.3 `snapshotJordanStoredGbp` Used-by column omits T60 / T67 | **D-202** — Used-by column expanded to list every `T*` that consumes the fixture (T47, T48, T56, T57, T59, T60, T64, T67, T69, T72, T73, T74, T75) including the previously-omitted T57 / T60 / T67 / T74 / T75. |
| **F7.2** | Nit | `mockClock` helper hides a Vitest-hoisting subtlety that will bite `/implement S11` | **D-203** — `mockClock` entry rewritten with an explicit "Implementation note for `/implement S11`" describing Vitest's `vi.mock(...)` hoisting behaviour and the two acceptable shapes (factory-returning helper with top-level `const pinned`, or skip the wrapper entirely and write `vi.mock(...)` inline per test file). The fake-timers alternative is preserved as the second valid style. |

### Suspicion-flagged items (carried forward to `/implement`, not closed by this round)

- **`pdfTextExtractor` reliability against `@react-pdf/renderer` output.** Tech-spec §S12 names `pdf-parse` or `pdfjs-dist`'s `getTextContent` as candidate extractors. The critic flagged that PDF text extraction can be lossy / order-dependent / library-version-sensitive. `/implement S12` must verify the chosen extractor produces deterministic output for the `<SnapshotPdf />` layout `/implement S12` writes; if it does not, `T*` rows might need to use a fuzzy-match helper rather than strict `.toContain(...)`. Recorded; no test-plan edit applied.
- **Whether `getPersonaById(id): Persona | undefined` warrants a dedicated `T*` row beyond its indirect coverage via T58 / T71.** The function is a new module export added in S021 (D-166) to `lib/personas.ts`; T58 + T71 exercise it indirectly via the Server Action / Route Handler. The critic noted a dedicated row asserting the unit-level contract (`undefined` on miss; defined `Persona` on hit; same shape as the existing fixtures) would tighten the surface. Carried forward as an option for `/test-plan` if reviewers want it; no row allocated today.

### Consciously not raised by the critic

The critic explicitly listed twelve items it considered and consciously did not raise, including (paraphrased): the choice to keep T15–T17 reserved rather than allocate them to stretch anchors (D-177 well-reasoned); not asserting against the `Persona` shape of `getPersonaById` (indirect coverage acceptable); not allocating a separate row for the `getSnapshotById` extension (covered indirectly via T56 / T57 / T69); not allocating a row against the deferred `share_links.id` revocation handle (out of stretch per tech-spec §5); not exercising the `force-dynamic` directive directly (permitted-not-required is correct per tech-spec); not pinning a clock-mock style per `T*` (correctly left to `/implement S11`); not allocating a stretch tone guard for `<SharedStatementView />` (it reuses S4 strings under existing T22 / T29 scans); not allocating a regression row against the S4 `<DashboardView />` import-of-`<AppHeader />` (out of S11 scope); not allocating a per-arm header-parity row beyond T61 (structural per F1.1 close-out); not allocating a row against the unsigned cookie threat surface (N1-bounded per tech-spec §S11); not asserting the `share_links` foreign key cascade behaviour on snapshot delete (out — T60(c) handles the resolver-side outcome); not allocating a tagged-PDF asserter (carry-out per §5).

## Net change from the critic round

- **Findings closed:** 11 of 11 (no carry-overs except the two suspicion-flagged items, which are reviewer-facing notes for `/implement`).
- **Files changed:** `docs/TEST_PLAN.md` only (T63 + T72 row Covers extended; T50 row narrowed; T72 + T50 row text rewritten; §5 R6 / R7 / R10 / R18 / R20 rows extended; §2.3 `snapshotJordanStoredGbp` + `mockClock` rows extended; §7 status rows for T63 + T72 reconciled).
- **No new `T*` IDs allocated.** No row removed. No MVP row touched. Append-only / clarification edits only.
- **No PRD edits, no tech-spec edits, no implementation code, no executable tests run.**

## Status

**Closed.** Phase 4 gate satisfied for stretch:

- Every stretch requirement (R11 / R12 / R13) has ≥ 1 `T*`.
- Every stretch `T*` cites at least one `R*` and at least one `S*`.
- R19's "tested to R4 standard if delivered" contract has live `T*` partners (T46–T76) ready to ship alongside any of the three `/implement` slices.
- R6 / R7 / R10 / R18 / R20 conscious-broadening readings recorded in tech-spec §S11 / §S12 / §7 are reflected in §3 / §4 / §5 / §6 of the test plan.

Spec → test-plan re-converges at revision 5.1 of `docs/TECH_SPEC.md`. No upstream artefact (PRD, tech spec) was edited in this session.

## Handoff for next session

1. **Commit the phase-4 stretch extension** when ready: `docs/TEST_PLAN.md`, this snapshot, the new `PROMPT_HISTORY.md` row. The S021 base commit `e3dccc8` is the parent.
2. **`/implement S10` is the smallest stretch entry-point** (one new module + one Drizzle migration + one helper); ships T46–T51 alongside the code. Unblocks `formatMoney` for S11 + S12.
3. **`/implement S11` follows S10** (per tech-spec §3 ordering `S10 → S11 → S12`); ships T52–T67 + T76 alongside the code. Reviewers will want the F1.1 middleware-unit assertion (T61), the F1.3 + F1.8 subtree-scoped DOM contract (T64 / T65), and the F1.9 cookie-absent semantics (T58) to all land in the same PR.
4. **`/implement S12` follows S11**; ships T68–T75 alongside the code. The `/implement` session must verify `@react-pdf/renderer` against the installed `node_modules` (pin exact `x.y.z`, confirm `renderToBuffer` is exported from the package root, confirm no Chromium binary in `node_modules/.bin`) **before** writing T68–T75 — if the verification fails, route back to tech-spec §S12 for a library reselection.
5. **The three queued S019 TECH_SPEC amendments** (§S2 DB-log anonymisation, §S4 bullet 1 affordance split, §S4 bullet 7 verb / no-data clause) are still untouched and need their own `/tech-spec` round when reviewers want spec ↔ code convergence on the MVP side. Out of scope for S022.

## Tests not yet run

All 31 stretch `T*` (T46–T76) — `Pending (stretch)`. None can run until at least one of `/implement S10` / `S11` / `S12` produces the modules the rows assert against.

Prompt for next session (if proceeding to stretch implementation):

> S023 `/implement S10` — `lib/affordability/format.ts` + Drizzle migration adding `currency` / `country_code` defaults; type narrowing in `lib/affordability/types.ts`; tests T46–T51 from `docs/TEST_PLAN.md` §3 S10 ship alongside the code.
