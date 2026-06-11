# AI Session Snapshot: S020 — Tech-spec stretch addendum (S10 / S11 / S12)

## Metadata

- Date: 2026-06-11
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `main`
- Start commit: `32c1264` (Merge PR #25 — `feat/s019-ui-polish`; submission-ready MVP on `main`)
- End commit: (uncommitted at session close — `docs/TECH_SPEC.md` revision 4 + this snapshot + `docs/PROMPT_HISTORY.md` row)
- Raw transcript: `.specstory/history/` (SpecStory writes one file per Cursor window on close)
- Related artefacts: extends `docs/TECH_SPEC.md` (phase 3) — append-only stretch design

## Goal of this Cursor window

1. Run `/tech-spec` (phase 3 of 5) as an **append-only stretch addendum** — design `S10`, `S11`, `S12` for the three Could-class PRD requirements (R11, R12, R13) plus the R19 test-discipline requirement.
2. Do **not** rewrite existing `S1–S9` sections, `§2` architecture, the MVP scope of `§5` trade-offs, or the MVP scope of `§6` out-of-scope.
3. Do **not** edit the PRD. Do **not** implement R11 / R12 / R13 code. Do **not** add Playwright. Do **not** add auth / email / SMS.
4. Each stretch slice must be small enough for a single `/implement S<n>` session.
5. Surface the addendum in the `§7` traceability table and update the `§5` trade-offs / `§6` out-of-scope sections so they reflect the new design.

## Context given to AI

- `docs/PRD.md` — R1–R20 (R11 = currency / country_code, R12 = time-limited share link, R13 = PDF export, R19 = stretch test discipline).
- `docs/TECH_SPEC.md` — revision 3, S1–S9 + recommended ordering + `§7` traceability with R11 / R12 / R13 / R19 rows previously marked `—`.
- `docs/TEST_PLAN.md` — for context on existing `T*` discipline; not edited in this session.
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` — Next.js 16 Route Handler / async `params` shape (used by S12).
- `node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md` — Vitest constraints (referenced by S11 resolver-page testing strategy).
- `.cursor/rules/00-workflow.mdc` — five-phase pipeline; phase 3 owns this artefact.
- `.cursor/rules/10-evidence.mdc` — append-only ID discipline; no real PII; every claim cited.
- `.claude/skills/phase-gate/SKILL.md` — header / traceability schema.

## Main prompts used

1. User invoked `/tech-spec` with session ID **S020** and an explicit instruction to add **exactly three** stretch slices (S10, S11, S12) as an **append-only** addendum, plus updates to traceability / out-of-scope / trade-offs.
2. User invoked `@critic stretch goals @docs/TECH_SPEC.md @docs/PRD.md @docs/discovery/NOTES.md` — the `critic` subagent ran read-only against the just-shipped addendum.
3. User instructed: "fix them before we progress — make sure no changes to PRD." All accepted critic findings were applied to `docs/TECH_SPEC.md` only, without touching `docs/PRD.md`.

## Decisions made in this session

- **D-129 — Pre-checks pass.** PRD has R11 / R12 / R13 / R19 with stable IDs and `Why` lines. No PRD open question is blocked on the stretches; A1–A5 already resolved by tech-spec rev 3. Append-only commitment honoured for all of `S1–S9`, `§2`, the MVP scope of `§5`, and the MVP scope of `§6`.
- **D-130 — `S10` design (R11).** `Snapshot.currency: 'GBP'` and `Snapshot.countryCode: 'GB'` with literal type narrowing; Drizzle migration adds `currency TEXT NOT NULL DEFAULT 'GBP'` + `country_code TEXT NOT NULL DEFAULT 'GB'`; backfill at `ALTER TABLE` time (SQLite default-fill semantics); new `lib/affordability/format.ts` `formatMoney(pence, currency, countryCode)` helper; existing call-sites in `<DashboardView />` / `<UpdateForm />` / `<HistoryList />` rewired to the helper but the rendered string is identical for the only currency the product ships. Test commitments: migration applied, default backfill, repository round-trip, `formatMoney` unit, existing render assertions still pass, logging hygiene unchanged.
- **D-131 — `S11` design (R12).** Random 32-byte bearer token (`base64url`) + SHA-256 hex hash stored in a new `share_links` table; raw token never persisted; `expires_at = now + 24h`; ownership check at mint via `snapshot.customerId === personaId`; resolver returns the same `<ShareUnavailable />` page for missing / expired / unknown tokens; new components `<SharedStatementView />`, `<ShareUnavailable />`, `<ShareSnapshotForm />`. Threat-model summary recorded inline; single-use, revocation, rate limiting deferred. Test commitments include token generation, repository round-trip, ownership check, happy path, resolver expiry, render of `<SharedStatementView />` per persona, render of `<ShareUnavailable />`, logging hygiene, axe smoke.
- **D-132 — `S12` design (R13).** `@react-pdf/renderer` on a Next.js 16 Route Handler at `app/dashboard/snapshot/[id]/pdf/route.ts`; ownership-checked GET that streams a `Buffer` with `Content-Type: application/pdf` + `Content-Disposition: attachment; …` + `Cache-Control: no-store, private`; layout includes branding, snapshot date, currency / country, totals, disposable, band, reasons, breakdowns, support signpost, framing notice. No PDF storage. Tagged-PDF deferred. Test commitments include ownership 404, missing-cookie 403, happy-path 200 + `%PDF-` byte-prefix, outcome-state coverage, `formatMoney` integration, no-file-write spy, logging hygiene.
- **D-133 — Library / approach trade-offs recorded.** S11 picked random+hash over HMAC-signed URLs (DB-leak posture, easier revocation later, no secret-management). S12 picked `@react-pdf/renderer` over `pdfkit` (low-level), Puppeteer / Playwright (heavy, conflicts with no-Playwright stance), `jsPDF` (browser-leaning). MSW remains unnecessary — S11's page is server-rendered HTML and S12's route handler is tested as a plain async function.
- **D-134 — Deliberate scope caps recorded.** S11: no email / SMS, no revocation UI, no rate limit, no single-use, no custom expiry, no logging of token / hash / snapshot id / IE values. S12: no storage, no tagged-PDF, no per-recipient watermark, no S11 cross-integration. S10: no selector, no locale beyond `en-GB`, no other money-formatting drift.
- **D-135 — `§7` traceability rebound.** R11 → S10, R12 → S11, R13 → S12, R19 → S10 / S11 / S12 (test-discipline). Every Must requirement still maps to its existing MVP slice; gate criteria for `/test-plan` remain satisfied.
- **D-136 — `§6` out-of-scope refreshed.** R11 / R12 / R13 lines updated from "not designed" to "designed in S10 / S11 / S12 — not delivered until /implement runs". New entries added for S11 rate limiting, single-use / revocation deferral, S12 tagged-PDF, S11 + S12 cross-integration. MVP-scope lines (N1–N8, free-text-note, retention, etc.) untouched.
- **D-137 — Status bumped to revision 4.** Header status note added: "append-only stretch addendum from S020". MVP `§3` content unchanged.
- **D-138 — TEST_PLAN deferred.** No `T*` IDs assigned in this session — `/test-plan` is a separate phase (rule 1 of `.cursor/rules/00-workflow.mdc`). The S10 / S11 / S12 test commitments are in coverage-matrix prose; `/test-plan` will allocate `T*` IDs against them when (and if) a stretch is picked up.

### Critic round (post-addendum, same session)

- **D-139 — Critic verdict accepted as Minor fixes.** `critic` subagent ran read-only against the addendum + PRD R11/R12/R13/R19 + discovery NOTES. Verdict: **Minor fixes**. User chose to apply all top-3 + all named smaller items in tech-spec only, with the explicit constraint **no PRD changes**. Coercion / forwarded-under-pressure suspicion is recorded as a flagged §5 + §6 entry rather than routed to `/prd`.
- **D-140 — `<ShareUnavailable />` placement narrowed (mandatory drop).** Removed `<FramingNotice />` (and confirmed no `<SupportSignpost />`) from `<ShareUnavailable />` in §3 S11. The page carries no outcome — R20 ("every outcome screen") and R7 ("every outcome surface") do not attach. Same gate-cross shape as S007 round-2 F2.1, fixed the same way (narrow the placement, do not silently re-broaden the requirement). The `<ShareUnavailable />` render assertion in §3 S11 tests now asserts the absence of `<FramingNotice />` + `<SupportSignpost />`. The a11y smoke for `<ShareUnavailable />` is kept for completeness but explicitly noted as not load-bearing for R18.
- **D-141 — `<SharedStatementView />` and the PDF placement made conscious + explicit.** R20 + R7 broadening on the recipient-facing surfaces (S11 `<SharedStatementView />` and the S12 PDF) is now recorded as a conscious reading of "every outcome screen / surface" — both are read-only outcome surfaces for someone looking at an affordability assessment, the audience R20 + R7 are written for. Reasoning is recorded inline in §3 S11 and §3 S12 alongside the placements. The §7 R7 and R20 traceability rows are extended to list S11 + S12 with this reasoning. If a future PRD revision wants to narrow R20 / R7 back, that is a `/prd` change and the slices' placement sections are the right place to revisit.
- **D-142 — R10 logging-hygiene scoped to application code; URL-in-access-log limitation acknowledged.** §3 S11 + §3 S12 "Data hygiene (R10)" sub-blocks now split into "Application-code commitments (testable)" and "Known limitation (not closeable in stretch)". The known limitation explicitly names the bearer-token-in-URL (S11) and snapshot-id-in-URL (S12) leak into Next.js's request log + any production access log, with three remediation options recorded (move-off-URL, suppress-access-log, declare) and **(declare)** picked as the cleanest take-home call. The §3 logging-hygiene test commitments now scope to "application-code surface" only. New §5 trade-off "S11 + S12 access-log limitation under R10" and new §6 carry-out record the same.
- **D-143 — S11 "ownership check at mint" reframed under N1.** §3 S11 "Threat model summary" rewritten to name the asymmetry: the persona-cookie identity is unsigned (S3 design + N1 wording) and an attacker who can read or set the cookie can mint share links for that persona's snapshots. The mint-time check is now framed as a **UX selector that prevents accidental cross-persona sharing in the demo**, not an authenticated authorisation control. §5 "S11 random bearer token + SHA-256 hash over signed URL (HMAC)" extended with the same N1-bound caveat: "leaked DB does not yield usable links" is bounded by the cookie jar typically being co-located with the SQLite file in the take-home posture.
- **D-144 — `@react-pdf/renderer` "lightweight" claim tagged as suspicion.** §3 S12 library prose and §5 "S12 PDF library: `@react-pdf/renderer` over puppeteer / playwright" now mark the "no headless browser, no Chromium binary, pure-Node" framing as **suspicion to verify at `/implement S12`** (pin version, sanity-check install size + runtime footprint, confirm `toBuffer` / `toStream` API, confirm rasterisation does not invoke a system browser). The async-`params` Route Handler signature itself is consistent with `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` and stays unchanged.
- **D-145 — `<ShareUnavailable />` "no per-reason variation" trade-off split into resolver-side + mint-side.** §5 "S11 same response for missing / expired / unauthorised" replaced with "S11 same-response posture (resolver) and same-error posture (mint) — separately". Resolver only sees missing / expired / unknown (no recipient identity, no "unauthorised" arm); mint is the only place "unauthorised" exists (snapshot owned by another persona) and that arm is N1-bounded. §3 S11 `<ShareUnavailable />` test commitment updated accordingly.
- **D-146 — "Cannot drift" claim softened to "money strings cannot drift".** §3 S12 design intro and `formatMoney` integration test commitment now scope the no-drift guarantee to money strings only (band labels, reasons, and framing copy live on independent code paths and are not asserted by the test). Recorded honestly so `/test-plan` does not promise a stronger T-row than the design supports.
- **D-147 — Coercion / forwarded-under-pressure risk recorded as suspicion.** New §5 trade-off "S11 + S12 coercion / forwarded-under-pressure risk (suspicion — no PRD citation)" + new §6 carry-out. Three options considered: (1) route a `/prd` round to add a coercion-aware constraint, (2) design a consent affordance here without a PRD anchor (workflow-rule-2 gate-cross — refused), (3) record as flagged suspicion for a future PRD round. Picked **(3)** at the user's "no PRD changes" instruction.
- **D-148 — `T12` test-ID reference in §3 S10 neutralised.** Replaced the parenthetical `(S7 / T12)` with prose that defers `T*` allocation to `/test-plan`. Tech-spec now contains zero `T*` references — clean.
- **D-149 — §7 traceability extended for R6 / R7 / R10 / R18 / R20.** Each row now lists S11 / S12 inheritance with the explicit "stretch addendum" note + the `<ShareUnavailable />` exclusion where applicable. R18's row records the S12 tagged-PDF carry-out + the S11 `<ShareUnavailable />` "smoke included for completeness, not load-bearing" wording. R6's row records the one new `<ShareUnavailable />` copy string the S11 tone-token guard scans.
- **D-150 — Status header bumped to record the critic round.** Revision 4's status sentence extended with a one-paragraph summary of what the post-S020 critic round changed (no PRD changes, R20/R7 placement made explicit, `<ShareUnavailable />` narrowed, R10 scoped to application code, S11 ownership reframed under N1, coercion suspicion recorded, `@react-pdf/renderer` "lightweight" tagged for `/implement` verification). Revision 3's existing status sentence preserved verbatim.
- **D-151 — Critic findings deferred for /test-plan or future /prd.** Three smaller critic items intentionally not applied here, listed for downstream sessions: (a) the §3 S11 "0 console.* spy across (a)/(b)/(c) lookups" wording could in principle be split into separate test cases — left as one prose row for `/test-plan` to allocate; (b) tagged-PDF-as-out-of-scope is honest at the "asymmetry" level but not yet at the language-of-page (SC 3.1.1) layer for the PDF — left for `/implement S12` to decide if `@react-pdf/renderer` exposes a `lang` attribute; (c) wire-layer indistinguishability of resolver miss / expiry / unknown (response-header parity, timing side-channel) recorded in §6 but not exercised by any test commitment — left for a future security-review round if R12 ships.

## AI outputs accepted

- `docs/TECH_SPEC.md` revision 4 (post-S020 critic) — `S10`, `S11`, `S12` appended to `§3`; `§5` extended with stretch trade-offs (resolves the previously-deferred "Stretch security model for R12" entry); `§6` refreshed for R11 / R12 / R13 + new stretch-scope carry-outs; `§7` traceability rows updated for R11 / R12 / R13 / R19 plus the post-critic R6 / R7 / R10 / R18 / R20 inheritance rows; status sentence extended to record the critic round.
- `docs/ai/sessions/S020-tech-spec-stretch-addendum.md` — this snapshot, including the **Critic round (post-addendum, same session)** decision block (D-139 → D-151).
- `docs/PROMPT_HISTORY.md` — S020 row extended to cover the critic round + fixes.

## AI outputs rejected or changed

- Initial draft attempted to insert all three slices in a single `StrReplace`; the call failed at the JSON layer. Recovered by inserting `S10`, `S11`, `S12` sequentially and verifying section structure (`## 4. Cross-cutting concerns` header) at each step.
- During the recovery, a single trailing-newline edit accidentally removed the `## 4. Cross-cutting concerns` header; restored on next pass and confirmed via a header-grep against `^## \d+\.`.
- Critic-suggested option to move the bearer token off the URL path (S11) — **rejected** for stretch (UX cost too high; recorded in §5 + §6 as a future-slice option).
- Critic-suggested option to suppress access logging at the framework / proxy layer for `/share/[token]` and `/dashboard/snapshot/[id]/pdf` — **deferred** to `/implement S11` / `/implement S12` (config-level work; not pre-committed in the spec).
- Critic-suggested route to `/prd` for an R20 / R7 broadening or for a coercion-aware constraint — **rejected at the user's instruction** ("no PRD changes"). R20 / R7 are now an explicit-conscious-reading in the tech spec; coercion is a flagged §5 + §6 suspicion.

## Files changed

- `docs/TECH_SPEC.md` — header status (revision 4 + post-S020 critic note), three new `S*` slices in `§3`, fourteen entries in `§5` (eleven new from the addendum + three post-critic amendments + two post-critic additions), six updated + four new + three post-critic-new entries in `§6`, three updated rows + one updated R19 row + five post-critic-extended rows (R6 / R7 / R10 / R18 / R20) in `§7` traceability, and the post-critic in-line reasoning blocks in `§3 S10 / S11 / S12`. **Net: 794 → 805 lines.**
- `docs/ai/sessions/S020-tech-spec-stretch-addendum.md` — new (this file), including the post-critic decision block.
- `docs/PROMPT_HISTORY.md` — S020 row extended.

## Tests added or run

None. Phase 3 is documentation-only; no `T*` IDs change in this session. The MVP `npm test` (131/131) is unaffected because no executable code changed.

## Handoff for next session

1. **Commit the addendum + post-critic fixes** when ready: `docs/TECH_SPEC.md` rev 4 (post-S020 critic) + this snapshot + `docs/PROMPT_HISTORY.md` row. The MVP is already on `main` at `32c1264`; this commit is purely additive design.
2. **`/test-plan` is unblocked for stretch coverage.** If R11 / R12 / R13 is picked up, run `/test-plan` to allocate `T*` IDs against the S10 / S11 / S12 coverage commitments. The current `docs/TEST_PLAN.md` `Pending (manual)` rows for R11 / R12 / R13 (T15–T17 reserved range) are the natural insertion points. **Note for `/test-plan`:** S11 + S12 logging-hygiene assertions are scoped to application-code only; do not allocate a `T*` that would assert against the framework / access-log layer (see §5 trade-off "S11 + S12 access-log limitation under R10").
3. **`/implement S10` is the next stretch entry-point** if a stretch is picked up — S10 is the smallest slice and unblocks the `formatMoney` helper that S11 and S12 both rely on.
4. **`/implement S12` must verify the `@react-pdf/renderer` "lightweight" claim** before pinning the dependency. Recorded as suspicion in §3 S12 + §5 "S12 PDF library".
5. **Three queued S019 amendments** (`§S2` DB-log anonymisation, `§S4` bullet 1 Switch-persona affordance split, `§S4` bullet 7 verb / no-data CTA) remain untouched in this session — they need their own `/tech-spec` round to land.
6. **No PRD edits required by S020 or its critic round.** R11 / R12 / R13 / R19 are stable and now fully covered by `S*` IDs. Coercion / R20-broader-than-outcome-screens / consent-affordance discussions are recorded as flagged suspicions in §5 + §6 — a future `/prd` round may pick them up if reviewers want.

## Tests not yet run

- All S10 / S11 / S12 test commitments are spec-only — not executable until the matching `/implement` session ships code.
- The existing 131-test MVP suite is unchanged by this session; no re-run needed.

## Session status

**Closed (documentation-only, post-critic).** Phase 3 stretch addendum committed in spec form; the same-session `@critic` round flagged Minor fixes which were applied to tech-spec only (no PRD changes). Phase 4 (`/test-plan`) is unblocked for stretch coverage if reviewers want it. Decisions D-129 → D-151.
