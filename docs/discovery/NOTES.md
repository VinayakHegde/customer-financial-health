# Discovery notes — Customer Financial Health

> **Phase:** Discovery
> **Inputs consumed:**
> - `docs/Ophelos Engineering Take-Home Task.pdf` (the brief — binding upstream source for build scope)
> - `docs/TASK_ANALYSIS.md` (S001 — background and template input only; **not** binding on PRD)
> - `AGENTS.md` (Next.js docs lookup rule)
> **Source-of-truth note:** `docs/PRD.md` (produced by the next phase) is the source of truth for what gets built. This discovery doc is a phase-1 input to PRD; `docs/TASK_ANALYSIS.md` is a template / reference. PRD reconciles them.
> **Gate criteria for next phase:**
> - Problem, users, constraints, and open questions populated
> - Every concrete claim cites a repo source or is marked `TBC`
> - Traceability table maps each discovery insight to a draft PRD requirement ID (or `TBC`)
> - Any framing differences between the brief and `docs/TASK_ANALYSIS.md` are captured explicitly as open questions for PRD to resolve
> **Status:** Draft

---

## 1. Problem

### What is being solved (and for whom)

The brief is the binding upstream source. `docs/TASK_ANALYSIS.md` (S001) is background / template input — PRD will reconcile and become the source of truth for build scope.

**From the brief — `docs/Ophelos Engineering Take-Home Task.pdf` "The Problem" (lines 24–42).** Customers in debt can already log income and regular outgoings in Ophelos's app, but the system gives them nothing back: no reflection of their financial position, no realism check on repayment options, and no way to track whether things are getting better or worse over time. The brief asks for "something that helps customers understand their financial health, and is genuinely useful to someone trying to manage their way out of debt".

**Background framing from `docs/TASK_ANALYSIS.md` §1 (template-only).** S001 framed the deeper problem as: borrowers who fall behind on repayments need a clear, fair, and sustainable path back to stability, with self-service letting a customer in difficulty understand their position, share enough I&E to assess affordability, explore realistic repayment options, and confirm an arrangement they can actually keep. This framing is **not binding on PRD** — it is carried forward only as context for the user-empathy and FCA-conduct considerations in §4 below.

The brief's "no sense of whether their repayment options are realistic" (line 32) is the bridge between the two: an affordability reflection that is honest enough to tell a customer when a proposed arrangement is unaffordable. PRD will decide how far the product reaches beyond reflection — see §6 open questions.

### Why this is hard

- Translating regulated collections / forbearance policy into software (`docs/TASK_ANALYSIS.md` §1).
- Doing so for users who may be ashamed, anxious, time-poor, or have irregular income (`docs/TASK_ANALYSIS.md` §4).
- Decisions surfaced to users must be explainable and fair, per FCA obligations (brief, lines 17–19).

---

## 2. Users

### Primary — customer in financial difficulty

Cited from the brief, "Our customers" (lines 21–23): "People in debt, often in difficult financial situations. Many are financially vulnerable. The product should treat them accordingly."

Per `docs/TASK_ANALYSIS.md` §4, this user may be:

- **Anxious / time-poor / ashamed** — minimise cognitive load, avoid punitive tone.
- **Of irregular income** (gig work, benefits, variable shifts) — support frequency choices and approximate guidance.
- **Likely to underestimate essential costs** — optional prompts help without forcing exhaustive accounting.
- **In zero or negative disposable-income territory** — must be treated as a valid outcome, not a UI dead end.

### Vulnerable customers (subset of primary)

Per `docs/TASK_ANALYSIS.md` §4 (paraphrasing FCA FG21/1 spirit — _not independently verified against the FCA source in this repo_):

- Vulnerability drivers include health, bereavement, abuse, cognitive impairment, etc.
- The product **should not** auto-label vulnerability from I&E alone; optional self-declaration or "I need extra support" is safer.
- Multiple channels (phone, callback) and screen-reader / motor accessibility are baseline expectations, not stretch.

### Secondary — financial support agent (COps)

Per `docs/TASK_ANALYSIS.md` §1, may review submissions, override edge cases, or continue a journey started digitally. Out of scope for MVP per S001 §7, but informs data shape (a structured, COps-readable submission object).

### Tertiary — reviewer / hiring panel

Per `docs/TASK_ANALYSIS.md` §1 and the brief's "What We're Looking For" (lines 94–103): the reviewer evaluates product thinking, trade-offs, AI-assisted delivery evidence, and code that "behaves correctly in the cases that actually matter".

---

## 3. Why now

### Triggers (cited from the brief)

- **Customer-side gap, today.** Customers log I&E but get no reflection back (brief, lines 25–33). This is a stated current-state gap, not a hypothetical.
- **Repayment realism is unverified by the product.** Customers have "no sense of whether their repayment options are realistic" (brief, line 32). Without a reflection layer, customers can sustain unaffordable arrangements until they default — a conduct concern in an FCA-regulated context.
- **No longitudinal view.** "No way to track whether things are getting better or worse over time" (brief, line 33) — regulators and customers both need this.

### What changes if we don't ship it

- Customers continue to volunteer I&E data with no informational return — a UX failure and a fair-value concern under Consumer Duty (paraphrased from `docs/TASK_ANALYSIS.md` §4; not independently verified).
- The product cannot demonstrate that decisions surfaced to users are explainable (brief, line 19).
- Operational cost stays loaded onto agent channels (`docs/TASK_ANALYSIS.md` §1) without the self-service relief that good reflection enables.

---

## 4. Success signals

Discovery captures **observable outcomes**; quantified targets are PRD's job.

### Customer outcome (from `docs/TASK_ANALYSIS.md` §1 and brief lines 99–102; refined by §6 OQ-2 / OQ-3 / OQ-4 resolutions)

- A customer can leave the journey with an honest, plain-language read of their current affordability — disposable income, a categorical band (surplus / breakeven / shortfall), and an explainer of why — including the case where the answer is "this is not affordable" (per OQ-3).
- A customer can see a longitudinal view of their position: each I&E submission creates an immutable snapshot, and the affordability surface shows a delta vs the previous snapshot (per OQ-2 / OQ-3).
- Edge cases (income = 0, expenditure > income, no-data state, invalid input) are presented as first-class outcomes with clear messages, not as form errors (per OQ-4).
- No dark patterns: no nudging into unaffordable arrangements, no hidden fees, no skipped summaries (`docs/TASK_ANALYSIS.md` §3).

### Regulatory outcome (paraphrased from `docs/TASK_ANALYSIS.md` §4 — not independently verified)

- Decisions are **explainable**: a customer can see _why_ an option is offered or unavailable.
- Communications are accurate and non-misleading.
- Vulnerable users have an **escape hatch** to human support; the journey never strands them.

### Reviewer outcome (cited from the brief, lines 94–103)

- Evidence of user-perspective thinking, reasonable trade-offs, judicious AI use, and tests that "protect something real, not just assert happy paths" (brief, line 58).
- A `DECISIONS.md` that explains scope choices (brief, lines 86–88, 110–111).

### Quantitative metrics

`TBC` — the brief is non-prescriptive and S001 does not set numbers. PRD should decide whether to set targets (e.g. percentage of customers reaching a confirmed plan, accuracy bands on affordability, time-to-confirmation) or explicitly defer them.

---

## 5. Constraints

### Regulatory

| Constraint | Source | Implication |
|---|---|---|
| FCA-authorised firm | Brief, lines 17–19 | "Real obligations around data sensitivity, fair treatment of vulnerable customers, and explainability of decisions." |
| Consumer Duty (outcomes-focused) | `docs/TASK_ANALYSIS.md` §4 (paraphrased; _not independently verified_) | Avoid nudging into unaffordable plans; ensure fair value of self-serve vs dead-ends. |
| CONC (arrears & forbearance) | `docs/TASK_ANALYSIS.md` §4 (paraphrased; _not independently verified_) | Options should resemble realistic forbearance treatments; record what was offered/accepted. |
| Vulnerable-customer policy (FG21/1 spirit) | `docs/TASK_ANALYSIS.md` §4 (paraphrased; _not independently verified_) | Escalation paths when automation is inappropriate; never rely solely on digital completion. |

### Data protection

| Constraint | Source | Implication |
|---|---|---|
| Sensitive financial data | Brief, line 18 | Data minimisation; no logging of I&E line items; no PII in dev consoles or error trackers. |
| UK GDPR | `docs/TASK_ANALYSIS.md` §4 (paraphrased; _not independently verified_) | Purpose limitation; minimal persistence; secure handling. |
| No real customer data | `.cursor/rules/10-evidence.mdc` ("Sensitive data") | All fixtures must be clearly synthetic. |

### Timebox

- The brief does not set an absolute time budget. It says: "send this over at least 24h before your interview" (line 105), "Don't over-engineer" (line 91), "spend 10-15 minutes" on `DECISIONS.md` (line 86), and "Note how long you spent" (line 93).
- `docs/TASK_ANALYSIS.md` §6 Option A (the recommended baseline) is sized at **medium effort, 3–5 focused days**. Treat that as the working budget; revisit at PRD time if the candidate disagrees.

### Tech stack

- The brief permits "any language or framework" (lines 12, 36–38, 89).
- The repo is a Next.js app (per `AGENTS.md` and the existing scaffold under `src/`).
- `AGENTS.md` mandates consulting the in-repo Next.js docs (`node_modules/next/dist/docs/`) before writing Next.js code — current-version conventions may differ from training-data assumptions.

### Workflow

- AI-assisted development is required, not optional (brief, lines 76–93).
- Prompt history must be retained (brief, lines 83–85, 108–109) — already enforced by the `ai-history` user rule and the existing `.specstory/` capture.
- Five-phase gated workflow (`.cursor/rules/00-workflow.mdc`): discovery must complete before PRD; no implementation in this phase.

---

## 6. Assumptions and open questions

Per `.cursor/rules/10-evidence.mdc`, this is the **only** acceptable place to park unknowns. Each item is either an explicit assumption or a `TBC` for PRD to resolve.

### Framing tension between upstream artefacts

- **OQ-1 (blocking for PRD).** The brief frames the product as **financial-health visibility + tracking over time** (brief MUSTs, lines 56–57). `docs/TASK_ANALYSIS.md` §7 scopes a **3-step arrangement journey** (I&E → options → confirm) without longitudinal tracking. PRD is the source of truth and will decide whether MVP **adds** longitudinal tracking, **drops** plan generation/confirmation, or **covers both**. Default if unresolved: treat the brief's MUSTs as ground truth and drop `docs/TASK_ANALYSIS.md` arrangement-journey items that exceed them. `docs/TASK_ANALYSIS.md` remains background only.

### Brief MUSTs not covered by `docs/TASK_ANALYSIS.md`

- **OQ-2 (DIRECTION SET — S003).** "Allow customers to track their financial position over time" (brief, line 57). **Resolved direction:** each I&E submission creates an immutable snapshot. No scheduled jobs, no manual "save" button — submission is the snapshot event. PRD to codify as an `R*` requirement and define the snapshot's data shape.
- **OQ-3 (DIRECTION SET — S003).** "Calculate and display a meaningful affordability assessment" (brief, line 56). **Resolved direction:** the affordability surface = disposable income + categorical band (surplus / breakeven / shortfall) + plain-language explainer + delta vs the previous snapshot. Combines with OQ-2's snapshot model. PRD to specify exact band thresholds, copy, and the "no previous snapshot" delta state. Surface must remain **explainable** per brief line 19.

### Brief edge cases (SHOULD)

- **OQ-4 (DIRECTION SET — S003).** "What happens when income is zero, or expenditure exceeds income?" (brief, lines 65–66). **Resolved direction:** the canonical first-class edge-case set is (a) income = 0, (b) expenditure > income, (c) no-data state (no I&E submitted yet), (d) invalid input (negative numbers, non-numeric values) handled with clear messages. None of these are form errors; all have copy that signposts appropriately. PRD to enumerate the exact behaviours per case.

### Form factor & persistence

- **A-1 (assumption).** Working assumption is a **Next.js web app**, because the repo is already scaffolded that way and `AGENTS.md` exists. The brief permits CLI / REST API / frontend-only / web. Tech-spec phase will confirm or change.
- **OQ-5 (DIRECTION SET — S003).** Persistence model for tracking over time: **SQLite via a lightweight ORM** (server-side, file-based DB). **Scope note:** OQ-5 only covers *snapshot history* — the dynamic, customer-generated time-series produced when the customer submits I&E (per OQ-2). Customer profiles for the 7 fixture personas (per OQ-6) remain as static code/JSON fixtures in the repo, not user-generated DB state. Aligns with brief stretch "Add currency and country_code fields with appropriate schema migrations" (line 72) if that stretch is later attempted. Tech-spec phase chooses the specific ORM (consulting the in-repo Next.js docs per `AGENTS.md`), the schema, and where the DB file lives.

### Authentication & customer identity

- **A-2 (assumption).** Mock authentication with a fixed customer ID is acceptable for MVP, per `docs/TASK_ANALYSIS.md` §3. Real auth, Open Banking, and credit-bureau integration are out of scope.

### Stretch items

- **A-3 (assumption).** `docs/TASK_ANALYSIS.md` §7 explicitly defers Welsh translation, full vulnerability assessment, agent console, CRM integration, and notifications. The brief adds three optional stretches (line 71–74): currency + country_code with migrations, time-limited statement-share links, branded PDF export. PRD to record these as numbered Stretch requirements without committing to them.

### Fixture personas

- **OQ-6 (DIRECTION SET — S003).** Canonical fixture set is **7 personas**, covering the OQ-3 bands, OQ-4 edge cases, and two SHOULD-class income shapes:
  1. **Surplus** — comfortable disposable income (band: surplus).
  2. **Breakeven** — small positive disposable income (band: breakeven).
  3. **Shortfall** — expenditure > income (band: shortfall; OQ-4 case b).
  4. **Zero income** — income = 0 (OQ-4 case a).
  5. **New customer** — no I&E submitted yet, no snapshot history (OQ-4 case c, "no-data state").
  6. **Irregular income** — variable monthly income; affects how disposable income and bands are presented to the customer.
  7. **Joint-income household** — two earners or shared expenditure; different I&E shape.

  PRD codifies the persona schema and per-persona starting values; fixtures live in the repo (not the DB).

### Regulatory citations

- **OQ-7 (DIRECTION SET — S003).** **Resolved direction:** keep paraphrases in §5 and label each clearly as "paraphrased from `docs/TASK_ANALYSIS.md`; not independently verified". Independent verification against the FCA source is out of scope for this take-home. PRD inherits the labels as-is; if a reviewer later requests verified citations, that becomes a separate documentation task.

### Status of open questions

| ID | State | Owner |
|---|---|---|
| OQ-1 | DIRECTION SET — brief MUSTs win by default; S001 dropped where it exceeds them | PRD (final) |
| OQ-2 | DIRECTION SET — per-submission immutable snapshot | PRD (codify as `R*`) |
| OQ-3 | DIRECTION SET — disposable income + band + explainer + delta | PRD (thresholds, copy) |
| OQ-4 | DIRECTION SET — 4-case canonical set | PRD (per-case behaviour) |
| OQ-5 | DIRECTION SET — SQLite via lightweight ORM (snapshot history only) | Tech-spec (ORM, schema, file location) |
| OQ-6 | DIRECTION SET — 7 personas (surplus, breakeven, shortfall, zero-income, new-customer, irregular-income, joint-income) | PRD (per-persona starting values) |
| OQ-7 | DIRECTION SET — keep paraphrases with explicit "paraphrased; not independently verified" labels | PRD (inherit as-is) |

All discovery-level open questions are now direction-set. PRD ratifies them as `R*` requirements with acceptance criteria; tech-spec turns OQ-5 into a concrete technology pick.

---

## 7. Out of scope (for now)

This discovery pass deliberately does **not** produce:

- Numbered PRD requirements (`R*` IDs) — that is the `/prd` phase.
- Acceptance criteria, success metrics with numeric targets, or user stories.
- Tech-spec decisions (form factor, framework, persistence, API shapes).
- Test plans, fixtures, or implementation code.
- Final PRD ratification of OQ-1 through OQ-7 directions set in this session — discovery records the direction; PRD turns each into an `R*` requirement with acceptance criteria, and tech-spec turns OQ-5's "SQLite via lightweight ORM" into a concrete technology pick (ORM, schema, file location).
- Independent verification of FCA references paraphrased from `docs/TASK_ANALYSIS.md` (OQ-7 direction is to keep them as labelled paraphrases).

Carried forward unchanged from `docs/TASK_ANALYSIS.md` §7 as ongoing out-of-scope items: real authentication, Open Banking, credit checks, payments processing, agent console, CRM integration, email/SMS notifications, full vulnerability assessment workflow, Welsh translation, end-to-end test suite (unless time remains).

---

## Traceability — Discovery → PRD

| Discovery insight | Likely PRD requirement | Notes |
|---|---|---|
| Customer-facing affordability assessment: disposable income + band (surplus / breakeven / shortfall) + plain-language explainer + delta vs previous snapshot (brief MUSTs 1+2; brief lines 17–19, 56–57; OQ-3 direction set) | TBC (`R?`) | PRD codifies metric, band thresholds, copy, "no previous snapshot" delta state. |
| Track financial position over time via per-submission immutable snapshots (brief MUST 2; brief line 57; OQ-2 direction set) | TBC (`R?`) | PRD codifies snapshot data shape and history view. Net-new vs `docs/TASK_ANALYSIS.md` MVP. |
| Tests must protect something real, not happy paths only (brief MUST 3; brief lines 58–59) | TBC (`R?`) | Maps cleanly to PRD-level testing requirement. |
| Edge cases handled as first-class outcomes: (a) income=0, (b) expenditure>income, (c) no-data state, (d) invalid input (brief SHOULD; lines 65–66; OQ-4 direction set) | TBC (`R?`) | PRD enumerates exact per-case behaviour and copy. |
| Empathetic, non-judgmental presentation for customers in difficulty (brief SHOULD, line 67–68; `docs/TASK_ANALYSIS.md` §4) | TBC (`R?`) | Likely a "communications & copy" requirement plus a11y baseline. |
| FCA-regulated handling of data, storage, and decision surfacing (brief SHOULD, lines 69–70; brief lines 17–19) | TBC (`R?`) | Splits into data minimisation, no-PII-logging, explainability sub-requirements. |
| Handoff to human support when self-serve is insufficient (`docs/TASK_ANALYSIS.md` §3, §4) | TBC (`R?`) | Vulnerability-aware escape hatch. |
| Persistence: SQLite via lightweight ORM, scope = snapshot history only (OQ-5 direction set) | TBC (`R?`) | PRD records the requirement ("snapshots persist across restarts"); tech-spec picks ORM, schema, file location, consulting `node_modules/next/dist/docs/` per `AGENTS.md`. Aligns with brief stretch "schema migrations" if attempted. |
| Fixture personas: 7-persona set (surplus, breakeven, shortfall, zero-income, new-customer, irregular-income, joint-income) (OQ-6 direction set) | TBC (`R?`) | PRD codifies persona schema and starting values; fixtures live in the repo (not the DB). |
| FCA-citation handling: keep paraphrases, label "paraphrased from S001; not independently verified" (OQ-7 direction set) | n/a — housekeeping | PRD inherits labels as-is; verified citations only if reviewer later requests. |
| Stretch: currency + country_code with migrations (brief, line 72) | TBC (`R?` Stretch) | Out of MVP unless time. SQLite + ORM choice (OQ-5) makes this incrementally feasible. |
| Stretch: time-limited secure statement-share links (brief, line 73) | TBC (`R?` Stretch) | Out of MVP unless time. |
| Stretch: branded PDF export (brief, line 74) | TBC (`R?` Stretch) | Out of MVP unless time. |
| Reconcile S001 arrangement-journey scope vs brief's visibility/tracking scope (OQ-1) | n/a — meta | PRD is the source of truth and must resolve before requirement IDs are issued. Default: brief MUSTs win; S001 is background only. |
