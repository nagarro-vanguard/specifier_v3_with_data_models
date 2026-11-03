# Story — Approve a Claim over 500

| | |
|---|---|
| Status | ready |
| Req ID | • REQ-3.2 |
| Feature ID | F-05 |
| Work Item ID | TBD |

## Description

As a finance approver, I want to approve a claim over 500 once its manager has, so that large claims get a second check.

## Dependencies

- Approve a Claim (work item pending): a claim over 500 goes to finance only once its line manager approves it. Proved by FRD-3a, step 4.

## Scope

- Over 500, to finance: a claim over 500 goes to a finance approver once its manager approves it
- 500 or less: such a claim never goes to finance
- Approve a claim over 500
- No payment before finance approves

## Roles

| Role | Approve a claim over 500 |
|---|---|
| Finance approver | Yes |
| Line manager | No |

## Rules

| Step | FRD rule ID | Rule |
|---|---|---|
| 4 | F-05.1 | send a claim over 500 to a finance approver once its line manager approves it |
| 5 | F-05.4 | **only** send a claim to a finance approver when it is over 500 |
| 6 | F-05.2 | let a finance approver approve a claim over 500 |
| 7 | F-05.3 | **not** pay a claim over 500 until a finance approver approves it |

## Metrics traceability

- Working days from sending a claim to paying it

## Design links

- None

## Acceptance criteria

### Behaviour

**Scenario 1 - A claim over 500 goes to finance (F-05.1)**
- **Given** a claim for 640 waits for its line manager's approval
- **When** the line manager approves it
- **Then** the claim waits for a finance approver

**Scenario 2 - A claim of 500 or less doesn't (F-05.4)**
- **Given** a claim for 120 waits for its line manager's approval
- **When** the line manager approves it
- **Then** the claim's stage is Approved
- **And** it never waits for a finance approver

**Scenario 3 - Finance approves, then it is paid (F-05.2, F-05.3)**
- **Given** a claim for 640 waits for a finance approver
- **When** a finance approver approves it
- **Then** the claim's stage is Approved
- **And** it is paid in the next payment run, and not before
