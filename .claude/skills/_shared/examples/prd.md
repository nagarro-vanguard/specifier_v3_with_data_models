> **Example.** A worked example of a PRD, for a made-up product called Expense claims. It follows on from the example BRD, once that BRD was accepted. It shows the PRD at its gate, with one question still open, Q4. Its Check record is still empty. When the gate ends, check-prd.ts's one line is pasted into that section: Pass or Fail, with the date and time. Nothing in it is a real requirement.
>
> The PRD names no file, no version and no decision. Two marks name a question in the Question log:
> - **Not known yet:** a value nothing gives yet reads `[TBD, Q{n}]`. This example has none.
> - **Suggested by the skill:** the assumption "Every claim is made in euros<sup>*Q4</sup>", with the legend line straight under its list

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

| Persona | Who they are |
|---|---|
| Claimant | an employee or contractor who has paid for something on the business's behalf |
| Line manager | the claimant's manager, who approves their claims |
| Finance approver | a member of the finance team, who also approves claims over the limit |

### Roles and permissions

| Role | Make a claim | Approve a claim from their team | Approve a claim over the limit |
|---|---|---|---|
| Claimant | Yes | No | No |
| Line manager | Yes | Yes | No |
| Finance approver | Yes | No | Yes |

## 4. Requirements

### 1. About this project

| ID | Kind | Label | In simple words | The client's words | Traces to |
|---|---|---|---|---|---|
| REQ-1.1 | Purpose | Problem | **Slow paper claims** — Paper claims take 18 working days from sending to payment. | **Why we need it** — Paper claims take 18 working days to pay. | • PRD section 2 |
| REQ-1.2 | Scope | Out of MVP | **Travel booking** — Booking travel is not part of the MVP. | **Not included** — Travel booking is not included. | • BRD section 4 |

### 2. Submitting claims

| ID | Kind | Label | In simple words | The client's words | Traces to |
|---|---|---|---|---|---|
| REQ-2.1 | Requirement | — | **Sending claims** — An employee can send a claim with one or more expense lines. | **Send a claim** — An employee sends a claim with one or more expense lines. | • BR-01 |
| REQ-2.2 | Requirement | — | **Receipt for every expense** — The platform needs a receipt for every expense. | **Receipts** — A receipt is attached for every expense. | • BR-04 |
| REQ-2.3 | Requirement | — | **Claim stages** — The platform keeps each claim in one of these stages: **Draft**, **Submitted**, **Approved**, **Rejected** or **Paid**. | **Claim stages** — A claim is Draft, Submitted, Approved, Rejected or Paid. | • BR-01 |

### 3. Approving claims

| ID | Kind | Label | In simple words | The client's words | Traces to |
|---|---|---|---|---|---|
| REQ-3.1 | Requirement | — | **Line manager approval** — The platform needs the claimant's line manager to approve every claim. | **Line manager approval** — Every claim is approved by the claimant's line manager. | • BR-02 |
| REQ-3.2 | Requirement | — | **Finance approval** — The platform needs finance approval for each claim over 500. | **Finance approval** — Claims over 500 need finance approval. | • BR-03 |

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

| NFR ID | NFR | Confidence |
|---|---|---|
| NFR-1 | The product works at least during office hours. | TENTATIVE: office hours are not defined |

### Recommended

| NFR ID | NFR | Why recommended | Confidence |
|---|---|---|---|
| NFR-2 | Receipts are kept for as long as the law requires | receipts are financial records, and no file says how long to keep them | AI-RECOMMENDED |

## 7. Transition requirements

| ID | Requirement | Needs building? |
|---|---|---|
| TR-1 | Paper claims still open on the go-live date are finished on paper | No |

## 8. Dependencies and assumptions

### Dependencies

- The monthly payroll run pays approved claims
- Each claimant's line manager is known

### Assumptions

- Every claim is made in euros<sup>*Q4</sup>

<sup>*</sup> Proposed: needs your confirmation. Qn is its question in the Question log.

## 9. Traceability matrix

| BR ID | Business requirement | Covered by | Status |
|---|---|---|---|
| BR-01 | Employees and contractors can claim business expenses without a paper form. | • REQ-2.1<br>• REQ-2.3 | Covered |
| BR-02 | Every claim is approved by someone other than the person who made it. | • REQ-3.1 | Covered |
| BR-03 | Claims over 500 are also approved by the finance team. | • REQ-3.2 | Covered |
| BR-04 | No claim is paid without its receipts. | • REQ-2.2 | Covered |

## Check record

None yet.
