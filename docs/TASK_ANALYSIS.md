# Task Analysis: Customer Financial Health

**Session:** S001 (task analysis)  
**Date:** 2026-06-10  
**Status:** Analysis only — no implementation in this session

> **Note on source material:** No formal engineering brief (PRD/PDF) is committed to this repository yet. This analysis is grounded in the project name and domain (FCA-regulated consumer lending, customers in financial difficulty), the existing Next.js scaffold, and standard Financial Health product patterns (income & expenditure assessment, affordable repayment arrangements, empathetic self-service). When the official brief is added, reconcile MUST/SHOULD lists against it.

---

## 1. Problem summary

### What problem is being solved?

Borrowers who fall behind on repayments need a **clear, fair, and sustainable path back to stability**. Today, much of this work is handled manually by specialist teams (phone, email, case notes). The task is to build a **customer-facing digital experience** that helps someone in financial difficulty:

- understand their current position (what they owe, what is overdue),
- share enough about income and essential spending to assess affordability,
- explore **realistic repayment options**, and
- confirm an arrangement they can actually keep.

The engineering challenge is not just forms and calculations — it is translating regulated collections/forbearance policy into software that produces **good customer outcomes** without overwhelming or harming vulnerable users.

### Who are the users?

| User | Role |
|------|------|
| **Primary — customer in difficulty** | Has an active loan/credit product, may be in arrears or at risk of arrears, needs to propose or accept a repayment plan |
| **Secondary — financial support agent (COps)** | May review submissions, override edge cases, or continue a journey started digitally (often out of scope for MVP but informs data shape) |
| **Tertiary — reviewer / hiring panel** | Evaluates product thinking, code quality, tests, and AI-assisted delivery evidence |

### Why does the problem matter?

- **Customer outcome:** Wrong or opaque arrangements increase stress, default, and long-term harm; sustainable plans improve recovery and trust.
- **Regulatory outcome:** FCA **Consumer Duty** and **CONC** require firms to treat customers fairly, exercise forbearance, and ensure communications and outcomes are appropriate — especially in collections and financial difficulty.
- **Business outcome:** Self-service reduces operational cost and speeds up resolution when journeys are designed well; badly designed self-service creates complaints and conduct risk.
- **Engineering outcome:** This domain combines **domain logic** (affordability, plan rules), **sensitive data**, and **high UX bar** — a strong signal of how a candidate thinks beyond CRUD.

---

## 2. Explicit requirements

Requirements below reflect what a typical take-home brief in this space specifies. Mark any item **TBC** until the official brief is confirmed.

### Must requirements

- **M1 — Customer context:** Show the customer’s borrowing position (e.g. product type, balance, amount in arrears, contractual payment) using provided mock/fixture data.
- **M2 — Income & expenditure (I&E):** Capture income and essential expenditure categories sufficient to derive **disposable income** (or equivalent affordability metric).
- **M3 — Affordability logic:** Apply documented rules to determine what the customer can afford to pay (e.g. disposable income capped/floored, minimum token payments where policy allows).
- **M4 — Repayment options:** Present at least two **distinct, pre-defined plan types** (e.g. reduced monthly payment over remaining term, short-term lower payment with catch-up, or fixed temporary arrangement) derived from affordability and product rules.
- **M5 — Plan selection & confirmation:** Let the customer select one option and see a **plain-language summary** before confirming (amount, duration, impact on balance/arrears where applicable).
- **M6 — Submission outcome:** Persist or simulate submission (API route + in-memory/JSON store is sufficient) and show a confirmation state with next steps.
- **M7 — Validation:** Client- and server-side validation for required fields, sensible numeric bounds, and invalid combinations (e.g. negative income, plan unaffordable vs stated disposable income).
- **M8 — Tests:** Automated tests for core affordability/plan calculation logic (unit tests minimum).
- **M9 — Runnable app:** `lint`, `typecheck`, and `build` pass; README explains how to run and any assumptions.
- **M10 — AI delivery evidence:** Maintain prompt history / session snapshots per project rules (already started).

### Should requirements

- **S1 — Progressive disclosure:** Multi-step journey (overview → I&E → options → confirm) rather than one overwhelming form.
- **S2 — Accessibility:** WCAG-minded patterns — labels, focus order, error association, sufficient contrast, keyboard navigation.
- **S3 — Empathetic copy:** Non-judgmental language; explain *why* information is requested; signpost free debt advice (e.g. MoneyHelper, StepChange) without replacing regulated advice.
- **S4 — Error recovery:** Save progress within session; clear inline errors; allow back navigation without losing data.
- **S5 — Server authority:** Business rules enforced in server-side code (Route Handlers / server actions), not only in the browser.
- **S6 — Domain module structure:** Separate pure calculation/policy code from UI and transport layers for testability.
- **S7 — Sensitive data hygiene:** No logging of I&E details; minimal persistence; no secrets in repo.

### Stretch requirements

- **X1 — Vulnerability capture:** Optional flags or triggers (e.g. mental health, bereavement) that adjust copy or route to human support — without automated medical diagnosis.
- **X2 — Agent view:** Read-only internal screen listing submitted arrangements for review.
- **X3 — Scenario switcher:** Dev-only persona switcher (single / joint income, high essential costs, zero disposable income).
- **X4 — Audit trail:** Immutable event log of plan offered → selected → confirmed with timestamps.
- **X5 — Localisation / Welsh language** (if brief targets UK-wide conduct standards).
- **X6 — E2E tests** for the happy path (Playwright).

---

## 3. Implied requirements

### Expectations not stated directly

- **Conduct-by-design:** Even in a toy app, reviewers expect awareness that this is not a generic fintech dashboard — language and flows should reflect **forbearance**, not aggressive collections.
- **Explainability:** Customers should understand *why* a plan is offered or unavailable; “computer says no” without reason fails both UX and Consumer Duty spirit.
- **Deterministic rules:** Calculations should be reproducible from fixtures; magic numbers belong in config or typed constants with comments referencing policy intent.
- **Honest scope:** Mock auth (fixed customer ID) is acceptable; fake bank linking or credit bureau integration is not expected.
- **Documentation of trade-offs:** Short ADR-style notes (even in README) on what was deprioritised and why — valued in take-home review.
- **Production-shaped code:** Types, linting, folder structure, and tests matter as much as visual polish.

### What would make the feature genuinely useful?

- Plans that reflect **real disposable income**, not just dividing arrears by months.
- Clear **total cost and duration** comparison between options.
- Obvious **escape hatches** (“talk to us”, “get free advice”) when self-serve is insufficient.
- **No dark patterns** — pre-selected unaffordable plans, hidden fees, or confirm buttons that skip summary.
- COps-ready payload: structured submission object an agent could pick up without re-keying.

---

## 4. User considerations

### Customers in financial difficulty

- May be ** ashamed, anxious, or time-poor** — minimise cognitive load; avoid punitive tone (“overdue”, “failed”) where softer alternatives work (“behind on payments”, “let’s find a plan”).
- May have ** irregular income** (gig work, benefits, variable shifts) — support frequency choices or “approximate” guidance with validation bounds.
- May ** underestimate essential costs** — optional prompts (e.g. energy, childcare) help without forcing exhaustive accounting in MVP.
- **Zero or negative disposable income** is a valid outcome → route to human support / advice, not broken UI.

### Vulnerable customers

- Vulnerability drivers (FCA FG21/1 spirit): health, bereavement, abuse, cognitive impairment, etc.
- Software should **not** auto-label vulnerability from I&E alone; optional self-declaration or “I need extra support” is safer.
- Provide **multiple channels** (phone, web callback) and never rely solely on digital completion.
- Consider **screen reader and motor** accessibility as baseline, not stretch — vulnerable users disproportionately depend on them.

### FCA-regulated environment

| Theme | Implication for build |
|-------|-------------------------|
| **Consumer Duty** | Outcomes-focused copy; fair value of self-serve vs dead-ends; avoid nudging into unaffordable plans |
| **CONC (arrears & forbearance)** | Options should resemble realistic forbearance treatments; record what was offered/accepted |
| **Financial promotions** | Marketing claims out of scope; in-journey text is still “customer communication” — accurate, not misleading |
| **Data protection (UK GDPR)** | Data minimisation, purpose limitation, secure handling; privacy notice link or stub |
| **Vulnerable customers policy** | Escalation paths when automation is inappropriate |

---

## 5. Risks

### Product risks

- **Unaffordable plans presented as “affordable”** → conduct and complaint risk; mitigated by conservative rules and clear disclaimers that confirmation is subject to review if policy requires.
- **Over-automation** → customer confirms plan they cannot sustain; mitigated by human handoff for edge cases and review queue (stretch).
- **Scope creep into full collections platform** → misses take-home deadline; mitigated by strict MVP boundaries.

### UX risks

- **Form fatigue** on I&E → abandonment; mitigated by step wizard, defaults, and progress indicator.
- **Alarmist visual design** → increases distress; mitigated by calm layout and supportive microcopy.
- **Ambiguous plan comparison** → wrong choice; mitigated by side-by-side summary table with totals and dates.

### Technical risks

- **Business rules scattered in components** → untestable; mitigated by `domain/` pure functions.
- **Client-only validation** → trivial bypass; mitigated by server re-validation on submit.
- **Next.js App Router unfamiliarity** (project uses Next 16) → consult local `node_modules/next/dist/docs/` before patterns; avoid deprecated APIs.

### Data-handling risks

- **Logging PII/financial details** in dev consoles or error trackers → disable for I&E fields.
- **Persisting sensitive data insecurely** → in-memory or local JSON for demo; document production would use encryption, retention limits, and access controls.
- **Fixture data realism** → use synthetic personas only; never real customer records.

---

## 6. Candidate solution options

### Option A — Wizard + pure domain layer + mock API (recommended baseline)

**Description:** Multi-step App Router UI; affordability/plan engine in typed pure functions; Route Handlers accept/validate submissions into JSON or in-memory store.

| | |
|---|---|
| **Benefits** | Clear separation of concerns; easy unit tests; fits take-home timebox; demonstrates product empathy in UX layer |
| **Drawbacks** | No real persistence; agent workflow omitted; plan rules may stay simplified |
| **Effort** | **Medium (3–5 focused days)** — appropriate for take-home |

### Option B — Server-first with database (Postgres/SQLite) and auth

**Description:** Prisma + SQLite/Postgres; session-based customer auth; full submission history and agent read API.

| | |
|---|---|
| **Benefits** | Production-realistic persistence; stronger story for audit trail and idempotent submissions |
| **Drawbacks** | Migrations, auth, and infra distract from domain/UX review; easy to over-engineer |
| **Effort** | **High (5–8 days)** — risky for fixed take-home window |

### Option C — Static plan calculator (single page, no journey)

**Description:** One page: enter I&E + arrears → instant plan list; no confirmation flow.

| | |
|---|---|
| **Benefits** | Fastest to ship; good for proving calculation correctness |
| **Drawbacks** | Misses journey UX, confirmation, and conduct-sensitive communication; weak product signal |
| **Effort** | **Low (1–2 days)** — likely **under-delivers** on MUST items M5–M6 and SHOULD S1–S4 |

---

## 7. Recommended MVP

Build **Option A** with the following scope.

### In scope

1. **Landing / situation overview** — mock customer + loan/arrears summary.
2. **Three-step journey:** I&E → affordable options → review & confirm.
3. **Domain module** (`calculateDisposableIncome`, `generatePlanOptions`, `validateSubmission`) with unit tests and fixture-driven cases (including zero disposable income).
4. **POST `/api/arrangements`** (or server action) that re-runs rules server-side and returns confirmation ID.
5. **Confirmation page** with recap and static “what happens next” + debt advice links.
6. **Accessibility basics:** semantic HTML, labelled inputs, focus visible, error summaries.
7. **README:** setup, assumptions, rules summary, test commands, known limitations.

### Out of scope (explicitly defer)

- Real authentication, Open Banking, credit checks, payments processing
- Agent console, CRM integration, email/SMS notifications
- Full vulnerability assessment workflow
- Welsh translation, E2E suite (unless time remains)

### SHOULD coverage

| SHOULD | MVP approach |
|--------|----------------|
| S1 Progressive disclosure | 3-step wizard with saved client state |
| S2 Accessibility | Baseline a11y on forms and errors |
| S3 Empathetic copy | Short, reviewed strings in one constants file |
| S4 Error recovery | React state or URL-step with back navigation |
| S5 Server authority | All plan generation re-validated on submit |
| S6 Domain module | `src/domain/` + `src/domain/*.test.ts` |
| S7 Data hygiene | No PII in logs; synthetic fixtures only |

### Success criteria for take-home review

- All **MUST** items demonstrable in a 5-minute walkthrough.
- Tests pass for affordability edge cases.
- Reviewer can read **TASK_ANALYSIS.md** + README and understand trade-offs without live explanation.
- AI usage documented in `docs/PROMPT_HISTORY.md` and session snapshots — process transparency, not black-box code.

### Handoff to implementation (S002+)

1. Add/commit official engineering brief to `docs/` when available; diff against Section 2.
2. Define fixture schema (customer, loan, policy rules).
3. Implement domain layer + tests first, then UI wizard.
4. Run `npm run lint`, `npm run typecheck`, `npm run build`, and unit tests before submission.
