# Story — Approve a Claim

| | |
|---|---|
| Status | ready |
| Req ID | • REQ-3.1 |
| Feature ID | F-04 |
| Work Item ID | TBD |

## Description

As a line manager, I want to approve a claim from my team, so that the claimant is paid back.

## Dependencies

- Send a claim (EXTERNAL): a claim must be sent before its line manager can approve it. Proved by FRD-3a, Gate In.

## Scope

- The claims waiting: every claim from the manager's team that waits for them
- Only their own: each person sees only their own claims, or the claims waiting for them
- Approve a claim
- Who approves: the claimant's own line manager
- Out of scope: reject a claim, told in Reject a Claim

## Rules

| Step | FRD rule ID | Rule |
|---|---|---|
| 1 | F-04.6 | send each claim to the claimant's own line manager |
| 2 | F-04.1 | show each line manager every claim waiting for their approval |
| Alternate | F-04.5 | **only** show each person their own claims, or the claims waiting for them |
| 3 | F-04.2 | let a line manager approve a claim waiting for them |

## Metrics traceability

- Working days from sending a claim to paying it

## Design links

- None

## Acceptance criteria

### Behaviour

**Scenario 1 - The claim goes to the claimant's manager (F-04.6)**
- **Given** a claimant has a line manager
- **When** the claimant sends a claim
- **Then** the claim waits for that line manager's approval

**Scenario 2 - The manager sees every claim waiting (F-04.1, F-04.5)**
- **Given** two claims from the line manager's team wait for their approval
- **And** a claim from another team waits for its own line manager
- **When** the line manager looks at the claims waiting for them
- **Then** they see both claims from their team
- **And** they don't see the claim from the other team

**Scenario 3 - The manager approves a claim (F-04.2)**
- **Given** a claim waits for its line manager's approval
- **When** the line manager approves it
- **Then** the claim's stage is Approved
- **And** it no longer waits for the line manager
