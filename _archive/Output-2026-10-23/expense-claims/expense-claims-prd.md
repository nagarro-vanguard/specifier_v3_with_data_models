# PRD — Expense claims

> **What this is:** Every requirement the client stated, word for word, each with its source, in the source's own order. It also holds the personas, the end-to-end journey, the NFRs and the transition requirements.
>
> **What it is not:** Features, priorities or decided rules. Features and priorities come in the Feature catalog, and decided rules in the FRDs.
>
> **Written by:** prd-author, from `templates/prd.md`. Checked by check-prd.cjs before its gate.

> **Lineage**
> - **Previous step:** BRD
> - **Primary source:** [expense-claims-brd.md](expense-claims-brd.md)
> - **Supporting sources:**
>   - [expense-claims-discovery-brief.md](expense-claims-discovery-brief.md)
>   - [claims-requirements-v2.docx](sources/requirements/claims-requirements-v2.docx)
>   - [expense-policy-2026.pdf](sources/policies/expense-policy-2026.pdf)
>   - [workshop-notes-2026-09-12.md](sources/workshops/workshop-notes-2026-09-12.md)
>   - [payroll-cutoff-2026-09-20.eml](sources/emails/payroll-cutoff-2026-09-20.eml)
> - **Next step:** glossary-author agrees the words the product uses -> [glossary/](glossary/)

Status: drafted

## 1. Document control

*Who owns the PRD, and which version of the BRD it was written from.*

| | |
|---|---|
| Owner | PO |
| Source BRD | [expense-claims-brd.md](expense-claims-brd.md), version 1 |

## 2. Product overview

*What the product is and what it is worth, in three to five sentences. It points to the BRD for the business case, and doesn't repeat it.*

Expense claims lets employees and contractors claim business expenses online, with their receipts. Their line manager approves or rejects each claim, and the finance team also approves claims over 500. Approved claims are paid with the monthly payroll run. The business case is in the BRD, section 1.

## 3. Personas and roles

*Who uses the product, and what each role may do. Roles and permissions come only from the files: a cell the files don't settle reads TBD and names its question in the Question log, such as "TBD, question 10".*

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

## 4. Requirements, word for word

*Every requirement, exactly as the client wrote it, in the order and under the headings of the client's own file. Nothing is reworded, merged, split or ranked here. A rule the client states stays here, word for word; rules decided later live in the FRDs. Each row names its source, so a new version of the file can be compared row by row.*

### 2. Submitting claims

| ID | Requirement as written | Source | Traces to |
|---|---|---|---|
| REQ-2.1 | **Send a claim** — An employee sends a claim with one or more expense lines. | claims-requirements-v2.docx, version 2, section 2.1 | • BR-01 |
| REQ-2.2 | **Receipts** — A receipt is attached for every expense. | claims-requirements-v2.docx, version 2, section 2.2 | • BR-04 |
| REQ-2.4 | **Claim stages** — A claim is Draft, Submitted, Approved, Rejected or Paid. | claims-requirements-v2.docx, version 2, section 2.4 | • BR-01 |

### 3. Approving claims

| ID | Requirement as written | Source | Traces to |
|---|---|---|---|
| REQ-3.1 | **Line manager approval** — Every claim is approved by the claimant's line manager. | claims-requirements-v2.docx, version 2, section 3.1 | • BR-02 |
| REQ-3.2 | **Finance approval** — Claims over 500 need finance approval. | claims-requirements-v2.docx, version 2, section 3.2 | • BR-03 |

## 5. The end-to-end journey

*The whole product as one journey, from the first thing a user does to the last, in the files' own words. Each step names the requirements it involves. Later, each FRD describes the flow inside one part of this journey.*

| Step | What happens | Requirements |
|---|---|---|
| 1 | An employee sends a claim with one or more expense lines, and a receipt for every expense | • REQ-2.1<br>• REQ-2.2 |
| 2 | The claimant's line manager approves the claim | • REQ-3.1 |
| 3 | Claims over 500 also get finance approval | • REQ-3.2 |
| 4 | The claim moves from Approved to Paid | • REQ-2.4 |

## 6. NFRs

*How well the product must work, rather than what it does: speed, availability, security, accessibility and scale. NFRs live only here, each with an ID, and every later document refers to them by ID. A threshold no file gives is TBD, never made up.*

> **Metrics Confidence Summary:**
> - **CONFIRMED:** 0 metrics (fully evidenced from source documents)
> - **TENTATIVE:** 1 metric (partially evidenced, details need verification)
> - **AI-RECOMMENDED:** 1 metric (suggested by AI, decided by you at the gate)
>
> **Items marked AI-RECOMMENDED are NOT from your source documents. They are suggestions that require your explicit acceptance before use.**

### Evidenced

*NFRs that a file states.*

| NFR ID | NFR | Source | Confidence |
|---|---|---|---|
| NFR-1 | It should work during office hours at least. | per workshop-notes-2026-09-12.md, item 9 | TENTATIVE: office hours are not defined |

### Recommended

*NFRs no file states, suggested because the product would be at risk without them. Each one is accepted, changed or rejected at the gate.*

| NFR ID | NFR | Why recommended | Confidence |
|---|---|---|---|
| NFR-2 | Receipts are kept for as long as the law requires | receipts are financial records, and no file says how long to keep them | AI-RECOMMENDED |

## 7. Transition requirements

*What has to happen to move from today's way of working to the new product, such as moving old records, training people, or running the old and new ways side by side. "Needs building?" says whether the product itself must do it. Every "No" must also appear in the BRD's release criteria, so it is still checked before release.*

| ID | Requirement | Source | Needs building? |
|---|---|---|---|
| TR-1 | Paper claims still open on the go-live date are finished on paper | per workshop-notes-2026-09-12.md, item 11 | No |

## 8. Dependencies and assumptions

*What the product relies on that it doesn't control, and what is taken as true without proof.*

### Dependencies

- The monthly payroll run pays approved claims — per payroll-cutoff-2026-09-20.eml
- Each claimant's line manager is known — per claims-requirements-v2.docx, section 3.1

### Assumptions

- Every claim is made in euros — Proposed (needs confirmation), question 4

## 9. Traceability matrix

*Every business requirement in the BRD, one row each, and the requirements that cover it. A BR with nothing covering it is a Gap, and its row names its question in the Question log.*

| BR ID | Business requirement | Covered by | Status |
|---|---|---|---|
| BR-01 | Employees and contractors can claim business expenses without a paper form. | • REQ-2.1<br>• REQ-2.4 | Covered |
| BR-02 | Every claim is approved by someone other than the person who made it. | • REQ-3.1 | Covered |
| BR-03 | Claims over 500 are also approved by the finance team. | • REQ-3.2 | Covered |
| BR-04 | No claim is paid without its receipts. | • REQ-2.2 | Covered |

## Decision record

*Every decision made at the PRD's gate, in the order made, in the shape of `templates/parts/decision-record.md`.*

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

*The record of the last check, pasted exactly as check-prd.cjs printed it.*

None yet.
