> **Example.** A worked example of a BRD, for a made-up product called Expense claims. It follows on from the example Discovery brief, once that brief was accepted. It shows the BRD at its gate. Its Check record is still empty. When the gate ends, check-brd.ts prints one line, Pass or Fail with the date and time. That line goes into the Check record. Nothing in it is a real requirement.
>
> The BRD names no file and no decision. Two marks name a question in the Question log:
> - **Not known yet:** the target for the days from claim to payment, "[TBD, Q7]"
> - **Suggested by the skill:** the assumption "Every claim is made in euros<sup>*Q4</sup>", with the legend line straight under its list

# BRD — Expense claims

Status: drafted

## 1. Executive summary

Expense claims are made on paper today, and take 18 working days from sending to payment. Expense claims lets employees and contractors claim online, and their line manager approve online, with the finance team also approving claims over 500. It aims to cut the time from claim to payment, and the number of claims sent back for a missing receipt.

- **Problem or opportunity:** Paper claims take 18 working days from sending to payment. One claim in five is sent back to the claimant because a receipt is missing.
- **Classification:** Problem

## 2. Background and current state

- Claims are made on a paper form and checked by hand by the finance team
- A manager approves a claim by signing the paper form
- Approved claims are paid with the monthly payroll run, and claims approved after the 20th wait until the following month

## 3. Objectives and success metrics

- Pay approved claims faster
- Fewer claims sent back for a missing receipt
- Every claim follows the expense policy

> **Metrics Confidence Summary:**
> - **CONFIRMED:** 0 metrics. Each one is fully supported by the source documents.
> - **TENTATIVE:** 2 metrics. Each one is partly supported, and its details need checking.
> - **AI-RECOMMENDED:** 0 metrics. The AI suggested each one, and you decide at the gate.
>
> **Items marked AI-RECOMMENDED are NOT from your source documents. They are suggestions that require your explicit acceptance before use.**

| KPI | Baseline | Target | Measurement method | Measurement cadence | Owner | Confidence |
|---|---|---|---|---|---|---|
| Working days from sending a claim to paying it | 18 | [TBD, Q7] | Payment dates in the finance team's records | Monthly | Finance team | TENTATIVE: no file gives a target |
| Share of claims sent back for a missing receipt | 1 in 5 | [TBD, Q7] | Claims returned, in the finance team's records | Monthly | Finance team | TENTATIVE: no file gives a target |

## 4. Scope, assumptions and dependencies

### In scope

- Making, approving and paying expense claims
- Finance approval of claims over the limit

### Out of scope

- Booking travel
- Statements from company credit cards

### Assumptions

- Every claim is made in euros<sup>*Q4</sup>

<sup>*</sup> Proposed: needs your confirmation. Qn is its question in the Question log.

### Dependencies

- Each claimant's line manager is known
- The monthly payroll run pays approved claims

## 5. Business requirements

| BR ID | Business requirement |
|---|---|
| BR-01 | Employees and contractors can claim business expenses without a paper form. |
| BR-02 | Every claim is approved by someone other than the person who made it. |
| BR-03 | Claims over 500 are also approved by the finance team. |
| BR-04 | No claim is paid without its receipts. |

## 6. Risks, constraints and mitigations

### Risks

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Managers leave claims waiting | High: a claim that misses the 20th is paid a month late | Medium | A reminder after 3 working days<sup>*Q8</sup> |
| A claimant leaves the company with claims still open | Medium: nobody is left to approve them | Low | Open claims pass to the line manager's own manager<sup>*Q6</sup> |

<sup>*</sup> Proposed: needs your confirmation. Qn is its question in the Question log.

### Constraints

- Claims approved after the 20th are paid the following month

## 7. Release criteria

| # | Release criterion |
|---|---|
| 1 | Every claim made from the go-live date is made without a paper form |
| 2 | No claim is paid without its line manager's approval |
| 3 | Every paper claim still open on the go-live date is finished on paper |

## Traceability mini-map

| Objective | Business requirements | Release criteria |
|---|---|---|
| Pay approved claims faster | • BR-01<br>• BR-03 | • 1 |
| Fewer claims sent back for a missing receipt | • BR-04 | • 1 |
| Every claim follows the expense policy | • BR-02<br>• BR-03 | • 2<br>• 3 |

## Check record

None yet.
