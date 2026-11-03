> **Example.** A worked example of a PRD, for a made-up product called Expense claims. It follows on from the example BRD, once that BRD was accepted. It shows the PRD at its gate, with one decision made and one question still open, question 4 from the Discovery brief. Its Check record is still empty: check-prd.cjs pastes its record into that section when the gate ends. Nothing in it is a real requirement.

# PRD — Expense claims

Status: drafted

## 1. Document control

| | |
|---|---|
| Owner | PO |
| Source BRD | [expense-claims-brd.md](expense-claims-brd.md), version 1 |

## 2. Product overview

Expense claims lets employees and contractors claim business expenses online, with their receipts. Their line manager approves or rejects each claim, and the finance team also approves claims over 500. Approved claims are paid with the monthly payroll run. The business case is in the BRD, section 1.

## 3. Personas and roles

### Personas

| Persona | Who they are | Source |
|---|---|---|
| Claimant | an employee or contractor who has paid for something on the business's behalf | per expense-policy-2026.pdf, section 1.1 |
| Line manager | the claimant's manager, who approves their claims | per claims-requirements-v2.docx, section 3.1 |
| Finance approver | a member of the finance team, who also approves claims over the limit | per claims-requirements-v2.docx, section 3.2, and Decision 1 |

### Roles and permissions

| Role | Make a claim | Approve a claim from their team | Approve a claim over the limit |
|---|---|---|---|
| Claimant | Yes | No | No |
| Line manager | Yes | Yes | No |
| Finance approver | Yes | No | Yes |

## 4. Requirements

### 2. Submitting claims

| ID | Kind | In simple words | The client's words | Source | Traces to |
|---|---|---|---|---|---|
| REQ-2.1 | Requirement | **Send a claim** — An employee sends a claim with one or more expense lines. | **Send a claim** — An employee sends a claim with one or more expense lines. | claims-requirements-v2.docx, version 2, section 2.1 | • BR-01 |
| REQ-2.2 | Requirement | **Receipts** — Every expense has a receipt attached. | **Receipts** — A receipt is attached for every expense. | claims-requirements-v2.docx, version 2, section 2.2 | • BR-04 |
| REQ-2.3 | Requirement | **Claim stages** — A claim is in one of these stages: **Draft**, **Submitted**, **Approved**, **Rejected** or **Paid**. | **Claim stages** — A claim is Draft, Submitted, Approved, Rejected or Paid. | claims-requirements-v2.docx, version 2, section 2.4 | • BR-01 |

### 3. Approving claims

| ID | Kind | In simple words | The client's words | Source | Traces to |
|---|---|---|---|---|---|
| REQ-3.1 | Requirement | **Line manager approval** — The claimant's line manager approves every claim. | **Line manager approval** — Every claim is approved by the claimant's line manager. | claims-requirements-v2.docx, version 2, section 3.1 | • BR-02 |
| REQ-3.2 | Requirement | **Finance approval** — Claims over 500 need finance approval. | **Finance approval** — Claims over 500 need finance approval. | claims-requirements-v2.docx, version 2, section 3.2 | • BR-03 |

## 5. The end-to-end journey

| Step | What happens | Requirements |
|---|---|---|
| 1 | An employee sends a claim with one or more expense lines, and a receipt for every expense | • REQ-2.1<br>• REQ-2.2 |
| 2 | The claimant's line manager approves the claim | • REQ-3.1 |
| 3 | Claims over 500 also get finance approval | • REQ-3.2 |
| 4 | The claim moves from Approved to Paid | • REQ-2.3 |

## 6. NFRs

> **Metrics Confidence Summary:**
> - **CONFIRMED:** 0 metrics. Each one is fully supported by the source documents.
> - **TENTATIVE:** 1 metric. Each one is partly supported, and its details need checking.
> - **AI-RECOMMENDED:** 1 metric. The AI suggested each one, and you decide at the gate.
>
> **Items marked AI-RECOMMENDED are NOT from your source documents. They are suggestions that require your explicit acceptance before use.**

### Evidenced

| NFR ID | NFR | Source | Confidence |
|---|---|---|---|
| NFR-1 | The product works at least during office hours. | per workshop-notes-2026-09-12.md, item 9 | TENTATIVE: office hours are not defined |

### Recommended

| NFR ID | NFR | Why recommended | Confidence |
|---|---|---|---|
| NFR-2 | Receipts are kept for as long as the law requires | receipts are financial records, and no file says how long to keep them | AI-RECOMMENDED |

## 7. Transition requirements

| ID | Requirement | Source | Needs building? |
|---|---|---|---|
| TR-1 | Paper claims still open on the go-live date are finished on paper | per workshop-notes-2026-09-12.md, item 11 | No |

## 8. Dependencies and assumptions

### Dependencies

- The monthly payroll run pays approved claims — per payroll-cutoff-2026-09-20.eml
- Each claimant's line manager is known — per claims-requirements-v2.docx, section 3.1

### Assumptions

- Every claim is made in euros — Proposed (needs confirmation), question 4

## 9. Traceability matrix

| BR ID | Business requirement | Covered by | Status |
|---|---|---|---|
| BR-01 | Employees and contractors can claim business expenses without a paper form. | • REQ-2.1<br>• REQ-2.3 | Covered |
| BR-02 | Every claim is approved by someone other than the person who made it. | • REQ-3.1 | Covered |
| BR-03 | Claims over 500 are also approved by the finance team. | • REQ-3.2 | Covered |
| BR-04 | No claim is paid without its receipts. | • REQ-2.2 | Covered |

## Decision record

### Decision 1 — Who in the finance team may approve claims over 500?
- **Question:** 9
- **Asked at:** Accept the PRD?
- **Options offered:**
  - **Any member of the finance team** — Why: claims over the limit are never held up by one person being away. What happens next: Finance approver means any member of the finance team.
  - **Only the finance manager** — Why: one person sees every large claim. What happens next: Finance approver means the finance manager alone.
  - **I don't know yet** — What happens next: "Any member of the finance team" is used, marked Proposed (needs confirmation), and the finance team is asked before the FRD for approving a claim is accepted.
- **Recommended:** Any member of the finance team
- **Chosen:** Any member of the finance team
- **Decided by:** PO, 2026-10-08

## Check record

None yet.
