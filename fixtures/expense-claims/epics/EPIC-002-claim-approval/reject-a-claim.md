# Story — Reject a Claim

| | |
|---|---|
| Status | ready |
| Req ID | • REQ-3.1 |
| Feature ID | F-04 |
| Work Item ID | TBD |

## Description

As a line manager, I want to reject a claim with a reason, so that the claimant knows what to fix.

## Dependencies

- Approve a Claim (work item pending): a claim must reach its line manager first. Proved by FRD-3a, Gate In.

## Scope

- Reject a claim
- Who rejects: only the claimant's own line manager
- A reason is required: a rejection without a reason is not accepted
- The reason reaches the claimant: the claimant sees why their claim was rejected

## Rules

| Step | FRD rule ID | Rule |
|---|---|---|
| Alternate | F-04.3 | let a line manager reject a claim waiting for them |
| Alternate | F-04.7 | **only** let the claimant's own line manager reject a claim |
| Alternate | F-04.4 | **not** accept a rejection that gives no reason |
| Alternate | F-04.8 | show the claimant the reason their claim was rejected |

## Metrics traceability

- Working days from sending a claim to paying it

## Design links

- None

## Acceptance criteria

### Behaviour

**Scenario 1 - Reject a claim with a reason (F-04.3, F-04.8)**
- **Given** a claim waits for its line manager's approval
- **When** the line manager rejects it, with a reason
- **Then** the claim's stage is Rejected
- **And** the claimant sees the reason

**Scenario 2 - Reject without a reason (F-04.4)**
- **Given** a claim waits for its line manager's approval
- **When** the line manager rejects it without giving a reason
- **Then** the claim is not rejected
- **And** it still waits for the line manager

**Scenario 3 - Only the claimant's own manager rejects (F-04.7)**
- **Given** a claim waits for its line manager's approval
- **When** a line manager from another team rejects it
- **Then** the claim is not rejected
- **And** it still waits for its own line manager
