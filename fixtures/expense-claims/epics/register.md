# EPIC register — Expense claims

Status: drafted

- **Created:** 2026-10-12
- **Source grouping:** [grouping.md](grouping.md), version 1
- **Based on:** BRD and PRD both accepted
- **Copy checked on:** not yet

## 1. EPICs

| EPIC | Name | Outcome | Features | Band | Persona | Depends on |
|---|---|---|---|---|---|---|
| EPIC-001 | Claim submission | As a claimant, I need to send a claim with its receipts, so that I am paid back without a paper form | • F-01<br>• F-02<br>• F-03 | Mixed | Claimant | None |
| EPIC-002 | Claim approval | As a line manager, I need to approve or reject my team's claims, so that only checked claims are paid | • F-04<br>• F-05 | MVP | Line manager | • EPIC-001 |

## 2. Run order

| Order | EPIC | Rationale |
|---|---|---|
| 1 | EPIC-001 | a claim must be sent before it can be approved |
| 2 | EPIC-002 | it works on the claims that EPIC 1 lets people send |
