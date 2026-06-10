# PRD Template — Customer Financial Health

> **Phase:** PRD
> **Inputs consumed:** `docs/discovery/NOTES.md`, `docs/Ophelos Engineering Take-Home Task.pdf`, `docs/TASK_ANALYSIS.md` (background only)
> **Gate criteria for next phase:**
> - All Must requirements from the brief have stable IDs and a `Why` linked to discovery.
> - Non-goals list is non-empty and explicit.
> - FCA / vulnerability stance is stated, even if as constraints rather than features.
> - Every open question has a default the team can adopt if it stays unresolved.
> **Status:** Template — do not commit as `PRD.md`.

---

## How to use this template

- This is the canonical structure for `docs/PRD.md`. The `/prd` slash-command must produce a document with these sections, in this order.
- Replace every `[bracketed]` placeholder; delete the `**Why / Belongs / Does NOT belong**` guidance blocks before committing the real PRD.
- Keep the final PRD short — target ~1–2 pages. The brief is open-ended, but the PRD is **a contract for what will be built**, not a discovery dump.
- Append-only IDs (`R1`, `R2`, …). Never re-number. Drop with `R{n} — DROPPED (reason)`.
- Cite the brief or discovery for every concrete claim (`brief §Must`, `NOTES.md §Users`, etc.). No fabricated regulatory citations or invented metrics.
- **Do not** describe how the system will work internally — that belongs in `TECH_SPEC.md`.

---

## 1. Problem statement

> **Why this section exists:** Anchors the rest of the PRD in a single sentence the team and reviewer can agree on. Prevents scope drift.
> **What belongs:** One short paragraph (3–5 sentences) describing the customer pain, the gap in today's product, and the outcome we want.
> **Does NOT belong:** Solutions, feature lists, technical components, regulatory citations, target metrics (those live in their own sections).

[Restate the problem from the brief in our own words — what customers can do today, what they get back, and why that is insufficient for someone in financial difficulty.]

---

## 2. Users and jobs-to-be-done

> **Why this section exists:** Forces the PRD to name *who* this is for before naming what to build. Vulnerability is captured here because it is a property of the user population, not a feature.
> **What belongs:**
> - A short table: user → primary job-to-be-done → relevant constraint or vulnerability.
> - One explicit **vulnerability segments** note: which groups (e.g. zero / negative disposable income, irregular income, recently bereaved or unwell self-declared) are in the target population, and how their needs shape the product.
> **Does NOT belong:** Personas with names and stock photos, behavioural research we did not actually conduct, copy strings, UI layouts.

| User | Job-to-be-done | Constraint / vulnerability note |
|---|---|---|
| Primary — customer in debt | [e.g. understand whether their current position is improving] | [e.g. may be anxious, time-poor, on irregular income] |
| Secondary — [if any, e.g. agent reviewing trends] | […] | […] |
| Tertiary — hiring reviewer | Evaluate product thinking and AI-assisted delivery | Reads README + DECISIONS.md + PRD without a live walkthrough |

**Vulnerability segments in scope:** [bulleted list — keep to 3–5 concrete segments derived from discovery].

---

## 3. Regulatory and duty-of-care context

> **Why this section exists:** The brief calls out FCA regulation and vulnerable customers explicitly. Capturing this once, near the top, prevents every requirement from re-arguing it and gives the tech spec a single source of truth for constraints.
> **What belongs:** 3–6 bullets, each naming a regulator obligation or duty-of-care expectation and a one-line product implication. Cite the brief or a named FCA artefact (Consumer Duty, CONC, FG21/1) — do not invent clause numbers.
> **Does NOT belong:** Legal advice, full regulatory summaries, controls or threat models (those go in tech spec / test plan), copywriting examples.

- **Consumer Duty (good outcomes):** [implication, e.g. affordability output must be explainable, not "computer says no"].
- **Vulnerability (FCA FG21/1 spirit):** [implication, e.g. never auto-label a user as vulnerable from numeric data; provide an escape hatch to human support].
- **CONC / forbearance posture:** [implication, e.g. tone is supportive, not collections-aggressive; no nudging into unsustainable choices].
- **UK GDPR data minimisation:** [implication, e.g. store only what the assessment needs; nothing sensitive in logs].
- **[Other obligation surfaced in discovery]:** [implication].

---

## 4. Goals

> **Why this section exists:** Goals are the *outcomes* we want; requirements are the *commitments* that should deliver them. Separating them lets reviewers see why each requirement exists.
> **What belongs:** 3–5 outcome statements, each verifiable in principle (a reviewer could agree or disagree after a 5-minute walkthrough).
> **Does NOT belong:** Feature names, screen names, tech stack, "nice to haves", marketing language.

- G1 — [e.g. A customer can see a meaningful affordability assessment after entering or loading their I&E data.]
- G2 — [e.g. A customer can see how their position has changed across at least two points in time.]
- G3 — [e.g. The experience handles the hard cases (zero income, expenditure > income) without alarm or dead-ends.]
- G4 — [e.g. The reviewer can verify that decisions are explainable, data is handled minimally, and AI usage is documented.]

---

## 5. Non-goals

> **Why this section exists:** The brief is intentionally open. Non-goals are the load-bearing section that prevents scope creep and signals judgement to the reviewer.
> **What belongs:** A bulleted list of things we are explicitly **not** building, each with a one-line reason. Include items that a reasonable reader might assume are in scope.
> **Does NOT belong:** Items that are merely deferred to "later" without justification, vague hand-waves ("polish"), or features no one would expect anyway.

- N1 — [e.g. Real authentication or account linking — out of scope; demo uses a fixed mock customer.]
- N2 — [e.g. Live bank / Open Banking integration — out of scope; I&E is user-entered or fixture-loaded.]
- N3 — [e.g. Automated vulnerability classification — out of scope; only self-declaration / signposting.]
- N4 — [e.g. Payment processing or arrangement booking — out of scope; this product is reflective, not transactional.]
- N5 — [e.g. Welsh / multi-language UI — deferred until base experience is solid.]

---

## 6. Requirements

> **Why this section exists:** This is the contract. Every committed change after this phase must trace back to a requirement ID here.
> **What belongs:** A table of requirements with stable IDs. Each row has: ID, one-line statement, Priority (Must / Should / Could / Won't), Category, and Why (one line, citing brief or discovery).
> **Does NOT belong:**
> - Implementation details (no "use Postgres", no "render with React Server Components", no API shapes).
> - Acceptance criteria with field-level granularity — that's the test plan's job.
> - Anything not supported by the brief or discovery. Park unsupported ideas in Open questions.
>
> **Categories to use** (keeps the table scannable and ensures the brief's three concerns are visible):
> - `Core` — the affordability + tracking product (brief §Must).
> - `Vulnerability` — adaptations for users in difficulty (brief §Should).
> - `Regulatory` — data handling, decision surfacing, FCA posture (brief §Should).
> - `Stretch` — currency/country, secure sharing, PDF export (brief §Stretch).
> - `Submission` — meta-deliverables required by the brief itself (DECISIONS.md, prompt history, time-spent note, runnable repo with README).

| ID | Requirement | Priority | Category | Why (cite source) |
|---|---|---|---|---|
| R1 | [Calculate and display a meaningful affordability assessment.] | Must | Core | brief §Must, NOTES.md §Problem |
| R2 | [Allow the customer to track their financial position over time.] | Must | Core | brief §Must |
| R3 | [Provide automated tests that protect real behaviour, not just happy paths.] | Must | Core | brief §Must |
| R4 | [Handle zero-income and expenditure-exceeds-income cases without dead-ends.] | Should | Vulnerability | brief §Should |
| R5 | [Present information in a way appropriate for customers in financial difficulty.] | Should | Vulnerability | brief §Should |
| R6 | [Reflect FCA-regulated context in data handling, storage, and how decisions are surfaced.] | Should | Regulatory | brief §Should |
| R7 | [Add `currency` and `country_code` fields with appropriate schema migrations.] | Could | Stretch | brief §Stretch |
| R8 | [Secure statement sharing via a time-limited link.] | Could | Stretch | brief §Stretch |
| R9 | [PDF export of the statement with appropriate branding.] | Could | Stretch | brief §Stretch |
| R10 | [Commit `DECISIONS.md` covering what was built, what was left out, what is next, and why.] | Must | Submission | brief §How We Want You to Work |
| R11 | [Retain and submit full AI prompt history.] | Must | Submission | brief §Submission Checklist |
| R12 | [Runnable repository with a README that explains how to run and any assumptions.] | Must | Submission | brief §Submission Checklist |
| R13 | [Record approximate time spent on the task.] | Must | Submission | brief §Submission Checklist |

> Rows above are seeded from the brief so the gate can be checked. Adjust wording, add new Should/Could rows from discovery, and add Won't rows for tempting features we explicitly decline.

---

## 7. Success metrics

> **Why this section exists:** Maps each Goal to something a reviewer (or the team, post-MVP) can actually observe. Keeps Goals honest.
> **What belongs:** One row per Goal. The metric should be checkable from the submitted artefact — code, README, DECISIONS.md, walkthrough — not from analytics we cannot collect.
> **Does NOT belong:** Vanity metrics, product KPIs we cannot measure in a take-home, anything requiring real users.

| Goal | How we will know it is met |
|---|---|
| G1 | [e.g. Reviewer can trigger the assessment on at least one fixture and see a result with a plain-language explanation.] |
| G2 | [e.g. Reviewer can view at least two recorded points in time for the same customer and see a clear delta.] |
| G3 | [e.g. Tests cover zero-income and over-expenditure cases; the UI / output for those cases is non-alarming and signposts support.] |
| G4 | [e.g. DECISIONS.md, prompt history, and PRD/tech-spec/test-plan trail are all present and consistent.] |

---

## 8. Open questions and working assumptions

> **Why this section exists:** The brief explicitly invites assumptions instead of waiting for answers. This is the only acceptable place to park unknowns — never bury them inside requirements.
> **What belongs:** Two short lists:
> 1. **Open questions** — things we genuinely do not know and which, if answered, would change a requirement.
> 2. **Working assumptions** — defaults we will adopt if the question stays unresolved, so the team can proceed.
> **Does NOT belong:** Speculative future features, internal debates that are actually design decisions (those belong in DECISIONS.md), or rhetorical questions.

**Open questions**

- Q1 — [e.g. What is the smallest unit of "over time" we should support — sessions, days, months?]
- Q2 — […]

**Working assumptions (adopted if questions remain open)**

- A1 — [e.g. "Over time" means at least two named snapshots stored locally per customer.]
- A2 — […]

---

## 9. Traceability table

> **Why this section exists:** Required by the `phase-gate` skill. Lets the next phase (tech spec) see at a glance which discovery insight drove which requirement.
> **What belongs:** The discovery → PRD table from `phase-gate`. One row per discovery insight that produced (or should produce) a requirement.
> **Does NOT belong:** Tech-spec section IDs or test case IDs — those tables live in their own phase documents.

| Discovery insight | PRD requirement | Notes |
|---|---|---|
| [short phrase from `NOTES.md`] | R1 | [why this matters] |
| […] | R2 | […] |
| […] | TBC | [insight not yet covered — surface in Open questions or add a requirement] |

---

## Anti-patterns this template refuses

- **Implementation leaking in.** No framework names, file paths, library choices, API shapes, schema columns, or UI components. If it would change with a different tech stack, it does not belong here.
- **Acceptance criteria masquerading as requirements.** "Form rejects negative numbers" is a test case. The requirement is "validate I&E inputs sensibly."
- **Regulatory cargo-culting.** Do not cite FCA clause numbers, CONC sections, or FG documents that were not introduced in discovery. A one-line implication is better than a fake citation.
- **Vulnerability as a single Stretch row.** Vulnerability is a property of the user population (Section 2) *and* a category of requirements (Section 6). It must appear in both, or the PRD is not honouring the brief.
- **"TBD" without a default.** Every Open question (Section 8) must have a paired working assumption so the next phase is not blocked.
- **Re-numbering IDs.** Append-only. Dropped requirements keep their ID with a `— DROPPED (reason)` suffix.
