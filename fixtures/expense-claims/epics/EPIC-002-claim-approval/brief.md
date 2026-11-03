# EPIC brief — EPIC-002 Claim approval

Status: drafted

## 1. Description

**Epic hypothesis:** As a line manager, I need to approve or reject my team's claims, so that only checked claims are paid.

Every claim needs someone other than its claimant to approve it, and claims over 500 need a second check by the finance team.

## 2. Business value

- Every claim is approved by the claimant's line manager — per REQ-3.1
- Claims over 500 get a second check by the finance team — per REQ-3.2

## 3. Success or fitness criteria

**Benefit hypothesis:** Claims are approved soon after they are sent, so they are paid sooner.

> **Metrics Confidence Summary:**
> - **CONFIRMED:** 0 metrics. Each one is fully supported by the source documents.
> - **TENTATIVE:** 1 metric. Each one is partly supported, and its details need checking.
> - **AI-RECOMMENDED:** 0 metrics. The AI suggested each one, and you decide at the gate.
>
> **Items marked AI-RECOMMENDED are NOT from your source documents. They are suggestions that require your explicit acceptance before use.**

| Measure | Baseline | Target | Confidence |
|---|---|---|---|
| Working days from sending a claim to paying it | 18, per workshop-notes-2026-09-12.md, item 2 | TBD, question 7 | TENTATIVE: no file gives a target |

## 4. Scope

### In

- F-04 Manager approval
- F-05 Finance approval

### Out

- F-01 Send a claim — owned by EPIC-001
- F-02 Receipts — owned by EPIC-001
- F-03 Claim stages — owned by EPIC-001

## 5. Features

| Feature ID | Feature | Req ID | What it delivers | Band |
|---|---|---|---|---|
| F-04 | Manager approval | • REQ-3.1 | A line manager approves or rejects each claim from their team, so that only checked claims are paid | MVP |
| F-05 | Finance approval | • REQ-3.2 | The finance team also approves each claim over 500, so that large claims get a second check | MVP |

## 6. Dependencies

### EPICs this one needs

- EPIC-001 Claim submission, linked by F-04 depends on F-01

### EPICs that need this one

- None

## 7. NFRs that apply

| NFR ID |
|---|
| NFR-1 |

## 8. References

- **EPIC grouping:** [grouping.md](../grouping.md)
- **Requirements:** [expense-claims-prd.md](../../expense-claims-prd.md)
- **Design:** Does not exist

## Decision record

None yet.

## Check record

None yet.
