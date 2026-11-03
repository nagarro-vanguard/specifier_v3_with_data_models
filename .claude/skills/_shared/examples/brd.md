> **Example.** A worked example of a BRD, for a made-up product called Expense claims. It follows on from the example Discovery brief, once that brief was accepted. It shows the BRD at its gate, with its first decision made. Its Check record is still empty: check-brd.cjs pastes its record into that section when the gate ends. Nothing in it is a real requirement.
>
> Every line says where it came from. One line of each kind:
> - **From a file:** BR-04, "per claims-requirements-v2.docx, section 2.2"
> - **From your answer:** the objective "Fewer claims sent back for a missing receipt", "per Discovery brief, Decision 5"
> - **Suggested by the skill:** the assumption "Every claim is made in euros", "Proposed (needs confirmation), question 4"
> - **Not known yet:** the target for the days from claim to payment, "TBD, question 7"

# BRD — Expense claims

Status: drafted

## 1. Executive summary

Expense claims are made on paper today, and take 18 working days from sending to payment. Expense claims lets employees and contractors claim online, and their line manager approve online, with the finance team also approving claims over 500. It aims to cut the time from claim to payment, and the number of claims sent back for a missing receipt.

- **Problem or opportunity:** Paper claims take 18 working days from sending to payment — per workshop-notes-2026-09-12.md, item 2. One claim in five is sent back to the claimant because a receipt is missing — per workshop-notes-2026-09-12.md, item 3.
- **Classification:** Problem

## 2. Background and current state

- Claims are made on a paper form and checked by hand by the finance team — per claims-requirements-v2.docx, section 1.1
- A manager approves a claim by signing the paper form — per workshop-notes-2026-09-12.md, item 1
- Approved claims are paid with the monthly payroll run, and claims approved after the 20th wait until the following month — per payroll-cutoff-2026-09-20.eml

## 3. Objectives and success metrics

| Objective | Source |
|---|---|
| Pay approved claims faster | per claims-requirements-v2.docx, section 1.1 |
| Fewer claims sent back for a missing receipt | per Discovery brief, Decision 5 |
| Every claim follows the expense policy | per expense-policy-2026.pdf, section 1.1 |

> **Metrics Confidence Summary:**
> - **CONFIRMED:** 0 metrics. Each one is fully supported by the source documents.
> - **TENTATIVE:** 2 metrics. Each one is partly supported, and its details need checking.
> - **AI-RECOMMENDED:** 0 metrics. The AI suggested each one, and you decide at the gate.
>
> **Items marked AI-RECOMMENDED are NOT from your source documents. They are suggestions that require your explicit acceptance before use.**

| KPI | Baseline | Target | Measurement method | Measurement cadence | Owner | Confidence |
|---|---|---|---|---|---|---|
| Working days from sending a claim to paying it | 18, per workshop-notes-2026-09-12.md, item 2 | TBD, question 7 | Payment dates in the finance team's records, per workshop-notes-2026-09-12.md, item 2 | Monthly, per workshop-notes-2026-09-12.md, item 2 | Finance team, per workshop-notes-2026-09-12.md, item 2 | TENTATIVE: no file gives a target |
| Share of claims sent back for a missing receipt | 1 in 5, per workshop-notes-2026-09-12.md, item 3 | TBD, question 7 | Claims returned, in the finance team's records, per workshop-notes-2026-09-12.md, item 3 | Monthly, per workshop-notes-2026-09-12.md, item 3 | Finance team, per workshop-notes-2026-09-12.md, item 3 | TENTATIVE: no file gives a target |

## 4. Scope, assumptions and dependencies

### In scope

- Making, approving and paying expense claims — per claims-requirements-v2.docx, section 1.1
- Finance approval of claims over the limit — per claims-requirements-v2.docx, section 3.2

### Out of scope

- Booking travel — per Discovery brief, Decision 6
- Statements from company credit cards — per claims-requirements-v2.docx, section 1.3

### Assumptions

- Every claim is made in euros — Proposed (needs confirmation), question 4

### Dependencies

- Each claimant's line manager is known — per claims-requirements-v2.docx, section 3.1
- The monthly payroll run pays approved claims — per payroll-cutoff-2026-09-20.eml

## 5. Business requirements

| BR ID | Business requirement | Source |
|---|---|---|
| BR-01 | Employees and contractors can claim business expenses without a paper form. | per expense-policy-2026.pdf, section 1.1, and claims-requirements-v2.docx, section 1.2 |
| BR-02 | Every claim is approved by someone other than the person who made it. | per expense-policy-2026.pdf, section 2.3 |
| BR-03 | Claims over 500 are also approved by the finance team. | per claims-requirements-v2.docx, section 3.2, and Discovery brief, Decision 2 |
| BR-04 | No claim is paid without its receipts. | per claims-requirements-v2.docx, section 2.2 |

## 6. Risks, constraints and mitigations

### Risks

| Risk | Impact | Likelihood | Mitigation | Source |
|---|---|---|---|---|
| Managers leave claims waiting | High: a claim that misses the 20th is paid a month late | Medium | A reminder after 3 working days, Proposed (needs confirmation), question 8 | per Discovery brief, section 6, and payroll-cutoff-2026-09-20.eml |
| A claimant leaves the company with claims still open | Medium: nobody is left to approve them | Low | Open claims pass to the line manager's own manager, Proposed (needs confirmation), question 6 | per Discovery brief, section 6 |

### Constraints

- Claims approved after the 20th are paid the following month — per payroll-cutoff-2026-09-20.eml

## 7. Release criteria

| # | Release criterion | Source |
|---|---|---|
| 1 | Every claim made from the go-live date is made without a paper form | per Discovery brief, Decision 3 |
| 2 | No claim is paid without its line manager's approval | per expense-policy-2026.pdf, section 2.1 |
| 3 | Every paper claim still open on the go-live date is finished on paper | per workshop-notes-2026-09-12.md, item 11, and Discovery brief, Decision 3 |

## Traceability mini-map

| Objective | Business requirements | Release criteria |
|---|---|---|
| Pay approved claims faster | • BR-01<br>• BR-03 | • 1 |
| Fewer claims sent back for a missing receipt | • BR-04 | • 1 |
| Every claim follows the expense policy | • BR-02<br>• BR-03 | • 2<br>• 3 |

## Decision record

### Decision 1 — Which currencies can a claim be made in?
- **Question:** 4
- **Asked at:** Accept the BRD?
- **Options offered:**
  - **Euros only** — Why: nothing in the files mentions another currency. What happens next: every claim is in euros, and the claimant converts the amount and attaches the receipt.
  - **Any currency, converted by the claimant** — Why: staff travel abroad, and the claimant knows the rate they paid. What happens next: the claim holds both amounts, and the finance team checks the conversion.
  - **Any currency, converted at the day's rate** — Why: staff travel abroad, and one rate is fairer. What happens next: the product needs each day's exchange rate, and the 500 limit is checked after conversion.
  - **I don't know yet** — What happens next: "Euros only" stays in use, marked Proposed (needs confirmation), and the finance team is asked before the FRD for making a claim is accepted.
- **Recommended:** Euros only
- **Chosen:** I don't know yet
- **Answer in use for now:** Euros only, Proposed (needs confirmation). Question 4 stays open for the finance team, to be answered before the FRD for making a claim is accepted.
- **Decided by:** PO, 2026-10-06

## Check record

None yet.
