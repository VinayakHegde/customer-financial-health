# AI Session Snapshot: S024 — `/implement S11`

## Metadata

- Date: 2026-06-11
- Tool: Cursor
- Model: Claude Opus 4.7 (agent)
- Branch: `main`
- Start commit: `8080fcb`
- Raw transcript: `.specstory/history/` (SpecStory writes one file per Cursor window on close)
- Related artefacts: `docs/TECH_SPEC.md` §S11 (rev 5.1), `docs/TEST_PLAN.md` §3 S11 (T52–T67 + T76 — rev S022.1), `docs/PRD.md` (R10, R12, R18, R19, R20, R6, R7)

## Goal of this Cursor window

Implement tech-spec slice **S11 — Secure time-limited statement sharing (stretch)** with matching tests **T52–T67 + T76**. Second stretch slice; consumes S10's `formatMoney` for `<SharedStatementView />`'s money strings.

## Scope restated (auditable)

| ID | Requirement |
|---|---|
| **R12** | Time-limited share link (24h), bearer-token model with raw-token-not-stored guarantee. |
| **R10** | Application-code logging hygiene across mint + resolver — no raw token, no token hash, no snapshot id, no IE values logged. Cache + indexing posture (`no-store, private` + `noindex, nofollow`) on `/share/*` (R10 + R12 joint reading per tech-spec §S11). |
| **R18** | WCAG 2.2 AA on `<SharedStatementView />` + `<ShareUnavailable />` + `<ShareSnapshotForm />`. SC 2.5.8 24×24 hit targets on the share form. |
| **R19** | Stretch tested to the same standard as R4 — token contract + migration + repository + clock helper + Server Action (happy / ownership / persona validation) + resolver (happy / three miss arms collapse) + middleware-unit headers + `generateMetadata` + render + a11y + logging hygiene. |
| **R20 (broadening)** | Framing notice on `<SharedStatementView />` (recipient-facing outcome surface — conscious reading per tech-spec §S11). `<ShareUnavailable />` excluded — no outcome on the page. |
| **R7 (broadening)** | Support signpost on `<SharedStatementView />` (same conscious reading). `<ShareUnavailable />` excluded (T65). |
| **R6** | Tone + advice-implying token guard scans the new `<ShareUnavailable />` copy string (T76). |
| **S11** | `lib/share/{token,clock,resolve,copy}.ts`, `lib/db/share-links.ts`, `share_links` migration + index, `lib/db/snapshots.ts#getSnapshotById`, `createShareLinkAction`, `<SharedStatementView />`, `<ShareUnavailable />`, `<ShareSnapshotForm />`, route group `app/(share)/share/[token]/` with own `layout.tsx` (no `<AppHeader />`) + `generateMetadata`, project-root `middleware.ts` matcher on `/share/*`, `/share` in `robots.txt`. |
| **T52–T67 + T76** | Unit + render + a11y tests under `tests/s11/`. |

## Plan (TDD ordering)

1. **Tests first** under `tests/s11/`:
   - `t52-token-contract.test.ts` — base64url + sha256-hex shape; idempotent hash; 100 distinct raws.
   - `t53-migration.test.ts` — `share_links` table + columns + FK + `idx_share_links_token_hash` index via `PRAGMA`.
   - `t54-repository-round-trip.test.ts` — `createShareLink` + `getShareLinkByTokenHash`; expired/unknown → `null` (indistinguishable).
   - `t55-clock.test.ts` — both module-mock and fake-timers styles produce the same fixture behaviour.
   - `t56-action-happy.test.ts` — `createShareLinkAction` happy path; `expiresAt = pinned + 24h` exactly; raw token never persisted (anywhere-in-DB scan).
   - `t57-action-ownership.test.ts` — cross-persona snapshot + non-existent snapshot id return same generic error; no DB write; no snapshot id logged.
   - `t58-action-persona-validation.test.ts` — three sub-cases (cookie absent, empty, not-a-persona) all return `_` field error; zero `share_links` rows; cookie value not logged.
   - `t59-resolve-happy.test.ts` — `resolveShare(token, now)` returns the linked Snapshot.
   - `t60-resolve-miss-arms.test.ts` — three miss arms (unknown / expired / snapshot-row-missing) all return `=== null`.
   - `t61-middleware-headers.test.ts` — middleware emits cache + robots headers on `/share/*` only; pass-through on `/`, `/dashboard*`, `/history`, `/dashboard/snapshot/<id>/pdf`.
   - `t62-generate-metadata.test.ts` — `generateMetadata` exports `robots: { index: false, follow: false }`.
   - `t63-no-static-render.test.tsx` — static source scan: zero `revalidate` / `force-static` / `unstable_cache(`.
   - `t64-shared-view-render.test.tsx` — render `<SharedStatementView />` per persona inside `(share)` layout; subtree persona-leak DOM contract; `formatMoney` integration; static import-graph check; vitest-axe smoke.
   - `t65-share-unavailable.test.tsx` — same render across all three miss arms; framing + signpost absent; persona-leak contract; axe smoke.
   - `t66-share-form.test.tsx` — `<ShareSnapshotForm />` renders real `<button>` + `<input readOnly>`; accessible name; `aria-describedby` to expiry; SC 2.5.8 24×24; axe smoke.
   - `t67-logging-hygiene.test.ts` — single `console.*` spy across all four paths; zero raw token / hash / snapshot id / IE digit / IE label.
   - `t76-share-unavailable-tone.test.ts` — copy passes `forbiddenToneTokens` + `adviceImplyingTokens` scans.
2. **Confirm failing** for the right reason.
3. **Implement minimum**:
   - `lib/share/token.ts` — `generateShareToken`, `hashShareToken` (32 bytes → base64url + sha256-hex).
   - `lib/share/clock.ts` — `nowUtc(): Date`.
   - `lib/share/resolve.ts` — `resolveShare(token, now): Promise<Snapshot | null>`; collapses all three miss arms.
   - `lib/share/copy.ts` — `<ShareUnavailable />` copy string + product wordmark text used by `(share)/layout.tsx`.
   - `lib/db/schema.ts` — `share_links` `sqliteTable` with FK on `snapshot_id`, unique on `token_hash`, named index.
   - `drizzle/0002_s11_share_links.sql` + `drizzle/meta/0002_snapshot.json` + `_journal.json` entry — generated via `drizzle-kit generate`.
   - `lib/db/share-links.ts` — `createShareLink` + `getShareLinkByTokenHash(hash, now: Date)` (returns `null` on expired or unknown).
   - `lib/db/snapshots.ts` — append `getSnapshotById(id): Snapshot | null`.
   - `lib/db/client.ts` + `lib/db/index.ts` — export the new repository methods at module level.
   - `src/app/(main)/dashboard/share/actions.ts` — `'use server'` `createShareLinkAction(formData)`.
   - `components/SharedStatementView.tsx` — sync, props-only outcome surface using `formatMoney`; no AppHeader / persona-aware nav imports.
   - `components/ShareUnavailable.tsx` — single sectioned page; no FramingNotice / SupportSignpost.
   - `components/ShareSnapshotForm.tsx` — `'use client'` Client Component using `useActionState`; copy-link UI with `aria-describedby` to expiry.
   - `src/app/(share)/layout.tsx` — minimal `<header>` with product wordmark; no `<AppHeader />` import.
   - `src/app/(share)/share/[token]/page.tsx` — async Server Component delegating to `resolveShare`; `generateMetadata` exporting `noindex, nofollow`.
   - `middleware.ts` (project root) — matcher on `/share/:path*`; emits `Cache-Control: no-store, private` + `X-Robots-Tag: noindex, nofollow`; pass-through elsewhere.
   - `public/robots.txt` — append `Disallow: /share/`.
   - `(main)` route group restructure — move existing pages into `src/app/(main)/` so `<AppHeader />` lives in `(main)/layout.tsx`, satisfying the tech-spec §S11 F1.8 enforcement shape.
4. **Refactor inside slice** if needed; re-run tests.
5. Run `npm run lint`, `npm run typecheck`, `npm test` (full).
6. Update this snapshot + `docs/PROMPT_HISTORY.md`.
7. Trigger `@critic` on the S11 implementation; apply suggested fixes inside the S11 scope.

## Decisions

- **D-217 — Multiple root layouts via route groups.** Per tech-spec §S11 F1.8 ("route-group / layout separation is now the only acceptable shape"). Implementation removes the top-level `src/app/layout.tsx` and creates `(main)/layout.tsx` (carries `<AppHeader />` + html/body/fonts) and `(share)/layout.tsx` (no `<AppHeader />`). The conditional-render alternative was explicitly rejected by the spec.
- **D-218 — Token raw stored only in URL; hash-only at rest.** SHA-256 of the random bytes is the lookup key. Closes the data-leak surface from a stolen DB.
- **D-219 — Three miss arms collapse to `null` inside `resolveShare`.** Page renders `<ShareUnavailable />` with identical copy + identical headers. Tests cannot distinguish unknown / expired / snapshot-row-missing from the resolver return value alone (T60 cross-arm `=== null`).
- **D-220 — `getSnapshotById` lives on `SnapshotRepository`.** Append-only extension of S2's repository (mirrors S10's pattern of additive extension).
- **D-221 — Drizzle migration generated via `drizzle-kit generate`.** Same workflow as S2 baseline + S10 (`drizzle-kit` + `biome format --write` for trailing newline drift).
- **D-222 — `<ShareSnapshotForm />` uses React 19 `useActionState`.** Real `<button>` + `<input readOnly>`; T66 injects state directly (does not exercise `useActionState` round-trip — same MVP limitation as T24 / T25).

## Files changed

- `lib/share/token.ts` (new)
- `lib/share/clock.ts` (new)
- `lib/share/resolve.ts` (new)
- `lib/share/copy.ts` (new)
- `lib/db/schema.ts` — `share_links` table added.
- `lib/db/share-links.ts` (new)
- `lib/db/snapshots.ts` — `getSnapshotById` added.
- `lib/db/client.ts` — re-exports the new methods.
- `lib/db/index.ts` — re-exports.
- `drizzle/0002_s11_share_links.sql` (new)
- `drizzle/meta/0002_snapshot.json` (new)
- `drizzle/meta/_journal.json` — entry appended.
- `src/app/(main)/...` — existing pages moved.
- `src/app/(main)/layout.tsx` (new) — AppHeader-bearing layout.
- `src/app/(main)/dashboard/share/actions.ts` (new)
- `src/app/(share)/layout.tsx` (new)
- `src/app/(share)/share/[token]/page.tsx` (new)
- `components/SharedStatementView.tsx` (new)
- `components/ShareUnavailable.tsx` (new)
- `components/ShareSnapshotForm.tsx` (new)
- `components/DashboardView.tsx` — adds `<ShareSnapshotForm />` for the latest snapshot.
- `components/HistoryList.tsx` — adds `<ShareSnapshotForm />` per row.
- `middleware.ts` (new)
- `public/robots.txt` — appends `Disallow: /share/`.
- `tests/s11/t52-…t67`, `t76`.
- `tests/_fixtures/snapshots.ts` — adds three S11 stretch fixtures: `pinnedNowUtc` (pinned UTC instant), `nowJustAfterExpiry` (1 ms past the 24-hour boundary), `shareTokenPinned` (a frozen `{ raw, hash }` produced once at module load). The TEST_PLAN §2.3 entries `snapshotJordanStoredGbp`, `snapshotPatStoredGbp`, `shareLinkRowJordan` are intentionally **materialised inline** in the consuming test files (T56/T57/T59/T60/T67) rather than exported as named factories — same shape choice as S023 inlined T47/T48/T49 (recorded as S023 D-214). The `shareUnavailableCopySample` constant lives in `lib/share/copy.ts`, not in the fixtures file.
- `docs/ai/sessions/S024-implement-s11.md` (this file).
- `docs/PROMPT_HISTORY.md` — S024 row appended.

## Tests run

- `npm test` — **220 / 220 passed** (was 149 + 71 new S11 = 220; no MVP / S10 regressions). New S11 file count: 16 (T52, T53, T54, T55, T56, T57, T58, T59, T60, T61, T62, T63, T64, T65, T66, T67, T76).
- `npm run lint` — clean (after `biome check --write` for organize-imports drift on three new files).
- `npm run typecheck` — clean.
- `npm run build` — clean (7 server-rendered routes; was 6 + 1 new `/share/[token]` = 7; Proxy / Middleware registered on `/share/*`).

## Deviations from spec

| Item | Spec says | Delivered | Reason |
|---|---|---|---|
| `<DashboardView />` / `<HistoryList />` / `<UpdateForm />` switched from `formatPounds` → `formatMoney(pence, snapshot.currency, snapshot.countryCode)` | S023 handoff: "rolls the deferred `<DashboardView />` / `<HistoryList />` / `<UpdateForm />` `formatPounds → formatMoney` switch into the same change because S11's `<SharedStatementView />` already needs the new helper." | **Deferred again** — `<SharedStatementView />` uses `formatMoney` from day one, but the existing MVP UI surfaces still use `formatPounds`. | The deferred refactor is genuinely orthogonal to S11's tech-spec section: §S11 doesn't list the existing MVP surfaces in its `Touches:` block, and no T52–T67 / T76 row asserts `formatMoney` on `<DashboardView />` / `<HistoryList />` / `<UpdateForm />`. The on-screen string is byte-identical for `'GBP'` / `'GB'` (the only currency the MVP ships), so the deferral is behaviour-neutral. Workflow rule 3 ("controlled implementation = single-section scope") applies; slot the refactor into its own `/implement` round (or roll into `/implement S12` since S12's PDF surface also needs `formatMoney`). |
| Persona-cookie cross-arm response equality between cross-persona and non-existent snapshot id | TECH_SPEC §S11 ownership check: same response posture across the two arms. | **Delivered** — `GENERIC_SNAPSHOT_ERROR` constant is the single returned value for both arms; T57 asserts `cross.errors === missing.errors` (deep equal). | — |
| `share_links.id` is the reserved future revocation handle | TECH_SPEC §S11 schema D-173. | **Delivered** — column lands as `text("id").primaryKey()` with explanatory comment in `lib/db/schema.ts`; not exposed to the action's return shape. | — |

## Critic round (S024.1 — same-session, in-scope close-out)

`@critic` review of the S11 implementation diff against PRD R6 / R7 / R10 / R12 / R18 / R19 / R20, TECH_SPEC §S11 (rev 5.1), and TEST_PLAN T52–T67 + T76 (rev S022.1). Critic transcript: agent `5c20145b-7559-4b95-98bc-9f5af1827741`. **Verdict: Minor fixes** (no Blockers). Four findings (3 Nit, 1 Suspicion-flag).

### Decisions (post-critic)

- **D-223 (F1.1, Nit — closed):** `tests/s11/t64-shared-view-render.test.tsx` fixture rewritten — the previous `id: \`fixture-${personaId}\`` shape planted the persona id into rendered DOM `id` / `aria-labelledby` / `key` attributes outside the persona-leak scan, weakening the test's confidence even though production `randomUUID()` ids are leak-safe by construction. Replaced with a static UUID-shaped id per persona via the new `snapshotIdByPersona` lookup. T64's `for (const id of personaIds) expect(ariaLabel).not.toContain(id)` and `expect(allText).not.toContain(personaLabel)` halves are now load-bearing.
- **D-224 (F1.2, Nit — closed):** Files-changed list in this snapshot rewritten to reflect the actual `tests/_fixtures/snapshots.ts` shape — only `pinnedNowUtc`, `nowJustAfterExpiry`, `shareTokenPinned` landed there; the TEST_PLAN §2.3 entries `snapshotJordanStoredGbp` / `snapshotPatStoredGbp` / `shareLinkRowJordan` are materialised inline in T56/T57/T59/T60/T67 (same factor-out pattern as S023 D-214 deferred for T47/T48/T49). The `shareUnavailableCopySample` constant lives in `lib/share/copy.ts`, not in the fixtures file. The TEST_PLAN §2.3 reads correctly under the inline-materialisation pattern (the column inventories shapes, not exports).
- **D-225 (F1.3, Nit — closed):** T66's SC 2.5.8 hit-target check tightened from `min-h-*` className regex to a computed-style + `getBoundingClientRect()` measurement on both the pre-mint button and the post-mint readonly input. Implementation was already correct (button is `min-h-10` with text padding, input is `min-h-10`); the assertion is now load-bearing rather than a class-name proxy. T66 now exercises both render paths via `rerender` to satisfy the load-bearing computed-style check on each.
- **D-226 (F1.4, Suspicion-flag — carried forward, not closed in this round):** `lib/affordability/calculator.ts` still uses `formatPounds` for the money strings embedded in `reasons[]`, which `<SharedStatementView />` renders verbatim. Byte-identical for the only currency the MVP ships (`'GBP' / 'GB'`); flagged but not closed because closing it would either (a) drag the calculator + every existing `reasons[]`-asserting test into S11's slice (workflow rule 3 — controlled implementation = single-section scope), or (b) require the calculator to read `currency` / `countryCode` from the snapshot at format time, which is a `/tech-spec` clarification. **Routed forward to `/implement S12`** — S12's PDF surface also reuses `<SharedStatementView />`-equivalent strings, so the `formatPounds → formatMoney` push is naturally one-step-bigger when S12 lands.

### Findings consciously NOT raised by the implementer, raised by the critic, and consciously deferred

- The MVP-surface `formatPounds → formatMoney` refactor across `<DashboardView />` / `<HistoryList />` / `<UpdateForm />` recorded as a Deviation already; deferred to `/implement S12` for the same reason as F1.4 (single-section scope).
- `share_links.id` revocation handle (D-173 / S021) — the column lands but the column is not exposed; the future revocation slice will surface it.
- Wire-layer timing-side-channel parity between resolver miss arms — recorded as a tech-spec carry-out under §6 ("S11 ↔ S12 cross-integration"), not a code-level fix.
- `useActionState` round-trip not exercised end-to-end — same pattern as MVP T24 / T25; recorded as a §6 carry-out.

### Suspicion-flagged carry-forwards

- **F1.4** — `formatPounds` in `calculator.ts#reasons[]` (see D-226 above). Re-verify when `/implement S12` rolls the MVP-surface refactor into the same slice.
- Drizzle-kit-vs-Biome trailing-newline meta-JSON drift continues to fire on every new `drizzle-kit generate` (was S023 F1.10); the post-`drizzle-kit generate` `biome format --write drizzle/meta/*.json` step now needs to land in a `/tech-spec` round to either ignore-list `drizzle/meta/**` or raise upstream.

## Post-critic UX iteration (S024.2 — same-session, user-driven)

Two follow-up changes after the user reviewed `<ShareSnapshotForm />` in the dashboard. Both are user-facing UX fixes scoped to the same component already in the slice's `Touches:` block; no `T*` rows were added against MVP surfaces, no spec edits.

- **D-227 (UX) — `<ShareSnapshotForm />` renders the absolute URL.** The Server Action keeps returning a relative `/share/<token>` path (T56 / T59 / T60 / T67 keep asserting against the relative shape; the on-the-wire payload from the action stays unchanged so the same-response posture is unaffected). The Client Component composes `${window.location.origin}${state.url}` once mounted, with an SSR-safe fallback that returns the path unchanged when `window` is undefined. T66 was tightened with `expect(input.value).toMatch(/^https?:\/\/[^/]+\/share\/[A-Za-z0-9_-]{43}$/)` — the recipient now sees the full host-qualified URL the customer will copy out of band.
- **D-228 (UX + a11y) — "Copy link" button.** Real `<button type="button">` next to the readonly input, `min-h-10 min-w-[6rem]` so SC 2.5.8 keeps holding (T66's existing computed-style check enforces). Click handler uses `navigator.clipboard.writeText(absoluteUrl)`; on older browsers / non-secure contexts the fallback selects the input and prompts the customer to press Ctrl / Cmd + C. State swaps the button label between "Copy link" and "Copied" for two seconds (driven by `useEffect` with a `setTimeout` cleanup so the announcement scope resets when a fresh URL replaces the previous one). Polite live region uses the semantic `<output>` element (Biome `lint/a11y/useSemanticElements` flagged `<p role="status">` — `<output>` carries an implicit `role="status"` + `aria-live="polite"`; the explicit `aria-live` is kept as belt-and-suspenders for AT without the implicit-role mapping). The input's `aria-describedby` is space-separated (ARIA 1.2 multi-id syntax) — points at both the expiry description and the live-region status. **Two new T66 it-cases:** one stubs `navigator.clipboard.writeText` with `vi.fn()` + asserts the absolute URL flows through + asserts the polite live-region announcement; the other strips `navigator.clipboard` entirely + asserts the input gets selected with the keyboard-shortcut prompt visible to AT.

**Verifications after S024.2:** `npm test` 222 / 222 (was 220 + 2 new T66 cases); `npm run lint` clean; `npm run typecheck` clean.

## Status

**Closed.** S11 shipped with the same-session critic close-out (D-223 → D-226) and the user-driven post-critic UX iteration (D-227 → D-228). 222 / 222 tests pass; lint / typecheck / build all clean. F1.4 routed forward to `/implement S12` rather than patched in this slice.

## Handoff

Next slice per tech-spec §3 stretch ordering: **`/implement S12`** (PDF export, T68–T75). Must verify `@react-pdf/renderer` against installed `node_modules` before pinning (per S020 D-144 + S021 D-152). The deferred `formatPounds → formatMoney` MVP-surface refactor naturally rolls into the same slice because S12's `<SnapshotPdf />` / Route Handler also need `formatMoney` from day one.

## Handoff

Next slice per tech-spec §3 stretch ordering: **`/implement S12`** (PDF export, T68–T75).
