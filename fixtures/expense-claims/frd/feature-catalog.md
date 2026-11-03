# Feature catalog — Expense claims

Status: drafted

## 1. Catalog control

- **Requirement IDs:** REQ- and the section number from the client's file: section 3.2 is REQ-3.2
- **Feature IDs:** F-01 onward, running on across every section. A feature's ID never changes, and the ID of a dropped feature is never used again.
- **BR links:** per the BRD

## 2. Feature catalog

### 2. Submitting claims

| Feature ID | Feature | Description (what it is) | Done when (observable) | Covers (source IDs) | Priority | Basis | Depends on | Capability | Notes |
|---|---|---|---|---|---|---|---|---|---|
| F-01 | Send a claim | An employee sends a claim with one or more expense lines, so that the business can pay them back | A sent claim holds every expense line, and its stage is Submitted | • REQ-2.1 | Must | Benefit — no claim is paid until it is sent | None | FRD-2a Making a claim | None |
| F-02 | Receipts | A claimant attaches a receipt to each expense line, so that no claim is paid without proof | A claim can't be sent until every expense line has a receipt | • REQ-2.2 | Must | Regulatory — the expense policy requires a receipt for every expense | • F-01 | FRD-2a Making a claim | None |
| F-03 | Claim stages | Each claim shows the stage it has reached, so that a claimant knows what happens next | A claimant sees their claim's stage: Draft, Submitted, Approved, Rejected or Paid | • REQ-2.3 | Should | Benefit — fewer questions to the finance team | • F-01 | FRD-2a Making a claim | None |

### 3. Approving claims

| Feature ID | Feature | Description (what it is) | Done when (observable) | Covers (source IDs) | Priority | Basis | Depends on | Capability | Notes |
|---|---|---|---|---|---|---|---|---|---|
| F-04 | Manager approval | A line manager approves or rejects each claim from their team, so that only checked claims are paid | Each manager sees every claim waiting for them, and can approve it or reject it with a reason | • REQ-3.1 | Must | Penalty — paying an unapproved claim breaks the expense policy | • F-01 | FRD-3a Claim approval | None |
| F-05 | Finance approval | The finance team also approves each claim over 500, so that large claims get a second check | A claim over 500 waits for a finance approver once its manager approves it, and is paid only after they approve it | • REQ-3.2 | Must | Regulatory — the expense policy requires finance approval over the limit | • F-04 | FRD-3a Claim approval | None |

| Basis | The priority is driven by |
|---|---|
| Benefit | the value delivered when it is built |
| Penalty | what happens if it isn't built, including policy and legal demands |
| Cost | the effort it takes to build |
| Risk | the chance it can't deliver its value, or can't be built at all |
| Dependency | other features can't work without it |
| Time-sensitivity | its value drops after a date |
| Stability | how likely it is to change. A feature likely to change may wait. |
| Regulatory | the law or a policy requires it |

## 3. "Done when" pieces

### F-01 Send a claim

| Piece ID | Piece |
|---|---|
| F-01.dw1 | A sent claim holds every expense line |
| F-01.dw2 | its stage is Submitted |

### F-02 Receipts

| Piece ID | Piece |
|---|---|
| F-02.dw1 | A claim can't be sent until every expense line has a receipt |

### F-03 Claim stages

| Piece ID | Piece |
|---|---|
| F-03.dw1 | A claimant sees their claim's stage: Draft, Submitted, Approved, Rejected or Paid |

### F-04 Manager approval

| Piece ID | Piece |
|---|---|
| F-04.dw1 | Each manager sees every claim waiting for them |
| F-04.dw2 | can approve it |
| F-04.dw3 | reject it with a reason |

### F-05 Finance approval

| Piece ID | Piece |
|---|---|
| F-05.dw1 | A claim over 500 waits for a finance approver once its manager approves it |
| F-05.dw2 | is paid only after they approve it |

## 4. Coverage check

### 2. Submitting claims

| Requirement ID | Requirement | Covered by | Status |
|---|---|---|---|
| REQ-2.1 | Send a claim | • F-01 | Covered |
| REQ-2.2 | Receipts | • F-02 | Covered |
| REQ-2.3 | Claim stages | • F-03 | Covered |

### 3. Approving claims

| Requirement ID | Requirement | Covered by | Status |
|---|---|---|---|
| REQ-3.1 | Line manager approval | • F-04 | Covered |
| REQ-3.2 | Finance approval | • F-05 | Covered |

## 5. Data model coverage

| Data model file | Thing | Action or move | Feature |
|---|---|---|---|
| claims.md | Claim | Make | F-01 |
| claims.md | Claim | Browse | F-04 |
| claims.md | Claim | Open | F-03 |
| claims.md | Claim | Change | F-01 |
| claims.md | Claim | Send | F-01 |
| claims.md | Claim | Approve | F-04 |
| claims.md | Claim | Reject | F-04 |
| claims.md | Claim | Approve over the limit | F-05 |
| claims.md | Claim | Remove | F-01 |
| claims.md | Claim | Start → Draft | F-03 |
| claims.md | Claim | Draft → Submitted | F-03 |
| claims.md | Claim | Submitted → Approved | F-03 |
| claims.md | Claim | Submitted → Rejected | F-03 |
| claims.md | Claim | Approved → Paid | F-03 |
| claims.md | Expense line | Add | F-01 |
| claims.md | Expense line | Browse | F-01 |
| claims.md | Expense line | Open | F-01 |
| claims.md | Expense line | Change | F-01 |
| claims.md | Expense line | Remove | F-01 |
| claims.md | Receipt | Attach | F-02 |
| claims.md | Receipt | Browse | F-02 |
| claims.md | Receipt | Open | F-02 |
| claims.md | Receipt | Change | F-02 |
| claims.md | Receipt | Remove | F-02 |

## Decision record

### Decision 1 — Which feature gets Change, on a Claim?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-01** — Why: F-01 owns Make, the action that makes a claim. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: changing a claim could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-01" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-01
- **Chosen:** Give it to F-01
- **Decided by:** PO, 2026-10-12

### Decision 2 — Which feature gets Remove, on a Claim?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-01** — Why: F-01 owns Make, the action that makes a claim. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: removing a claim could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-01" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-01
- **Chosen:** Give it to F-01
- **Decided by:** PO, 2026-10-12

### Decision 3 — Which feature gets Browse, on an Expense line?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-01** — Why: F-01 owns Add, the action that makes an expense line. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: seeing expense lines could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-01" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-01
- **Chosen:** Give it to F-01
- **Decided by:** PO, 2026-10-12

### Decision 4 — Which feature gets Open, on an Expense line?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-01** — Why: F-01 owns Add, the action that makes an expense line. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: opening an expense line could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-01" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-01
- **Chosen:** Give it to F-01
- **Decided by:** PO, 2026-10-12

### Decision 5 — Which feature gets Change, on an Expense line?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-01** — Why: F-01 owns Add, the action that makes an expense line. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: changing an expense line could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-01" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-01
- **Chosen:** Give it to F-01
- **Decided by:** PO, 2026-10-12

### Decision 6 — Which feature gets Remove, on an Expense line?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-01** — Why: F-01 owns Add, the action that makes an expense line. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: removing an expense line could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-01" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-01
- **Chosen:** Give it to F-01
- **Decided by:** PO, 2026-10-12

### Decision 7 — Which feature gets Browse, on a Receipt?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-02** — Why: F-02 owns Attach, the action that makes a receipt. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: seeing receipts could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-02" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-02
- **Chosen:** Give it to F-02
- **Decided by:** PO, 2026-10-12

### Decision 8 — Which feature gets Open, on a Receipt?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-02** — Why: F-02 owns Attach, the action that makes a receipt. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: opening a receipt could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-02" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-02
- **Chosen:** Give it to F-02
- **Decided by:** PO, 2026-10-12

### Decision 9 — Which feature gets Change, on a Receipt?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-02** — Why: F-02 owns Attach, the action that makes a receipt. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: changing a receipt could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-02" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-02
- **Chosen:** Give it to F-02
- **Decided by:** PO, 2026-10-12

### Decision 10 — Which feature gets Remove, on a Receipt?
- **Question:** None
- **Asked at:** Accept the Feature catalog?
- **Options offered:**
  - **Give it to F-02** — Why: F-02 owns Attach, the action that makes a receipt. What happens next: the FRD for Making a claim proves it from the data model, with no new piece.
  - **A new feature** — Why: removing a receipt could be a feature of its own. What happens next: the catalog gets a new feature, with its own "Done when".
  - **I don't know yet** — What happens next: "Give it to F-02" is used, marked Proposed (needs confirmation).
- **Recommended:** Give it to F-02
- **Chosen:** Give it to F-02
- **Decided by:** PO, 2026-10-12

## Check record

None yet.
