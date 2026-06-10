# Customer Financial Health — Product Requirements Document

> **Phase:** PRD
> **Inputs consumed:** `docs/discovery/NOTES.md`, `docs/Ophelos Engineering Take-Home Task.pdf`
> **Withdrawn input:** `docs/TASK_ANALYSIS.md` (a pre-brief analysis; withdrawn S003 D-14). This PRD does not cite it. Dropped-scope items recorded in `docs/discovery/NOTES.md` §7(b) are not reintroduced here.
> **Gate criteria for next phase:**
> - All Must requirements have stable IDs and a `Why` linking to the brief or discovery.
> - Non-goals list is non-empty and explicit.
> - FCA / vulnerability stance is captured as constraints (Section 3) and as Should-class requirements (Section 6).
> - Every open question has a paired working assumption that can be adopted if it stays unresolved.
> **Status:** Draft

---

## 1. Problem statement

Customers in financial difficulty can already log their income and expenditure in Ophelos's app, but the system gives them nothing back: no reflection of their financial position, no honest read on whether their current arrangements are realistic, and no way to see whether things are getting better or worse over time (brief lines 24–33). This product fills that gap with a customer-facing reflection and tracking surface — a meaningful affordability assessment plus a longitudinal view, presented in a way that is appropriate for a vulnerable, FCA-regulated population (brief lines 17–19, 21–23, 56–70).

---

## 2. Users and jobs-to-be-done

| User | Job-to-be-done | Constraint / vulnerability note |
|---|---|---|
| Primary — customer in debt / financial difficulty | Understand their current affordability and whether their position is improving or worsening over time | May be anxious, ashamed, time-poor; may have irregular income; may be in zero or negative disposable-income territory (`NOTES.md` §2 Primary) |
| Tertiary — hiring reviewer | Evaluate product thinking, trade-offs, and AI-assisted delivery from the submission alone | Reads README, `DECISIONS.md`, prompt history, and the PRD/tech-spec/test-plan trail without a live walkthrough (brief lines 94–113; `NOTES.md` §2 Secondary) |

**Vulnerability segments in scope** (`NOTES.md` §2):

- Customers with **zero or negative disposable income** — must be a valid first-class outcome, not a UI dead end.
- Customers with **irregular income** (gig, benefits, variable shifts) — affordability surface must accept the variability rather than force false precision.
- Customers who are **anxious / ashamed / time-poor** — minimise cognitive load, avoid punitive tone, no shaming language.
- Customers who **self-declare a need for extra support** (health, bereavement, abuse, cognitive impairment indicators) — never auto-classified by the product; instead given a clear signpost to human support.

Out-of-scope user roles (financial-support agents, creditors, portfolio managers) are excluded per `NOTES.md` §2 "Out-of-scope user roles" and §7(b).

---

## 3. Regulatory and duty-of-care context

The brief states Ophelos is FCA-authorised and that the software has "real obligations around data sensitivity, fair treatment of vulnerable customers, and explainability of decisions" (brief lines 17–19). All paraphrases below are owned by the discovery doc and labelled there as **not independently verified** against an FCA source (`NOTES.md` §5; OQ-7).

- **Consumer Duty (good outcomes) — paraphrased:** the affordability output must be explainable in plain language; the journey must not nudge customers into unaffordable positions or remove transparency (`NOTES.md` §5 Regulatory).
- **Vulnerability (FG21/1 spirit) — paraphrased:** never auto-label a user as vulnerable from numeric data; provide a clear escape hatch to human support (`NOTES.md` §2 Vulnerable customers, §5 Regulatory).
- **CONC / forbearance posture — paraphrased:** copy and edge-case behaviour are supportive, not collections-aggressive; the product does not offer, book, or record arrangements (`NOTES.md` §5 Regulatory; §7(b)).
- **UK GDPR data minimisation — paraphrased:** store only what the assessment needs; no PII or I&E line items in logs or error trackers (`NOTES.md` §5 Data protection).
- **No real customer data:** all fixtures must be clearly synthetic (`.cursor/rules/10-evidence.mdc` "Sensitive data"; `NOTES.md` §5 Data protection).

---

## 4. Goals

- **G1** — A customer can see a meaningful, plain-language affordability read for their current position, including the case where the answer is "this is not affordable" (brief lines 56, 99–102; `NOTES.md` §4 Customer outcome).
- **G2** — A customer can see how their position has changed across at least two points in time (brief line 57; `NOTES.md` §4, OQ-2).
- **G3** — Hard cases (zero income, expenditure > income, no-data, invalid input) are handled as first-class outcomes — non-alarming, non-shaming, with a route to human support — not as form errors or dead-ends (brief lines 65–68; `NOTES.md` §4, OQ-4).
- **G4** — A reviewer can verify, from the submission alone, that decisions are explainable, data is handled minimally, AI usage is documented, and tests protect the cases that actually matter (brief lines 80–113; `NOTES.md` §4 Reviewer outcome / Submission artefacts).

---

## 5. Non-goals

- **N1** — Real authentication, account linking, Open Banking, or credit-bureau integration — out of scope; demo uses fixed mock customers (`NOTES.md` §6 A-2; §7(c)).
- **N2** — Repayment-plan selection, arrangement booking, plan confirmation, or any "confirm this plan" surface — explicitly dropped at discovery (brief is silent on these; `NOTES.md` §7(b)).
- **N3** — Collections workflow, urgency framing, or arrears-recovery progression in the UI — dropped (`NOTES.md` §7(b)); incompatible with the reflection-layer framing.
- **N4** — Agent-facing console, agent review queues, COps payloads, or any internal-user UI — dropped (`NOTES.md` §7(b)). The customer is the only user with a UI.
- **N5** — Automated vulnerability classification — out; users self-declare via a signpost rather than being inferred-into a vulnerability category (`NOTES.md` §2 Vulnerable customers; §7(c)).
- **N6** — Email / SMS notifications, CRM integration, payments processing — out; no transactional behaviour in this product (`NOTES.md` §7(c)).
- **N7** — Multi-language UI (e.g. Welsh) — deferred until the base experience is solid (`NOTES.md` §7(c)).
- **N8** — Independent verification of FCA / GDPR citations — out for this take-home; paraphrases stay labelled (`NOTES.md` §6 OQ-7).

---

## 6. Requirements

| ID | Requirement | Priority | Category | Why (cite source) |
|---|---|---|---|---|
| R1 | The customer can see a meaningful affordability assessment of their current position — disposable income, a categorical band (surplus / breakeven / shortfall), and a plain-language reading of what the result means for them — and leaves understanding their position, not just receiving a verdict. | Must | Core | brief line 56 (MUST 1) + lines 17–19, 69–70 (FCA decisions surfaced to the customer must be understandable to them) + lines 99–102 (user-perspective lens — "not assessing whether you can implement a formula"); `NOTES.md` §4, §6 OQ-3 |
| R2 | Allow customers to track their financial position over time: each I&E submission creates an immutable snapshot, and the affordability surface shows a delta vs the previous snapshot. | Must | Core | brief line 57 (MUST 2); `NOTES.md` §4, §6 OQ-2 / OQ-3 |
| R3 | The customer can return later and view previously submitted snapshots. | Must | Core | brief line 57 (implied by "track over time"); `NOTES.md` §6 OQ-5 (PRD-level commitment only; tech-spec picks the technology) |
| R4 | Automated tests protect the cases that actually matter — including the edge cases in R5 — not just happy paths. | Must | Core | brief lines 58–59 (MUST 3); `NOTES.md` §4 |
| R5 | Handle the four canonical edge cases as first-class outcomes with non-alarming, non-shaming messaging: (a) income = 0, (b) expenditure > income, (c) no-data state (no I&E submitted yet), (d) invalid input (negative numbers, non-numeric values). | Should | Vulnerability | brief lines 65–66 (SHOULD); `NOTES.md` §4, §6 OQ-4 |
| R6 | Present information in a way appropriate for customers in financial difficulty: supportive, non-judgemental tone; no collections-aggressive language; no nudging into unaffordable positions; no dark patterns. | Should | Vulnerability | brief lines 67–68 (SHOULD); `NOTES.md` §1 "Why this is hard", §4 Customer outcome |
| R7 | Provide a clear, visible signpost to human support on every outcome screen, especially the shortfall and zero-income outcomes. The product never auto-labels a user as vulnerable. | Should | Vulnerability | brief lines 17–19, 67–70; `NOTES.md` §2 Vulnerable customers, §4 Regulatory outcome |
| R8 | Provide a 7-persona fixture set covering the affordability bands and the edge cases — surplus, breakeven, shortfall, zero-income, new-customer (no I&E yet), irregular-income, joint-income household — and exercise it in tests (R4). | Should | Vulnerability | `NOTES.md` §6 OQ-6 (load-bearing for R4 + R5) |
| R9 | The customer can understand the reasoning behind their assessment — *why* their band was assigned, and *how* their position has changed since the previous snapshot — in plain language. | Should | Regulatory | brief line 19 ("explainability of decisions"), brief lines 69–70; `NOTES.md` §4 Regulatory outcome, §6 OQ-3. Pairs with R1 — R1 = the customer understands *what* their position is; R9 = the customer understands *why* and *how it has changed*. |
| R10 | Practise data minimisation: store only what the assessment needs; no PII or I&E line items in application logs or error trackers. | Should | Regulatory | brief line 18, brief lines 69–70; `NOTES.md` §5 Data protection |
| R11 | Add `currency` and `country_code` fields with appropriate schema migrations. | Could | Stretch | brief line 72 |
| R12 | Allow secure statement sharing via a time-limited link. | Could | Stretch | brief line 73 |
| R13 | Generate a PDF export of the statement with appropriate branding. | Could | Stretch | brief line 74 |
| R14 | Ship a `README` at repo root that lets a fresh-clone reviewer run the app without follow-up. | Must | Submission | brief line 107; `NOTES.md` §4 Submission artefacts, §5 Workflow |
| R15 | Ship a `DECISIONS.md` at repo root covering what was built, what was left out, what is next, and why. | Must | Submission | brief lines 86–88, 110–111; `NOTES.md` §4, §5 |
| R16 | Retain and submit the full AI prompt history. | Must | Submission | brief lines 83–85, 108–109; `NOTES.md` §4, §5 |
| R17 | Record approximate time spent on the task. | Must | Submission | brief lines 93, 112–113; `NOTES.md` §4, §5 |
| R18 | The customer can use the product with a screen reader and without precise motor input; the specific accessibility standard and conformance level are chosen by tech-spec. | Should | Vulnerability | brief lines 17–19 (FCA fair treatment), 67–68 (appropriate presentation); `NOTES.md` §2 Vulnerable customers ("screen-reader / motor accessibility are baseline expectations, not stretch") |
| R19 | If any Stretch requirement (R11, R12, R13) is delivered, it is covered by automated tests of the same standard as R4 — protecting real cases, not happy-path-only. | Should | Core | brief line 75 ("Stretch items must be well tested if attempted") |

> No requirements have been dropped in this revision; all IDs above are first-issue. Future revisions must keep IDs append-only and mark removals as `R{n} — DROPPED (reason)` rather than reusing IDs.

---

## 7. Success metrics

| Goal | How we will know it is met |
|---|---|
| G1 | Reviewer can run the app on at least one fixture (R8) and see disposable income, a band, and a plain-language explainer (R1, R9). At least one fixture exercises the "this is not affordable" outcome (R5 case b). |
| G2 | Reviewer can submit a second I&E snapshot for the same customer and see a clear delta vs the previous snapshot (R2). A returning customer sees their previously submitted snapshots (R3). |
| G3 | The four canonical edge cases (R5) each have a dedicated message and a visible support signpost (R7); none surface as form errors or dead-ends. Tests (R4) cover all four. |
| G4 | `DECISIONS.md` (R15), `README` (R14), prompt history (R16), and time-spent note (R17) are all present, internally consistent, and traceable back through the PRD / discovery trail. The affordability output (R1, R9) shows its reasoning rather than emitting an unexplained verdict. |

---

## 8. Open questions and working assumptions

**Open questions** (must be resolved or adopted-as-default before tech-spec):

- **Q1** — Exact numeric thresholds for the surplus / breakeven / shortfall bands (`NOTES.md` §6 OQ-3 left this for PRD).
- **Q2** — How to present the "no previous snapshot" delta state when the customer submits for the first time (`NOTES.md` §6 OQ-3).
- **Q3** — How to handle irregular-income input — accept per-month values as-is, or prompt for an averaging window (`NOTES.md` §2 Primary; OQ-3).
- **Q4** — What snapshot retention period applies? (`NOTES.md` §5 names UK GDPR storage limitation but does not pin a value; §3 paraphrases it but §6 does not address retention.)
- **Q5** — How does the customer correct a snapshot containing an input mistake, given snapshots are immutable (R2)?

**Working assumptions** (adopted if questions remain open):

- **A1** — Default band thresholds: **surplus** when disposable income (DI) > 0; **breakeven** when DI = 0; **shortfall** when DI < 0. A "near-breakeven" band may be added by tech-spec / implementation if a small-positive DI feels misleadingly celebrated. Income = 0 (R5 case a) routes to the shortfall outcome unless expenditure is also 0, in which case it routes to the no-data state (R5 case c).
- **A2** — On the first snapshot, the delta state shows a friendly placeholder ("This is your first snapshot — we'll show how your position changes once you submit again") rather than a numeric delta or an empty cell.
- **A3** — Irregular-income inputs are accepted at the per-month value the customer enters; we display a small note that "income may vary month-to-month" on the affordability surface but do not force an averaging-window UI in MVP.
- **A4** — Snapshots are retained for the lifetime of the customer record in this take-home; production retention rules are out of scope and consistent with N8 (independent verification of FCA / GDPR citations out of scope). Tech-spec / implementation revisit only if a Stretch (R11–R13) later forces the question.
- **A5** — Corrections are made by submitting a new snapshot; previous snapshots remain visible and are not edited, hidden, or deleted. The next snapshot's delta (R2) vs an incorrect prior snapshot may read unusually large; tech-spec / implementation choose whether to surface a "this looks like a correction" affordance.

---

## 9. Traceability table

| Discovery insight | PRD requirement | Notes |
|---|---|---|
| Affordability assessment = disposable + band + explainer + delta vs previous snapshot (`NOTES.md` §1, §4, §6 OQ-3) | R1, R2, R9 | R1 = the customer understands *what* their current position is; R2 = the delta vs previous snapshot; R9 = the customer understands *why* the band was assigned and *how* their position has changed. Together R1 and R9 deliver the FCA "explainability of decisions" outcome (brief lines 17–19, 69–70) framed as user understanding, not formula disclosure. Q1 / A1 set the default thresholds. |
| Track financial position over time via per-submission immutable snapshots (`NOTES.md` §4, §6 OQ-2) | R2, R3 | R2 names the snapshot model; R3 commits to persistence at PRD level (tech-spec picks the technology, per OQ-5). |
| Tests must protect something real, not happy paths only (`NOTES.md` §1, §4) | R4 | R8 is load-bearing here — the persona fixtures give R4 something realistic to assert on. |
| Edge cases are first-class outcomes (`NOTES.md` §4, §6 OQ-4) | R5 | Four-case canonical set (zero income, expenditure > income, no-data, invalid input). |
| Empathetic, non-judgmental presentation (`NOTES.md` §1 "Why this is hard", §2 Primary, §4) | R6 | Tone / no-dark-patterns requirement; copy specifics belong in implementation. |
| Escape hatch to human support; never auto-label vulnerability (`NOTES.md` §2 Vulnerable customers) | R7 | Signposting only — not an agent queue, callback booking, or arrangement handover (excluded per `NOTES.md` §7(b)). |
| FCA-regulated handling of data, storage, and decision surfacing (`NOTES.md` §5; brief lines 17–19, 69–70) | R9, R10 | R9 = explainability; R10 = data minimisation. Section 3 captures the broader stance; paraphrases stay labelled per OQ-7. |
| 7-persona fixture set (`NOTES.md` §6 OQ-6) | R8 | Persona descriptors codified here; per-persona starting £-values are tech-spec / fixture detail and intentionally not pinned in PRD. |
| Persistence: returning customer can view previously submitted snapshots (`NOTES.md` §6 OQ-5) | R3 | PRD records the customer-facing commitment only; tech-spec picks the technology, consulting `node_modules/next/dist/docs/` per `AGENTS.md`. |
| Stretch: currency + country_code + migrations (brief line 72) | R11 | Could; outside MVP unless time. |
| Stretch: time-limited secure statement-share link (brief line 73) | R12 | Could; outside MVP unless time. |
| Stretch: branded PDF export (brief line 74) | R13 | Could; outside MVP unless time. |
| Submission artefacts (brief lines 76–113; `NOTES.md` §4, §5) | R14, R15, R16, R17 | First-class deliverables, not scaffolding. |
| Accessibility baseline — screen-reader and motor accessibility (`NOTES.md` §2 Vulnerable customers) | R18 | Should; the specific accessibility standard and conformance level are chosen by tech-spec. |
| Brief line 75 — "Stretch items must be well tested if attempted" | R19 | Should; conditional on any of R11, R12, R13 being delivered. Extends R4's discipline to delivered stretches without editing R4. |
| OQ-1 resolution — pre-brief arrangement-journey scope dropped; `docs/TASK_ANALYSIS.md` withdrawn (`NOTES.md` §6 OQ-1, §7(b)) | n/a — closed at discovery | Reflected in N2 / N3 / N4 (Section 5); no requirement in this PRD reintroduces dropped scope. |
| FCA / GDPR paraphrases owned by `NOTES.md`, labelled "not independently verified" (`NOTES.md` §6 OQ-7) | n/a — housekeeping | Section 3 inherits the labels; reflected as N8. |
