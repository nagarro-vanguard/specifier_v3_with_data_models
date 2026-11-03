# EPIC grouping — Expense claims

Status: drafted

## 1. Feature inventory

| Feature ID | Feature Name | Source Reference | Priority | Brief Description | Depends on |
|---|---|---|---|---|---|
| F-01 | Send a claim | • REQ-2.1 | Must | An employee sends a claim with one or more expense lines | None |
| F-02 | Receipts | • REQ-2.2 | Must | A claimant attaches a receipt to each expense line | • F-01 |
| F-03 | Claim stages | • REQ-2.3 | Should | Each claim shows the stage it has reached | • F-01 |
| F-04 | Manager approval | • REQ-3.1 | Must | A line manager approves or rejects each claim from their team | • F-01 |
| F-05 | Finance approval | • REQ-3.2 | Must | The finance team also approves each claim over 500 | • F-04 |

## 2. Options

| Strategy | Groups EPICs by | Fits best when |
|---|---|---|
| By business capability | what the business does, such as Claim submission or Claim approval | most products, and the default first choice |
| By user journey stage | where the user is in the journey, such as Start, Use or Get support | the features follow one journey from end to end |
| By persona or role | who uses it, such as Claimant, Manager or Finance team | different users have clearly different work |
| By value stream or outcome | the business outcome, such as Faster payment or Lower cost | the plan is framed by outcomes |
| By delivery sequence | a first band to deliver, then a later band | there is a clear first release |
| By complexity or risk | small and safe first, then larger and riskier | sizing drives the plan |

### Option A: By business capability

**Cutting angle:** what the business does: a claim is made, then approved

| Sl. No. | EPIC Name | Features (by ID) | Band |
|---|---|---|---|
| 1 | Claim submission | • F-01<br>• F-02<br>• F-03 | Mixed |
| 2 | Claim approval | • F-04<br>• F-05 | MVP |

**Pros:**
- each EPIC matches one part of the expense policy
- each EPIC has one main persona

**Cons:**
- approval can't start until a claim can be sent

**Best if:** the team works through the policy in order

### Option B: By complexity or risk

**Cutting angle:** the plain claim first, then the controls the policy demands

| Sl. No. | EPIC Name | Features (by ID) | Band |
|---|---|---|---|
| 1 | Claim basics | • F-01<br>• F-03 | Mixed |
| 2 | Policy controls | • F-02<br>• F-04<br>• F-05 | MVP |

**Pros:**
- the riskiest rules are kept together

**Cons:**
- receipts sit away from the claim they belong to
- "Policy controls" serves two personas

**Best if:** the policy rules are still being settled

### Comparison in short

| Dimension | Option A | Option B |
|---|---|---|
| Number of EPICs | 2 | 2 |
| Cutting angle | By business capability | By complexity or risk |
| Delivery parallelism | Low | Low |
| Foundational dependency depth | Shallow | Shallow |
| Business-value visibility per EPIC | High | Medium |
| Team-boundary alignment | Strong | Weak |

### AI recommendation

- **Recommended option:** A
- **Rationale:** each EPIC delivers one step of the claim's life, and each has one main persona, so its value is easy to see
- **What could change this recommendation:** if the finance team's rules are still changing, option B keeps them in one EPIC

## 3. Chosen grouping: Option A, By business capability

### EPIC list

| Sl. No. | EPIC Name | Band |
|---|---|---|
| 1 | Claim submission | Mixed |
| 2 | Claim approval | MVP |

### EPIC definitions

| Sl. No. | EPIC Name | Outcome (hypothesis) | MVP | Later | Band | Persona |
|---|---|---|---|---|---|---|
| 1 | Claim submission | As a claimant, I need to send a claim with its receipts, so that I am paid back without a paper form | • F-01<br>• F-02 | • F-03 | Mixed | Claimant |
| 2 | Claim approval | As a line manager, I need to approve or reject my team's claims, so that only checked claims are paid | • F-04<br>• F-05 | None | MVP | Line manager |

### Borderline features

| Feature | Source | Placed in EPIC | Alternative EPIC | Why placed as decided |
|---|---|---|---|---|
| F-03 | REQ-2.3 | 1 | 2 | the claimant follows the stage, while approvers only change it |

### Inter-EPIC dependencies

| From (Sl. No.) | Depends on (Sl. No.) | Impact if unresolved | Linked by |
|---|---|---|---|
| 2 | 1 | there is nothing to approve until a claim can be sent | F-04 depends on F-01 |

### Suggested EPIC sequence

| Sequence | EPIC | Rationale |
|---|---|---|
| 1 | 1 Claim submission | a claim must be sent before it can be approved |
| 2 | 2 Claim approval | it works on the claims that EPIC 1 lets people send |

### Clashes, and how you settled them

None.

### EPIC brief list, in run order

| Order | EPIC | Brief | Reason |
|---|---|---|---|
| 1 | 1 Claim submission | no | its features are clear from the catalog |
| 2 | 2 Claim approval | yes | two approvers and a limit need one shared view before the stories |

## 4. Placements from changes

None yet.

## Decision record

### Decision 1 — Which grouping do we take?
- **Question:** None
- **Asked at:** Pick a grouping, settle its clashes, confirm the EPIC brief list
- **Options offered:**
  - **Option A, by business capability** — Why: each EPIC is one step of a claim's life, with one main persona. What happens next: Claim submission, then Claim approval.
  - **Option B, by complexity or risk** — Why: the policy rules stay together while they are settled. What happens next: Claim basics, then Policy controls.
  - **I don't know yet** — What happens next: option A is used, marked Proposed (needs confirmation), and this becomes a question in the Question log.
- **Recommended:** Option A, by business capability
- **Chosen:** Option A, by business capability
- **Decided by:** PO, 2026-10-12

## Check record

None yet.
