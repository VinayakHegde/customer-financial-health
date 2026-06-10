# Discovery notes — Customer Financial Health

> **Phase:** Discovery
> **Inputs consumed:**
> - `docs/Ophelos Engineering Take-Home Task.pdf` (the brief — **sole binding** upstream source for build scope)
> - `AGENTS.md` (Next.js docs lookup rule)
> - `docs/PRD_TEMPLATE.md` (canonical PRD structure for the next phase)
>
> **Note on `docs/TASK_ANALYSIS.md`:** Withdrawn in S003 (decision D-14). That document was a pre-brief analysis of a collections / arrangement-journey workflow that is **not what the brief asks for**. All useful substance (FCA paraphrases, vulnerability framing, user-empathy context, mock-auth assumption, working timebox) has been **inlined into this document** as repo-owned paraphrases. PRD must not cite the withdrawn doc.
>
> **Source-of-truth note:** `docs/PRD.md` (produced by the next phase) is the source of truth for what gets built. This discovery doc is the phase-1 input to PRD.
>
> **Gate criteria for next phase:**
> - Problem, users, constraints, success signals, and open questions populated
> - Every concrete claim cites a non-withdrawn repo source (the brief), an external source the user has provided, or is marked as a labelled paraphrase / `TBC`
> - Traceability table maps each discovery insight to a draft PRD requirement ID (or `TBC`)
> - Scope is **closed at discovery** (not deferred to PRD): brief MUSTs/SHOULDs/Stretches are in scope; everything in §7(b) — repayment-plan selection, arrangement confirmation, collections workflow, agent review processes, arrears-management tooling, agent-facing UI, `POST /api/arrangements` — is out of scope
> - Submission artefacts (prompt history, `DECISIONS.md`, `README`, time-spent note) are first-class success signals (§4) and constraints (§5), not afterthoughts
>
> **Status:** Draft (refined twice — D-13 dropped arrangement-journey scope; D-14 withdrew `docs/TASK_ANALYSIS.md` and inlined useful substance)

---

## 1. Problem

### What is being solved (and for whom)

The brief is the **sole** binding upstream source. There is no parallel scope document — the pre-brief `docs/TASK_ANALYSIS.md` was withdrawn (see header note / D-14).

**From the brief — `docs/Ophelos Engineering Take-Home Task.pdf` "The Problem" (lines 24–42).** Customers in debt can already log income and regular outgoings in Ophelos's app, but the system gives them nothing back: no reflection of their financial position, no realism check on repayment options, and no way to track whether things are getting better or worse over time. The brief asks for "something that helps customers understand their financial health, and is genuinely useful to someone trying to manage their way out of debt".

**What that means in concrete scope terms.** This product is a **reflection + tracking** surface for the customer:

1. A meaningful affordability assessment displayed to the customer (brief MUST 1, line 56).
2. The ability to track that position over time (brief MUST 2, line 57).
3. Well-targeted tests that protect the cases that actually matter (brief MUST 3, lines 58–59).
4. Edge-case handling, vulnerability-aware presentation, and FCA-shaped data handling / explainability (brief SHOULDs, lines 65–70).

The brief's "no sense of whether their repayment options are realistic" (line 32) sets the bar for the reflection layer: it must be honest enough to tell a customer when a position is unaffordable. It does **not** ask the product to *book* an arrangement, *confirm* a payment plan, expose an arrangements endpoint, or feed an agent review queue — those items are out of scope (§7).

### Why this is hard

- Translating FCA-regulated collections context into a customer-facing reflection surface without nudging users into unaffordable positions (brief lines 17–19, 67–68). The product is a **reflection** layer; it must not behave like a collections workflow (see §7(b)).
- Doing so for users who may be ashamed, anxious, time-poor, or have irregular income (user-empathy paraphrase — not independently verified against an FCA source).
- Decisions surfaced to users must be explainable and fair, per FCA obligations (brief, lines 17–19).

---

## 2. Users

### Primary — customer in financial difficulty

Cited from the brief, "Our customers" (lines 21–23): "People in debt, often in difficult financial situations. Many are financially vulnerable. The product should treat them accordingly."

User-empathy paraphrase (owned by this document; not independently verified against an FCA source):

- **Anxious / time-poor / ashamed** — minimise cognitive load, avoid punitive tone.
- **Of irregular income** (gig work, benefits, variable shifts) — support frequency choices and approximate guidance.
- **Likely to underestimate essential costs** — optional prompts help without forcing exhaustive accounting.
- **In zero or negative disposable-income territory** — must be treated as a valid outcome, not a UI dead end.

### Vulnerable customers (subset of primary)

Paraphrasing FCA FG21/1 spirit (owned by this document; **not independently verified** against the FCA source in this repo):

- Vulnerability drivers include health, bereavement, abuse, cognitive impairment, etc.
- The product **should not** auto-label vulnerability from I&E alone; optional self-declaration or "I need extra support" is safer.
- Multiple channels (phone, callback) and screen-reader / motor accessibility are baseline expectations, not stretch.

### Secondary — reviewer / hiring panel

Cited from the brief's "What We're Looking For" (lines 94–103): the reviewer evaluates product thinking, trade-offs, AI-assisted delivery evidence, and code that "behaves correctly in the cases that actually matter" (line 102). The reviewer is a real user of this submission and the submission artefacts (§4 / §5) exist for them.

### Out-of-scope user roles

The following user types appeared in the pre-brief framing (`docs/TASK_ANALYSIS.md`, now withdrawn) but are **not** in scope for this product (see §7(b) for the full list of dropped scope items):

- **Financial-support agents / COps** — no agent review queues, no agent-facing console, no agent-readable submission objects beyond what the customer surface naturally produces.
- **Creditors / portfolio managers** — no creditor-side dashboards, no portfolio reporting.

---

## 3. Why now

### Triggers (cited from the brief)

- **Customer-side gap, today.** Customers log I&E but get no reflection back (brief, lines 25–33). This is a stated current-state gap, not a hypothetical.
- **Repayment realism is unverified by the product.** Customers have "no sense of whether their repayment options are realistic" (brief, line 32). Without a reflection layer, customers can sustain unaffordable arrangements until they default — a conduct concern in an FCA-regulated context.
- **No longitudinal view.** "No way to track whether things are getting better or worse over time" (brief, line 33) — regulators and customers both need this.

### What changes if we don't ship it

- Customers continue to volunteer I&E data with no informational return — a UX failure and a fair-value concern under Consumer Duty (paraphrased; **not independently verified** against the FCA source).
- The product cannot demonstrate that decisions surfaced to users are explainable (brief, line 19).
- Operational cost stays loaded onto human support channels without the self-service relief that a good customer-facing reflection surface enables. The product is not an agent-facing tool (§7(b)); the relief comes from giving the customer a clearer position, not from routing work to agents.

---

## 4. Success signals

Discovery captures **observable outcomes**; quantified targets are PRD's job.

### Customer outcome (from brief lines 99–102; refined by §6 OQ-2 / OQ-3 / OQ-4 resolutions)

- A customer can leave the journey with an honest, plain-language read of their current affordability — disposable income, a categorical band (surplus / breakeven / shortfall), and an explainer of why — including the case where the answer is "this is not affordable" (per OQ-3).
- A customer can see a longitudinal view of their position: each I&E submission creates an immutable snapshot, and the affordability surface shows a delta vs the previous snapshot (per OQ-2 / OQ-3).
- Edge cases (income = 0, expenditure > income, no-data state, invalid input) are presented as first-class outcomes with clear messages, not as form errors (per OQ-4).
- No dark patterns: no nudging into unaffordable positions, no hidden fees, no skipped summaries (owned product principle for this surface).

### Regulatory outcome (paraphrased — not independently verified against an FCA source)

- Decisions are **explainable**: a customer can see _why_ an option is offered or unavailable.
- Communications are accurate and non-misleading.
- Vulnerable users have an **escape hatch** to human support; the journey never strands them.

### Reviewer outcome (cited from the brief, lines 94–103)

- Evidence of user-perspective thinking, reasonable trade-offs, judicious AI use, and tests that "protect something real, not just assert happy paths" (brief, line 58).

### Submission artefacts (first-class — cited directly from the brief)

The brief's "Submission Checklist" (lines 104–113) and "How We Want You to Work" (lines 76–93) name four artefacts that are graded alongside the code itself. They are in scope for this product as deliverables, not as scaffolding:

- **`README`** covering how to run it (brief, line 107). Must be enough for the reviewer to clone + run without follow-up.
- **Prompt history** — full retained transcript of AI usage (brief, lines 83–85, 108–109). Already enforced by the `ai-history` user rule and the existing `.specstory/` capture, plus the curated `docs/ai/sessions/` snapshots and `docs/PROMPT_HISTORY.md`.
- **`DECISIONS.md`** at repo root — what was built, what was left out, what's next, and why (brief, lines 86–88, 110–111). Brief allocates 10–15 minutes to it; treat it as scope-bearing, not boilerplate.
- **Time-spent note** — a rough record of effort (brief, lines 93, 112–113).

These artefacts are how the reviewer evaluates *how* AI was used, not just *what* was produced (brief, lines 80–81); discovery treats them as observable success signals.

### Quantitative metrics

`TBC` — the brief is intentionally non-prescriptive ("This is intentionally open. You're not being given a spec, you're being given a problem." — brief lines 39–42). PRD should decide whether to set targets (e.g. accuracy bands on affordability copy, percentage of edge cases with named handling, prompt-history coverage) or explicitly defer them. Note: targets framed around "customers reaching a confirmed plan" or "time-to-confirmation" are **not** appropriate — there is no plan-confirmation surface in scope (§7).

---

## 5. Constraints

### Regulatory

| Constraint | Source | Implication |
|---|---|---|
| FCA-authorised firm | Brief, lines 17–19 | "Real obligations around data sensitivity, fair treatment of vulnerable customers, and explainability of decisions." |
| Consumer Duty (outcomes-focused) | Paraphrase owned by this document; _not independently verified_ against the FCA source | Avoid nudging into unaffordable positions; ensure fair value of the self-serve surface (no dead-ends). |
| CONC (arrears & forbearance) | Paraphrase owned by this document; _not independently verified_ against the FCA source | Reflection-layer copy and edge-case behaviour must be consistent with forbearance-aware language; the product itself does **not** offer, book, or record arrangements (§7(b)). |
| Vulnerable-customer policy (FG21/1 spirit) | Paraphrase owned by this document; _not independently verified_ against the FCA source | Escalation paths when automation is inappropriate; never rely solely on digital completion. |

### Data protection

| Constraint | Source | Implication |
|---|---|---|
| Sensitive financial data | Brief, line 18 | Data minimisation; no logging of I&E line items; no PII in dev consoles or error trackers. |
| UK GDPR | Paraphrase owned by this document; _not independently verified_ against the UK GDPR source | Purpose limitation; minimal persistence; secure handling. |
| No real customer data | `.cursor/rules/10-evidence.mdc` ("Sensitive data") | All fixtures must be clearly synthetic. |

### Timebox

- The brief does not set an absolute time budget. It says: "send this over at least 24h before your interview" (line 105), "Don't over-engineer" (line 91), "spend 10-15 minutes" on `DECISIONS.md` (line 86), and "Note how long you spent" (line 93).
- Working budget for this take-home: **medium effort, 3–5 focused days** of elapsed work — sized to leave room for the brief's mandatory submission artefacts (§5 Workflow) without over-engineering. PRD can revise.

### Tech stack

- The brief permits "any language or framework" (lines 12, 36–38, 89).
- The repo is a Next.js app (per `AGENTS.md` and the existing scaffold under `src/`).
- `AGENTS.md` mandates consulting the in-repo Next.js docs (`node_modules/next/dist/docs/`) before writing Next.js code — current-version conventions may differ from training-data assumptions.

### Workflow

- AI-assisted development is required, not optional (brief, lines 76–93). The brief explicitly asks: "we're as interested in how you use it as in what you produce" (lines 80–81).
- **Submission artefacts are mandatory deliverables**, not optional (brief, lines 76–93, 104–113):
  - Prompt history retained in full (lines 83–85, 108–109) — already enforced by the `ai-history` user rule, `.specstory/` capture, curated `docs/ai/sessions/`, and `docs/PROMPT_HISTORY.md`.
  - `DECISIONS.md` at repo root (lines 86–88, 110–111) — 10–15 minutes of scope rationale.
  - `README` covering how to run the app (line 107).
  - Time-spent note (lines 93, 112–113).
- Five-phase gated workflow (`.cursor/rules/00-workflow.mdc`): discovery must complete before PRD; no implementation in this phase.
- "Don't over-engineer the submission" (brief, line 91) — discovery flags this as a constraint on PRD's requirement count and tech-spec's abstraction count.

---

## 6. Assumptions and open questions

Per `.cursor/rules/10-evidence.mdc`, this is the **only** acceptable place to park unknowns. Each item is either an explicit assumption or a `TBC` for PRD to resolve.

### Framing tension between upstream artefacts (now closed)

- **OQ-1 (RESOLVED — D-13 / D-14).** The brief frames the product as **financial-health visibility + tracking over time** (brief MUSTs, lines 56–57). A pre-brief analysis (`docs/TASK_ANALYSIS.md`, now withdrawn per D-14) framed a 3-step arrangement journey (I&E → options → confirm) with `POST /api/arrangements`, agent review queues, and a collections-style workflow. **Resolution:** the brief's MUSTs are ground truth. All arrangement-booking, plan-selection, plan-confirmation, agent-review, and arrears-management items are **dropped** and listed explicitly in §7(b) (out of scope). The pre-brief analysis document has been withdrawn from the repo; its still-useful substance (FCA paraphrases, vulnerability framing, user-empathy context, mock-auth assumption, working timebox) has been inlined into this discovery doc. PRD does not re-open this.

### Brief MUSTs (now ground truth for scope)

- **OQ-2 (DIRECTION SET — S003).** "Allow customers to track their financial position over time" (brief, line 57). **Resolved direction:** each I&E submission creates an immutable snapshot. No scheduled jobs, no manual "save" button — submission is the snapshot event. PRD to codify as an `R*` requirement and define the snapshot's data shape.
- **OQ-3 (DIRECTION SET — S003).** "Calculate and display a meaningful affordability assessment" (brief, line 56). **Resolved direction:** the affordability surface = disposable income + categorical band (surplus / breakeven / shortfall) + plain-language explainer + delta vs the previous snapshot. Combines with OQ-2's snapshot model. PRD to specify exact band thresholds, copy, and the "no previous snapshot" delta state. Surface must remain **explainable** per brief line 19.

### Brief edge cases (SHOULD)

- **OQ-4 (DIRECTION SET — S003).** "What happens when income is zero, or expenditure exceeds income?" (brief, lines 65–66). **Resolved direction:** the canonical first-class edge-case set is (a) income = 0, (b) expenditure > income, (c) no-data state (no I&E submitted yet), (d) invalid input (negative numbers, non-numeric values) handled with clear messages. None of these are form errors; all have copy that signposts appropriately. PRD to enumerate the exact behaviours per case.

### Form factor & persistence

- **A-1 (assumption).** Working assumption is a **Next.js web app**, because the repo is already scaffolded that way and `AGENTS.md` exists. The brief permits CLI / REST API / frontend-only / web. Tech-spec phase will confirm or change.
- **OQ-5 (DIRECTION SET — S003).** Persistence model for tracking over time: **SQLite via a lightweight ORM** (server-side, file-based DB). **Scope note:** OQ-5 only covers *snapshot history* — the dynamic, customer-generated time-series produced when the customer submits I&E (per OQ-2). Customer profiles for the 7 fixture personas (per OQ-6) remain as static code/JSON fixtures in the repo, not user-generated DB state. Aligns with brief stretch "Add currency and country_code fields with appropriate schema migrations" (line 72) if that stretch is later attempted. Tech-spec phase chooses the specific ORM (consulting the in-repo Next.js docs per `AGENTS.md`), the schema, and where the DB file lives.

### Authentication & customer identity

- **A-2 (assumption).** Mock authentication with a fixed customer ID is acceptable for this take-home — the brief does not require real auth (the brief is silent on auth, and a take-home is not the place to build it). Real auth, Open Banking, and credit-bureau integration are out of scope.

### Stretch items

- **A-3 (assumption).** The brief lists three optional stretches (lines 71–74): currency + country_code with migrations, time-limited statement-share links, branded PDF export. PRD to record these as numbered Stretch requirements without committing to them. Other items that a reasonable reader might assume are in scope but are explicitly deferred — Welsh translation, full automated vulnerability classification, agent console / CRM integration, email/SMS notifications — are recorded in §7(c).

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

- **OQ-7 (DIRECTION SET — S003; revised D-14).** **Resolved direction:** the FCA / GDPR paraphrases in §5 (and the vulnerability paraphrase in §2) are owned by this document and labelled "_not independently verified_ against the FCA source". They are no longer attributed to the withdrawn pre-brief analysis. Independent verification against the FCA source is out of scope for this take-home. PRD inherits the labels as-is; if a reviewer later requests verified citations, that becomes a separate documentation task.

### Status of open questions

| ID | State | Owner |
|---|---|---|
| OQ-1 | RESOLVED (D-13 / D-14) — brief MUSTs are ground truth; pre-brief arrangement-journey items dropped (§7(b)); `docs/TASK_ANALYSIS.md` withdrawn | Closed at discovery; PRD does not re-open |
| OQ-2 | DIRECTION SET — per-submission immutable snapshot | PRD (codify as `R*`) |
| OQ-3 | DIRECTION SET — disposable income + band + explainer + delta | PRD (thresholds, copy) |
| OQ-4 | DIRECTION SET — 4-case canonical set | PRD (per-case behaviour) |
| OQ-5 | DIRECTION SET — SQLite via lightweight ORM (snapshot history only) | Tech-spec (ORM, schema, file location) |
| OQ-6 | DIRECTION SET — 7 personas (surplus, breakeven, shortfall, zero-income, new-customer, irregular-income, joint-income) | PRD (per-persona starting values) |
| OQ-7 | DIRECTION SET — keep paraphrases with explicit "paraphrased; not independently verified" labels | PRD (inherit as-is) |

All discovery-level open questions are now direction-set. PRD ratifies them as `R*` requirements with acceptance criteria; tech-spec turns OQ-5 into a concrete technology pick.

---

## 7. Out of scope (for now)

This section lists three classes of out-of-scope items: (a) artefact-level items this discovery pass does not produce, (b) **product-scope items explicitly dropped** because they pre-dated the brief and the brief does not ask for them, and (c) other items deferred for take-home scope reasons.

### (a) Artefact-level — not produced in this phase

- Numbered PRD requirements (`R*` IDs) — that is the `/prd` phase.
- Acceptance criteria, success metrics with numeric targets, or user stories.
- Tech-spec decisions (form factor, framework, persistence, API shapes).
- Test plans, fixtures, or implementation code.
- Final PRD ratification of OQ-2 through OQ-7 directions set in this session — discovery records the direction; PRD turns each into an `R*` requirement with acceptance criteria, and tech-spec turns OQ-5's "SQLite via lightweight ORM" into a concrete technology pick (ORM, schema, file location).
- Independent verification of the FCA / GDPR paraphrases in §2 / §5 (OQ-7 direction is to keep them as labelled paraphrases).

### (b) Product scope — explicitly dropped (brief is binding)

The following items pre-dated the brief (they appeared in the withdrawn `docs/TASK_ANALYSIS.md`) and are **not** in the brief. They are dropped and PRD must not reintroduce them:

- **Repayment-plan selection** — no surface that asks the customer to choose between repayment options.
- **Arrangement confirmation** — no I&E → options → confirm wizard; no plan-acceptance flow; no "confirm this plan" button.
- **Collections workflow** — no collections-style language, urgency framing, or arrears-recovery progression in the UI.
- **Agent review processes** — no queue of submissions for COps / financial-support agents to action; no agent triage UI; no internal-user review screen.
- **Arrears-management tooling** — no arrears summary surface, no recovery-action UI, no agent-side notes / case-note construct.
- **Repayment-arrangement booking** — no surface to commit a customer to a repayment arrangement.
- **Payment-plan confirmation** — no UI or API for a customer to accept or sign off a payment plan.
- **`POST /api/arrangements` (or equivalent)** — no arrangements endpoint; the product's API surface, if any, serves the reflection + tracking model only.
- **Agent-facing console or override UI** — no internal-user surface; the customer is the only user with a UI.
- **COps-readable submission objects beyond what the customer surface naturally produces** — no bespoke agent payload shape.

The product is, in scope terms, a **customer-facing reflection + tracking surface**. Anything beyond that is out.

### (c) Other deferred items (take-home scope)

Real authentication, Open Banking, credit checks, payments processing, CRM integration, email/SMS notifications, full automated vulnerability classification, Welsh translation, exhaustive end-to-end test suite (unless time remains).

---

## Traceability — Discovery → PRD

| Discovery insight | Likely PRD requirement | Notes |
|---|---|---|
| Customer-facing affordability assessment: disposable income + band (surplus / breakeven / shortfall) + plain-language explainer + delta vs previous snapshot (brief MUSTs 1+2; brief lines 17–19, 56–57; OQ-3 direction set) | TBC (`R?`) | PRD codifies metric, band thresholds, copy, "no previous snapshot" delta state. |
| Track financial position over time via per-submission immutable snapshots (brief MUST 2; brief line 57; OQ-2 direction set) | TBC (`R?`) | PRD codifies snapshot data shape and history view. |
| Tests must protect something real, not happy paths only (brief MUST 3; brief lines 58–59) | TBC (`R?`) | Maps cleanly to PRD-level testing requirement. |
| Edge cases handled as first-class outcomes: (a) income=0, (b) expenditure>income, (c) no-data state, (d) invalid input (brief SHOULD; lines 65–66; OQ-4 direction set) | TBC (`R?`) | PRD enumerates exact per-case behaviour and copy. |
| Empathetic, non-judgmental presentation for customers in difficulty (brief SHOULD, line 67–68; §2 user-empathy paraphrase) | TBC (`R?`) | Likely a "communications & copy" requirement plus a11y baseline. |
| FCA-regulated handling of data, storage, and decision surfacing (brief SHOULD, lines 69–70; brief lines 17–19) | TBC (`R?`) | Splits into data minimisation, no-PII-logging, explainability sub-requirements. |
| Escape hatch to human support when self-serve is insufficient — signposting only, no in-product agent handover (brief lines 17–19, 69–70; §2 vulnerability paraphrase) | TBC (`R?`) | Vulnerability-aware copy / link / phone signpost; **not** an agent queue, **not** a callback booking, **not** an arrangement handover. See §7(b). |
| Persistence: SQLite via lightweight ORM, scope = snapshot history only (OQ-5 direction set) | TBC (`R?`) | PRD records the requirement ("snapshots persist across restarts"); tech-spec picks ORM, schema, file location, consulting `node_modules/next/dist/docs/` per `AGENTS.md`. Aligns with brief stretch "schema migrations" if attempted. |
| Fixture personas: 7-persona set (surplus, breakeven, shortfall, zero-income, new-customer, irregular-income, joint-income) (OQ-6 direction set) | TBC (`R?`) | PRD codifies persona schema and starting values; fixtures live in the repo (not the DB). |
| FCA-citation handling: keep paraphrases in §2 / §5, owned by this document, labelled "_not independently verified_" (OQ-7 direction set; revised D-14) | n/a — housekeeping | PRD inherits labels as-is; verified citations only if reviewer later requests. |
| Stretch: currency + country_code with migrations (brief, line 72) | TBC (`R?` Stretch) | Out of MVP unless time. SQLite + ORM choice (OQ-5) makes this incrementally feasible. |
| Stretch: time-limited secure statement-share links (brief, line 73) | TBC (`R?` Stretch) | Out of MVP unless time. |
| Stretch: branded PDF export (brief, line 74) | TBC (`R?` Stretch) | Out of MVP unless time. |
| Submission artefacts — `README`, prompt history, `DECISIONS.md`, time-spent note (brief lines 76–93, 104–113) | TBC (`R?`) | First-class deliverable per §4 / §5; PRD codifies acceptance criteria (e.g. `README` runs cleanly on a fresh clone; `DECISIONS.md` covers built / left-out / next-up; prompt history complete; time-spent recorded). |
| OQ-1 resolution — pre-brief arrangement-journey scope dropped; `docs/TASK_ANALYSIS.md` withdrawn; brief MUSTs/SHOULDs are scope (§7(b)) | n/a — closed at discovery | Not a PRD requirement; PRD must not reintroduce dropped items. |
