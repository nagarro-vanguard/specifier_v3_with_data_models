> **Example.** A worked example of a Discovery brief, for a made-up product called Expense claims. It shows what a good one looks like at its gate, with all seven decisions made. One question is still open, because the answer was "I don't know yet", and it is kept in the Question log example. Its Check record is still empty: check-discovery-brief.ts pastes its record into that section when the gate ends. Nothing in it is a real requirement.

# Discovery brief — Expense claims

Status: drafted

## 1. Sources

### Summary

| Files | Used | Same as another file | Older version | Out of scope |
|---|---|---|---|---|
| 7 | 4 | 1 | 1 | 1 |

### requirements/

| # | File | Kind of document | Version or date | Owner | Standing | Used |
|---|---|---|---|---|---|---|
| 1 | [claims-requirements-v2.docx](sources/requirements/claims-requirements-v2.docx) | Requirements document | Version 2, 30 August 2026 | Finance team | Final | Yes |
| 2 | [claims-requirements-v1.docx](sources/requirements/claims-requirements-v1.docx) | Requirements document | Version 1, 2 June 2026 | Finance team | Final | No: older version of 1 |

### policies/

| # | File | Kind of document | Version or date | Owner | Standing | Used |
|---|---|---|---|---|---|---|
| 3 | [expense-policy-2026.pdf](sources/policies/expense-policy-2026.pdf) | Policy | 2026 edition | Chief Financial Officer | Approved | Yes |
| 4 | [expense-policy-2026-copy.pdf](sources/policies/expense-policy-2026-copy.pdf) | Policy | 2026 edition | Chief Financial Officer | Approved | No: same as 3 |
| 5 | [travel-booking-policy-2026.pdf](sources/policies/travel-booking-policy-2026.pdf) | Policy | 2026 edition | Head of Travel | Approved | No: out of scope, Decision 6 |

### workshops/

| # | File | Kind of document | Version or date | Owner | Standing | Used |
|---|---|---|---|---|---|---|
| 6 | [workshop-notes-2026-09-12.md](sources/workshops/workshop-notes-2026-09-12.md) | Workshop notes | 12 September 2026 | BA | Draft | Yes |

### emails/

| # | File | Kind of document | Version or date | Owner | Standing | Used |
|---|---|---|---|---|---|---|
| 7 | [payroll-cutoff-2026-09-20.eml](sources/emails/payroll-cutoff-2026-09-20.eml) | Email | 20 September 2026 | Payroll lead | Unknown | Yes |

## 2. Which kind of source wins

| Rank | Kind of document | Why it has this rank |
|---|---|---|
| 1 | Policy | approved by the Chief Financial Officer, and binding on every claim |
| 2 | Requirements document | the finance team's own statement of what to build |
| 3 | Workshop notes | what people said in the room, not reviewed by them afterwards |
| 4 | Email | one person's view, at one point in time |

## 3. Known: what the sources say, topic by topic

### Users and context

| Topic | What the sources say | Verdict |
|---|---|---|
| Who can make a claim | • "Any employee can claim business expenses." — per claims-requirements-v2.docx, section 1.2<br>• "This policy applies to all employees and contractors." — per expense-policy-2026.pdf, section 1.1 | Differ |

### Rules and constraints

| Topic | What the sources say | Verdict |
|---|---|---|
| Who approves a claim | • "Every claim is approved by the claimant's line manager." — per claims-requirements-v2.docx, section 3.1<br>• "A claim is approved by the employee's line manager." — per expense-policy-2026.pdf, section 2.1 | Agree |
| Approving your own claim | • "No one approves their own claim." — per expense-policy-2026.pdf, section 2.3<br>• "Team leads can approve their own claims under 50." — per workshop-notes-2026-09-12.md, item 4 | Differ |
| Finance approval limit | • "Claims over 500 need finance approval." — per claims-requirements-v2.docx, section 3.2<br>• "Claims over 1,000 must also be approved by Finance." — per expense-policy-2026.pdf, section 4.1 | Differ |
| Receipts | • "A receipt is attached for every expense." — per claims-requirements-v2.docx, section 2.2 | One source |

### Data and states

| Topic | What the sources say | Verdict |
|---|---|---|
| The stages of a claim | • "A claim is Draft, Submitted, Approved, Rejected or Paid." — per claims-requirements-v2.docx, section 2.4 | One source |

### Edge cases and failure modes

| Topic | What the sources say | Verdict |
|---|---|---|
| A rejected claim | • "A rejected claim goes back to the claimant with the reason." — per workshop-notes-2026-09-12.md, item 7 | One source |
| The approving manager is away | None of the used files speaks to this. | Silent, question 1 |

### Dependencies and integrations

| Topic | What the sources say | Verdict |
|---|---|---|
| When approved claims are paid | • "Claims approved after the 20th are paid the following month." — per payroll-cutoff-2026-09-20.eml | One source |

### Success and acceptance

| Topic | What the sources say | Verdict |
|---|---|---|
| How success is measured | None of the used files speaks to this. | Silent, question 2 |

### Non-functional

| Topic | What the sources say | Verdict |
|---|---|---|
| When the service is available | • "It should work during office hours at least." — per workshop-notes-2026-09-12.md, item 9 | One source |

## 4. Clashes, and how each is settled

| # | Topic | Kind of clash | What each file says | Settled by | What now holds | Question |
|---|---|---|---|---|---|---|
| 1 | Who can make a claim | Different scope | • "Any employee can claim business expenses." — per claims-requirements-v2.docx, section 1.2<br>• "This policy applies to all employees and contractors." — per expense-policy-2026.pdf, section 1.1 | Rank 1: Policy | Employees and contractors can both make a claim. | - |
| 2 | Approving your own claim | Contradiction | • "No one approves their own claim." — per expense-policy-2026.pdf, section 2.3<br>• "Team leads can approve their own claims under 50." — per workshop-notes-2026-09-12.md, item 4 | Rank 1: Policy | No one approves their own claim. | - |
| 3 | Finance approval limit | Different value | • "Claims over 500 need finance approval." — per claims-requirements-v2.docx, section 3.2<br>• "Claims over 1,000 must also be approved by Finance." — per expense-policy-2026.pdf, section 4.1 | Decision 2 | Claims over 500 need finance approval. | question 3 |

## 5. Assumed

- Every claim is made in euros — why: every amount in the files is in euros, and no file mentions another currency. Question 4.
- Once the service goes live, there is no paper claim form — why: the requirements describe no paper route, and the workshop notes call the paper form "the old way". Question 5.

## 6. Risks and edge cases

- Claims sent in the last days of the financial year. The cost: they may be paid from the next year's budget.
- A claimant leaves the company with claims still open. The cost: nobody may be left to approve them.
- A claim approved on the 21st of the month. The cost: it waits a full month to be paid, because of the payroll cut-off on the 20th.

## Decision record

### Decision 1 — Which currencies can a claim be made in?
- **Question:** 4
- **Asked at:** Accept the Discovery brief?
- **Options offered:**
  - **Euros only** — Why: nothing in the files mentions another currency. What happens next: every claim is in euros, and the claimant converts the amount and attaches the receipt.
  - **Any currency, converted by the claimant** — Why: staff travel abroad, and the claimant knows the rate they paid. What happens next: the claim holds both amounts, and the finance team checks the conversion.
  - **Any currency, converted at the day's rate** — Why: staff travel abroad, and one rate is fairer. What happens next: the product needs each day's exchange rate, and the 500 limit is checked after conversion.
  - **I don't know yet** — What happens next: "Euros only" is used, marked Proposed (needs confirmation), and the finance team is asked before the FRD for making a claim is accepted.
- **Recommended:** Euros only
- **Chosen:** I don't know yet
- **Answer in use for now:** Euros only, Proposed (needs confirmation). Question 4 stays open for the finance team, to be answered before the FRD for making a claim is accepted.
- **Decided by:** PO, 2026-10-01

### Decision 2 — When the requirements and the expense policy give different finance approval limits, which limit holds?
- **Question:** 3
- **Asked at:** Accept the Discovery brief?
- **Options offered:**
  - **1,000, as the policy says** — Why: the policy ranks first. What happens next: the BRD and PRD use 1,000.
  - **500, as the requirements say** — Why: the finance team may have lowered the limit since the policy was written. What happens next: the BRD and PRD use 500, and the policy owner is told.
  - **I don't know yet** — What happens next: 1,000 is used, marked Proposed (needs confirmation), and the finance team is asked before the FRD for approving a claim is accepted.
  - **Other: 500. The finance team confirmed on 2 October that 500 is the new limit, and the policy will be updated.** — Why: the finance team's confirmation. What happens next: the BRD and PRD use 500, and the policy owner is told.
- **Recommended:** 1,000, as the policy says
- **Chosen:** Other: 500. The finance team confirmed on 2 October that 500 is the new limit, and the policy will be updated.
- **Decided by:** PO, 2026-10-02

### Decision 3 — What happens to paper claims once the service goes live?
- **Question:** 5
- **Asked at:** Accept the Discovery brief?
- **Options offered:**
  - **None are taken** — Why: one route for every claim. What happens next: paper claims are refused from go-live.
  - **They're taken for a set period** — Why: claimants get time to switch. What happens next: the product needs a way to enter a paper claim.
  - **Only claims already open are finished on paper** — Why: nothing new to build, and nobody's claim is lost. What happens next: a release criterion covers the paper claims open on go-live day.
  - **I don't know yet** — What happens next: "Only claims already open are finished on paper" is used, marked Proposed (needs confirmation).
- **Recommended:** Only claims already open are finished on paper
- **Chosen:** Only claims already open are finished on paper
- **Decided by:** PO, 2026-10-02

### Decision 4 — When the approving manager is away, who approves the claim?
- **Question:** 1
- **Asked at:** Accept the Discovery brief?
- **Options offered:**
  - **The manager's own manager** — Why: no claim waits, and the approver is still someone senior to the claimant. What happens next: the FRD for approval gets a stand-in rule.
  - **The claim waits until the manager is back** — Why: the simplest rule, with nothing new to build. What happens next: no stand-in rule, and claims may wait for weeks.
  - **The claimant picks another approver** — Why: the claimant knows who is around. What happens next: the FRD needs rules on who may be picked.
  - **I don't know yet** — What happens next: "The manager's own manager" is used, marked Proposed (needs confirmation).
- **Recommended:** The manager's own manager
- **Chosen:** The manager's own manager
- **Decided by:** PO, 2026-10-02

### Decision 5 — How will we know the new service has worked?
- **Question:** 2
- **Asked at:** Accept the Discovery brief?
- **Options offered:**
  - **Fewer days from claim to payment** — Why: it's the pain the workshop raised first. What happens next: one objective, measured in working days.
  - **Fewer claims sent back for a missing receipt** — Why: it's the finance team's biggest cost. What happens next: one objective, measured as a share of claims.
  - **Both** — Why: each is a real pain today. What happens next: two objectives, each with its own measure.
  - **I don't know yet** — What happens next: "Both" is used, marked Proposed (needs confirmation).
- **Recommended:** Both
- **Chosen:** Both
- **Decided by:** PO, 2026-10-02

### Decision 6 — How is the travel booking policy treated?
- **Question:** None
- **Asked at:** Accept the Discovery brief?
- **Options offered:**
  - **Out of scope: the product covers claiming travel costs, not booking travel** — Why: the policy covers booking trips, not claiming expenses afterwards. What happens next: travel-booking-policy-2026.pdf is marked "No: out of scope" and not read again.
  - **Used: some claims are for travel, so its rules might apply** — Why: a travel claim might have to follow it. What happens next: the file is used, and its topics are compared with the others.
  - **I don't know yet** — What happens next: the file is left out for now, marked Proposed (needs confirmation), and this becomes a question in the Question log.
- **Recommended:** Out of scope: the product covers claiming travel costs, not booking travel
- **Chosen:** Out of scope: the product covers claiming travel costs, not booking travel
- **Decided by:** BA, 2026-10-02

### Decision 7 — When two kinds of document disagree, which one wins?
- **Question:** None
- **Asked at:** Accept the Discovery brief?
- **Options offered:**
  - **Policy, then requirements document, then workshop notes, then email** — Why: the policy is approved and binding, and the notes and email are one person's view. What happens next: clashes 1 and 2 are settled by the policy.
  - **Requirements document, then policy, then workshop notes, then email** — Why: it is the newest statement of what the finance team wants. What happens next: every clash with the policy is settled by the requirements document.
  - **I don't know yet** — What happens next: the recommended order is used for now, marked Proposed (needs confirmation), and this becomes a question in the Question log.
- **Recommended:** Policy, then requirements document, then workshop notes, then email
- **Chosen:** Policy, then requirements document, then workshop notes, then email
- **Decided by:** PO, 2026-10-02

## Check record

None yet.
