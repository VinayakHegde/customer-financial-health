# AI Session Snapshot: S021 — Tech-spec stretch-blocker round (+ same-session critic close-out)

## Metadata

- Date: 2026-06-11
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `feat/s020-tech-spec-stretch-addendum`
- Start commit: `37b8e69` (chore: capture S020 SpecStory raw transcript — branch tip when S021 opened)
- End commit: (uncommitted at session close — `docs/TECH_SPEC.md` revision 5.1 + this snapshot + `docs/PROMPT_HISTORY.md` row + S021 SpecStory transcript)
- Raw transcript: `.specstory/history/2026-06-11_17-24-32Z-tech_spec-blockers-and-document-updates.md`
- Related artefacts: extends `docs/TECH_SPEC.md` (phase 3) — append-only stretch-blocker round on top of S020's revision 4

## Goal of this Cursor window

1. Apply a targeted list of pre-`/test-plan` stretch-blocker fixes to `docs/TECH_SPEC.md` (10 enumerated items targeting S2 logging-hygiene wording, S10 integer-pence display invariant, S11 + S12 persona-cookie validation, S11 resolver missing-snapshot arm, S11 cache / indexing posture, S11 `AppHeader` posture, S11 clock control, S12 PDF API verb + runtime, S12 PDF content-presence test scope).
2. Do **not** edit PRD. Do **not** edit implementation code. Do **not** edit existing MVP design (S1 / S3–S9 / §2 architecture).
3. Run `@critic` against the just-applied edits + the PRD, then close every finding inside the same S021 scope.

## Context given to AI

- `docs/TECH_SPEC.md` — revision 4 (S020 stretch addendum, post-S020 critic round) at branch tip `37b8e69`.
- `docs/PRD.md` — R1–R20 (unchanged this session); R10, R12, R13, R19, R20 referenced by the new edits' `R*` attribution.
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/headers.md` — load-bearing for the F1.1 Blocker (Server Components cannot set response headers).
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — async-`params` shape for the page bullet.
- `.cursor/rules/00-workflow.mdc` — five-phase pipeline; phase 3 owns this artefact (workflow-rule-2 is the gate-cross test for the conscious-reading edits).
- `.cursor/rules/10-evidence.mdc` — append-only ID discipline.
- `.claude/skills/phase-gate/SKILL.md` — header / traceability schema.

## Main prompts used

1. User invoked the **S021 stretch-blocker round** with a 10-item enumerated list of in-spec edits and the explicit constraints "Update `docs/TECH_SPEC.md` only. Do not change PRD. Do not change implementation code. Do not change existing MVP design."
2. User invoked `@critic @docs/TECH_SPEC.md reference @docs/PRD.md` — the `critic` subagent ran read-only against the just-shipped revision 5.
3. User asked for the **full critic deliverable** (findings table + per-finding detail + recommended actions with concrete edit anchors) by resuming the critic subagent before applying any edits.
4. User instructed: **"apply fixes if any from critic"** — every finding was closed inside the S021 scope (S2 / S10 / S11 / S12 / §7); no PRD round opened.

## Decisions made in this session

### Revision 5 — S021 base round (D-152 → D-161)

- **D-152 — S12 PDF API verb pinned.** Replaced the older instance-style `pdf().toBuffer()` wording with `@react-pdf/renderer`'s documented top-level Node helper `renderToBuffer(<SnapshotPdf />)`; `lib/pdf/render.ts` `renderSnapshotPdfToBuffer` wraps it. Verification list (pin exact `x.y.z`, confirm export from package root, sanity-check install size + Chromium absence) kept and tightened for `/implement S12`.
- **D-153 — S12 Route Handler runtime pinned.** Added `export const runtime = 'nodejs'` to `app/dashboard/snapshot/[id]/pdf/route.ts`. `@react-pdf/renderer` calls Node-only APIs (`Buffer`, `fs` for embedded fonts); Edge runtime would fail. Pinned explicitly so a future global default-runtime flip cannot silently break the route. New test row asserts `route.runtime === 'nodejs'` via static import.
- **D-154 — S11 + S12 persona-cookie validation through `getPersonaById()`.** The Server Action (S11) and the Route Handler (S12) both validate the cookie value via `getPersonaById(personaId)`; missing **or** invalid id is rejected before any DB read (S11 returns the same generic `{ ok: false, errors }` shape with no `share_links` write; S12 returns 403 with no `renderSnapshotPdfToBuffer` invocation). Three new test sub-cases each: cookie absent, empty-string value, not-a-persona value.
- **D-155 — S11 resolver explicitly handles snapshot-row-missing.** Step 4 of the page flow now renders the same `<ShareUnavailable />` (same copy, same response headers) when `getSnapshotById(shareLink.snapshotId)` returns `null` — a third resolver-miss case alongside unknown-token + expired-token. Matches the existing §5 trade-off "S11 same-response posture (resolver) and same-error posture (mint) — separately".
- **D-156 — S11 cache / indexing posture made explicit.** `/share/[token]` is dynamic and non-cacheable (Next.js 16 default; `force-dynamic` guardrail if any caching primitive ships). Both `<SharedStatementView />` and `<ShareUnavailable />` send `Cache-Control: no-store, private`. Shared pages send `X-Robots-Tag: noindex, nofollow` HTTP header **and** a matching `<meta name="robots">` via `generateMetadata`. `/share/` added to `robots.txt` as `Disallow: /share/`.
- **D-157 — S11 `AppHeader` posture made explicit (initial two-option form).** S11 records that `/share/[token]` must not render persona-aware navigation; revision-5 draft listed two acceptable enforcement shapes (route-group / layout separation **or** conditional render inside `<AppHeader />`). Per-component contract: zero DOM elements referencing persona id / persona name / `/dashboard*` / `/history` under `/share/[token]` or `<ShareUnavailable />`.
- **D-158 — S2 logging-hygiene wording tightened.** Removed the `db: opened path=<path>` example from S2's data-hygiene paragraph. Allowed lifecycle line is now `db: opened local sqlite database` (no path), or no DB-open log at all. Path leak is treated under R10. S7 logging-hygiene row extended to scan for "any character of the resolved DB path" (later narrowed in the post-critic round — see D-167).
- **D-159 — S11 clock control made explicit.** New `lib/share/clock.ts` exports `nowUtc(): Date`. Every "right now" call site in S11 (mint's `expires_at` / `created_at`; resolver's `getShareLinkByTokenHash(_, nowUtc())`) goes through it. One mock surface covers both styles — declarative (`vi.mock`) **and** fake timers (`vi.useFakeTimers(); vi.setSystemTime(...)`). Both styles must work; `/test-plan` picks one per `T*` row.
- **D-160 — S10 integer-pence display-only invariant recorded.** `formatMoney`'s `pence / 100` divide is **display-only**; all affordability arithmetic stays in integer pence (totals, disposable, deltas, the 5%-near-breakeven comparison in S1). No call site outside `formatMoney` may divide a `*Pence` value by 100; doing so reintroduces float drift. The S7 calculator integer-pence invariant row continues to cover the calculator surface; S10's tests cover the helper's locale-aware output.
- **D-161 — S12 PDF test scope note added.** All `T*` rows that look at the PDF body assert **required-content presence** via text extraction (`pdf-parse` / `pdfjs-dist`). **No** `T*` asserts exact pixel layout, font kerning, line-wrap positions, page count beyond library defaults, or byte-for-byte equality. Contract is "the PDF says X", not "the PDF says X on line N at column M".

### Critic round (post-S021-base, same session) — revision 5.1

- **D-162 — Critic verdict: BLOCK on F1.1; 7 should-fixes + 6 nits.** `@critic` ran read-only against revision 5 + PRD. The single Blocker was **F1.1**: the S11 page commits to `Cache-Control: no-store, private` and `X-Robots-Tag: noindex, nofollow` on the `/share/[token]` response, but a Next.js 16 Server Component **cannot set response headers** per `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/headers.md` (`next/headers` is read-only for the inbound request). Without naming `middleware.ts` / `next.config.ts` `headers()` / a Route Handler conversion, the response-header parity test row was unwritable as a Vitest test. User chose to close all 14 findings inside the S021 scope; F1.6 / F1.7 closed via the in-spec "conscious reading" pattern (mirrors R20/R7 broadening at `:569` / `:676`) rather than a `/prd` round.
- **D-163 — F1.1 closed (Blocker).** Added a "Response-header origin — `middleware.ts` on `/share/*`" bullet to S11's "Cache / indexing posture" subsection naming the project-root `middleware.ts` with a `/share/*` matcher returning `NextResponse.next({ headers: { 'Cache-Control': 'no-store, private', 'X-Robots-Tag': 'noindex, nofollow' } })`. Cross-references S3's existing middleware seam at `/dashboard*` + `/history` (one file, one new matcher). Test row rewritten to import the `middleware` function directly and assert structural header-parity across the four arms (one pathname-driven middleware = one assertion covers all four arms; per-arm HTTP test no longer needed). Negative test added: middleware returns pass-through (no headers) for `/`, `/dashboard*`, `/history`, `/dashboard/snapshot/<id>/pdf` so the matcher does not over-broaden.
- **D-164 — F1.2 closed.** `resolveShare(token: string, now: Date): Promise<Snapshot | null>` declared in S11 as a new sibling under "New token + resolver helpers" at `lib/share/resolve.ts`. Implementation contract: all three miss cases (unknown / expired / snapshot-row-missing) collapse to a single `null`. Page bullet rewritten to delegate to this helper — page no longer inlines `hashShareToken` / `getShareLinkByTokenHash` / `getSnapshotById` calls; testable logic lives in one place.
- **D-165 — F1.3 + F1.8 closed.** S11 `AppHeader` subsection (a) codifies `<AppHeader />` as a pre-existing surface delivered alongside earlier UI polish (not retroactively added to an MVP slice — would breach S021's "MVP design unchanged" rule), and (b) **drops the conditional-render-inside-`<AppHeader />`** alternative. Route-group / layout separation under `app/(share)/...` is now the only acceptable enforcement shape. The pathname assertion is narrowed to **subtree-scoped** (`<SharedStatementView />` / `<ShareUnavailable />` + the `(share)` group's `layout.tsx`) plus a static import-graph check that neither file imports `<AppHeader />`. Page file path updated to `app/(share)/share/[token]/page.tsx`. Status block closure (v) updated for internal consistency (single shape, not two); `<SharedStatementView />` bullet's stale "route-group or conditional render" prose pruned to route-group only.
- **D-166 — F1.4 closed.** `getPersonaById(id: string): Persona | undefined` declared in S11 as an additive extension to `lib/personas.ts` — same append pattern S11 already uses for `getSnapshotById` on `lib/db/snapshots.ts`. Single declaration covers S11 (`createShareLinkAction` step 1) and S12 (route handler line). `undefined`-on-miss (not `null`) so call sites can be `if (!personaId || !getPersonaById(personaId))` without a non-null assertion.
- **D-167 — F1.6 + F1.7 closed in-spec (no /prd round).** Cache / indexing posture and `AppHeader` posture each get a closing "R10 + R12 joint broadening" sentence, mirroring the R20 / R7 conscious-reading pattern recorded at `<SharedStatementView />` and on the S12 PDF. The two readings are: (a) "do not allow third-party caches, search engines, or social-card crawlers to retain shared content", (b) "the recipient must not see the sharer's persona identity in any DOM element rendered under `/share/*`". §7 R10 row extended to list both broadenings with the explicit "if a future PRD revision wants to narrow, that is a `/prd` change" cite-back. **`/prd` round deliberately not opened** per the user's standing "no PRD changes" instruction.
- **D-168 — F1.9 closed.** `withPersonaCookie(null)` sub-case in the persona-validation test row reframed as "cookie absent" — exercised by leaving `withPersonaCookie` out of the `beforeEach` so `cookies().get('personaId')` returns `undefined`. Matches the actual S7 helper semantics at `tests/_helpers/withPersonaCookie.ts` which always installs a cookie-present stub when called; "no cookie at all" is the absence of the helper call, not a call with `null`. Sub-cases (b) empty-string and (c) not-a-persona retained as-is.
- **D-169 — F1.10 closed.** §7 R6 row extended to list S12 — PDF reuses S1 `copy.ts` (reasons / signpost) and S9 `framing.ts` (About-this-assessment) strings verbatim, so the existing S7 tone-token guard inherits coverage automatically. No new tone-bearing strings in S12.
- **D-170 — F1.11 closed.** S7 S2-logging-hygiene row rewritten from "scans for any character of the resolved DB path" (which read literally would fail on any log line containing `/`) to "any **substring** of the resolved DB path" — substring search on the path string in full, not a per-character membership check.
- **D-171 — F1.12 closed.** S12 PDF test-scope note adds "tagged-PDF semantic structure (WCAG SC 1.3.1 / 1.3.2 — out of stretch per §5 trade-off "S12 no tagged-PDF" and §6 carry-out)" to the existing exclusion list. Saves `/test-plan` a §5 / §6 cross-reference round trip.
- **D-172 — F1.13 closed.** S11 persona-validation test row drops the vacuous "or `snapshots`" assertion — `createShareLinkAction` never writes to `snapshots` on any path, so the original "no row appears in `share_links` **or `snapshots`**" check would pass trivially even on a regression that wrote to `snapshots`. Now just "no row appears in `share_links`".
- **D-173 — F1.14 closed.** `share_links.id` column annotated in-schema as the reserved future revocation handle (revocation deferred per §5). Couples the otherwise-unused column to the deferred-revocation trade-off so the schema is forward-leaning rather than dead-coded. No call site references it today; no `T*` row asserts on it today.
- **D-174 — Internal consistency sweep.** Status block at `:11` bumped to revision 5.1 with every finding closed, and the S021-base closure (v) updated to record the single enforcement shape (drops the original two-shape wording). Stale `app/share/[token]/page.tsx` path reference inside the F1.1 explanatory text updated to `app/(share)/share/[token]/page.tsx`. Stale `<SharedStatementView />` prose pruned. Brittle hard-coded `:646` cross-reference inside the middleware test row replaced with a descriptive cross-reference. Lints clean.
- **D-175 — Not findings recorded.** Carried forward unchanged from S020's critic round (R20 / R7 broadening to share + PDF surfaces; access-log limitation under R10; coercion / forwarded-under-pressure suspicion; `@react-pdf/renderer` "lightweight" claim verifiable at `/implement S12`; no-`T*` for end-to-end `useActionState` round-trip; §5 PDF library trade-off `pdf(element).toBuffer()` mention as "still exported"). Listed in the critic's deliverable so the next round does not re-litigate them.

## AI outputs accepted

- `docs/TECH_SPEC.md` revision 5.1 — S2 logging-hygiene + S7 S2 row updated; S10 integer-pence display-only invariant added; S11 body extended (page bullet rewritten around `resolveShare`; `getPersonaById` + `resolveShare` + `nowUtc` helpers declared; cache/indexing posture + middleware bullet + R10/R12 conscious-reading sentence; `AppHeader` posture narrowed to route-group + DOM contract + R10/R12 conscious-reading sentence; `share_links.id` annotated; persona-validation arm tightened; new test rows for clock helper / persona validation / snapshot-row-missing arm / middleware unit / `<meta robots>` / dynamic-route posture / subtree pathname); S12 body extended (`renderToBuffer` wording; route `runtime = 'nodejs'`; persona validation via `getPersonaById`; PDF scope note); §7 R6 + R10 rows extended; status block bumped to revision 5.1 with full critic-findings-closed paragraph. **Net spec change: 805 → 850 lines.**
- `docs/ai/sessions/S021-tech-spec-stretch-blockers.md` — this snapshot.
- `docs/PROMPT_HISTORY.md` — S021 row appended.

## AI outputs rejected or changed

- Original draft of the F1.1 fix considered three response-header mechanisms (middleware, `next.config.ts` `headers()`, Route Handler conversion); picked `middleware.ts` because S3 already uses middleware for redirects (one file, one new matcher — no architectural surface introduced).
- Original status-block update introduced an unmatched `.)` that broke the outer `Draft (...)` parenthesis pair; caught on read-back and fixed.
- Critic's "alternative" for F1.6 / F1.7 (open a `/prd` round to add R21-class coverage for cache/indexing + persona-identity-in-DOM) — **rejected at the user's standing "no PRD changes" instruction**. Closed in-spec via the conscious-reading pattern; the §7 R10 row extension records the broadening explicitly so the readings are not silent.
- Critic's alternative form for F1.1 (convert `/share/[token]/page.tsx` to a Route Handler) — **rejected** because it would touch the page-vs-component split in §4 and change the artefact shape S11 already commits to. Middleware was the cheapest in-S11-scope option.
- Critic's "AppHeader" rerouting option to add `<AppHeader />` to §2's architecture diagram — **rejected** because it crosses the "MVP design unchanged" rule. S11 codifies the component as a pre-existing surface and narrows the DOM contract to subtree-scoped instead.

## Files changed

- `docs/TECH_SPEC.md` — header status (revision 5 → 5.1 with full critic-findings-closed block); S2 data-hygiene paragraph (logging hygiene tightened); S10 `formatMoney` block (integer-pence display-only invariant); S11 body (page bullet rewritten; `getPersonaById` + `resolveShare` + `nowUtc` helpers declared; cache/indexing posture block with middleware bullet + R10/R12 conscious-reading; `AppHeader` posture narrowed to route-group only + DOM contract + R10/R12 conscious-reading; `share_links.id` annotated; Server Action persona-validation arm tightened); S11 test commitments (clock helper row; persona-validation arm; snapshot-row-missing arm; middleware unit row; `<meta robots>` row; dynamic-route posture row; subtree pathname row); S12 body (Library bullet rewritten for `renderToBuffer`; Route Handler code block adds `runtime = 'nodejs'` + `getPersonaById()` validation; renderer wrapper bullet rewritten for `renderToBuffer`); S12 test commitments (scope note tightened with tagged-PDF exclusion; runtime directive row; invalid-cookie 403 row); §7 R6 row (S12 inheritance); §7 R10 row (S2 path-string scrub + S11 R10/R12 broadenings). **Net: 805 → 850 lines (+45).**
- `docs/ai/sessions/S021-tech-spec-stretch-blockers.md` — new (this file).
- `docs/PROMPT_HISTORY.md` — S021 row appended.
- `.specstory/history/2026-06-11_17-24-32Z-tech_spec-blockers-and-document-updates.md` — new (SpecStory raw transcript).
- `.specstory/statistics.json` — auto-tracked.

## Tests added or run

None. Phase 3 is documentation-only; no executable code changed. The MVP `npm test` (131/131) is unaffected. The S021 test commitments are spec-only — not executable until the matching `/implement` session ships code.

## Handoff for next session

1. **Commit the round** with atomic commits matching the S020 pattern: (1) docs: TECH_SPEC S021 stretch-blocker fixes + post-critic round; (2) docs: add S021 session snapshot; (3) docs: append S021 to PROMPT_HISTORY; (4) chore: capture S021 SpecStory raw transcript.
2. **`/test-plan` is now unblocked for stretch coverage** (S10 / S11 / S12). Every test commitment in S11's block has a concrete, testable surface — F1.1 was the single Blocker and is now closed via the middleware-unit assertion shape. `T*` insertion points: T15–T17 reserved range in `docs/TEST_PLAN.md` §7. **Notes for `/test-plan`:**
   - S11 response-headers assertion is one row against the middleware unit (pathname-driven matching covers all four arms structurally); **do not** allocate a per-arm HTTP test.
   - `<meta name="robots">` assertion is a separate row against `generateMetadata` — both must be present.
   - Clock helper has two valid styles (`vi.mock` and `vi.useFakeTimers`); pick one per `T*`.
   - S11 + S12 logging-hygiene assertions are scoped to application-code only; do not allocate a `T*` against the framework / access-log layer (per §5 trade-off "S11 + S12 access-log limitation under R10", carried forward from S020).
   - Persona-validation arm has three sub-cases each in S11 + S12 (absent / empty / not-a-persona); §S3 fixture surface is the persona-registry source of truth for the "not-a-persona" sub-case.
   - PDF tests assert **required content presence**, not exact layout, line-wrap, page count, or byte equality (per the S021-base scope note); tagged-PDF structure is excluded (per the F1.12 close-out).
3. **`/implement S10` is the smallest stretch entry-point** and unblocks the `formatMoney` helper that S11 + S12 both rely on. `/implement S11` and `/implement S12` can land in either order after S10.
4. **`/implement S12` must verify `@react-pdf/renderer`** before pinning — pin an exact `x.y.z`, confirm `renderToBuffer` is exported from the package root, sanity-check install size + no Chromium binary in `node_modules/.bin`, confirm rasterisation does not invoke a system browser. Recorded in S12 body + §5 trade-off.
5. **No PRD edits required by S021 or its critic round.** R10 + R12 conscious-readings (cache/indexing + persona-identity-in-DOM) are recorded in S11 with the `/prd` route-back invitation; if a future reviewer wants R-row anchors, the S11 subsections are the right places to revisit.
6. **Three queued S019 amendments** (§S2 DB-log anonymisation, §S4 bullet 1 affordance split, §S4 bullet 7 verb / no-data clause) remain untouched in this session — they still need their own `/tech-spec` round to land.

## Tests not yet run

- All S10 / S11 / S12 test commitments are spec-only — not executable until the matching `/implement` session ships code.
- The existing 131-test MVP suite is unchanged by this session; no re-run needed.

## Session status

**Closed (documentation-only, post-critic).** Revision 5 (S021 base) and revision 5.1 (S021-fix close-out) committed together as one round; all 14 critic findings closed inside the S021 scope (S2 / S10 / S11 / S12 / §7), no PRD edits, no MVP design edits, no implementation code edits. Phase 4 (`/test-plan`) is unblocked for stretch coverage. Decisions D-152 → D-175.
