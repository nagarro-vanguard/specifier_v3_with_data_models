# Data model decisions — Expense claims

Status: accepted on 2026-10-11, version 2

## Open

None yet.

## Settled

### DM-1 — What stage does a new claim start in?

- **Where:** claims.md · Claim · stage · Starts as
- **Why I'm asking:** The PRD gives a claim 5 stages, with **Draft** first. It says a claimant sends a claim, but not which stage a new claim starts in.
- **Options:**
  - **Draft.** Why you'd pick it: the claimant can write the claim before they send it. What happens next: a new claim is **Draft**, and sending it moves it to **Submitted**.
  - **Submitted.** Why you'd pick it: a claim is made only when it is sent. What happens next: no claim is ever **Draft**.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** Draft
- **Chosen:** Draft
- **Decided by:** PO, 2026-10-11

### DM-2 — Who can see the list of claims, expense lines and receipts, and open one?

- **Where:** claims.md · Claim, Expense line and Receipt · Browse and Open
- **Why I'm asking:** The PRD says who makes a claim and who approves it. It doesn't say who can see a list of claims, or open one.
- **Options:**
  - **Each person sees their own claims, or the claims waiting for them.** Why you'd pick it: each person sees only the claims they act on. What happens next: a claimant sees their own claims. A line manager and a finance approver see the claims waiting for them. Expense lines and receipts are seen with their claim.
  - **Every role sees every claim.** Why you'd pick it: anyone can check any claim. What happens next: a claimant sees the claims and receipts of other claimants.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** Each person sees their own claims, or the claims waiting for them
- **Chosen:** Each person sees their own claims, or the claims waiting for them
- **Decided by:** PO, 2026-10-11

### DM-3 — Who can change a claim, its expense lines and its receipts, and until when?

- **Where:** claims.md · Claim, Expense line and Receipt · Change
- **Why I'm asking:** The PRD says a claimant sends a claim with its expense lines and receipts. It doesn't say whether they can be changed, or until when.
- **Options:**
  - **The claimant, only while the claim is Draft.** Why you'd pick it: the approvers see the claim exactly as it was sent. What happens next: once a claim is sent, nobody changes it, its expense lines or its receipts.
  - **The claimant, until the claim is approved.** Why you'd pick it: the claimant can fix a mistake while the claim waits. What happens next: a line manager may see a claim change while they look at it.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** The claimant, only while the claim is Draft
- **Chosen:** The claimant, only while the claim is Draft
- **Decided by:** PO, 2026-10-11

### DM-4 — Can a claim, an expense line or a receipt be removed?

- **Where:** claims.md · Claim, Expense line and Receipt · Remove
- **Why I'm asking:** The PRD says how a claim is sent, approved and paid. It never says that a claim, an expense line or a receipt can be removed.
- **Options:**
  - **The claimant removes them only while the claim is Draft.** Why you'd pick it: a claim that is never sent needs no record. What happens next: a sent claim, its expense lines and its receipts are kept as a record.
  - **Nobody removes them.** Why you'd pick it: every claim, even one never sent, stays as a record. What happens next: a claimant can't clear a draft they no longer need.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** The claimant removes them only while the claim is Draft
- **Chosen:** The claimant removes them only while the claim is Draft
- **Decided by:** PO, 2026-10-11

### DM-5 — Who can reject a claim?

- **Where:** claims.md · Claim · Reject · Who
- **Why I'm asking:** The Glossary has the Reject step, and the PRD gives a claim the stage **Rejected**. The PRD doesn't say who rejects a claim.
- **Options:**
  - **The claimant's own line manager.** Why you'd pick it: the line manager is the one who approves every claim. What happens next: a finance approver approves a claim over the limit, but never rejects it.
  - **The line manager, or a finance approver for a claim over the limit.** Why you'd pick it: the finance team can stop a large claim. What happens next: an **Approved** claim can still move to **Rejected**.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** The claimant's own line manager
- **Chosen:** The claimant's own line manager
- **Decided by:** PO, 2026-10-11

### DM-6 — When is a claim over the limit Approved?

- **Where:** claims.md · Claim · How stage moves
- **Why I'm asking:** The PRD says the line manager approves every claim. The finance team also approves a claim over the limit. The PRD doesn't say which approval makes the claim **Approved**.
- **Options:**
  - **When its line manager approves it, and it is paid only once a finance approver approves it too.** Why you'd pick it: a claim has one way into **Approved**, and the finance check comes before the payment. What happens next: a finance approver approves a claim that is **Approved**, before the payroll run pays it.
  - **Only once a finance approver approves it too.** Why you'd pick it: **Approved** means every approval is given. What happens next: a claim over the limit stays **Submitted** after its line manager approves it.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** When its line manager approves it, and it is paid only once a finance approver approves it too
- **Chosen:** When its line manager approves it, and it is paid only once a finance approver approves it too
- **Decided by:** PO, 2026-10-11

### DM-7 — Can a claim go back to an earlier stage?

- **Where:** claims.md · Claim · How stage moves
- **Why I'm asking:** The PRD gives a claim the stage **Rejected**. It doesn't say what happens to a claim after it is rejected.
- **Options:**
  - **Never: the claimant makes a new claim.** Why you'd pick it: every claim that is sent is kept exactly as it was. What happens next: a **Rejected** claim stays **Rejected**.
  - **A rejected claim can be changed and sent again.** Why you'd pick it: the claimant keeps their expense lines and receipts. What happens next: a **Rejected** claim can move back to **Submitted**.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** Never: the claimant makes a new claim
- **Chosen:** Never: the claimant makes a new claim
- **Decided by:** PO, 2026-10-11

### DM-8 — Can two claims hold the same expense line?

- **Where:** claims.md · Claim · expense lines · Can two share it
- **Why I'm asking:** The PRD says a claim holds one or more expense lines. It doesn't say whether one expense line can be on two claims.
- **Options:**
  - **An expense line is on one claim only.** Why you'd pick it: each expense is paid back once. What happens next: the same expense line on a second claim is refused.
  - **An expense line can be on several claims.** Why you'd pick it: a shared cost can be split. What happens next: the same expense could be paid back twice.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** An expense line is on one claim only
- **Chosen:** An expense line is on one claim only
- **Decided by:** PO, 2026-10-11

### DM-9 — Can two expense lines hold the same receipt?

- **Where:** claims.md · Expense line · receipt · Can two share it
- **Why I'm asking:** The PRD says every expense has a receipt attached. It doesn't say whether one receipt can be attached to two expense lines.
- **Options:**
  - **A receipt is for one expense line only.** Why you'd pick it: the finance team checks each expense against its own receipt. What happens next: the same receipt on a second expense line is refused.
  - **One receipt can cover several expense lines.** Why you'd pick it: one bill can hold several expenses. What happens next: the finance team checks one receipt against several expense lines.
  - **I don't know yet.** What happens next: this decision stays open, and is asked again first at the next run.
- **Recommended:** A receipt is for one expense line only
- **Chosen:** A receipt is for one expense line only
- **Decided by:** PO, 2026-10-11

## Glossary changes

None yet.

## Check record

check-data-model.cjs, 2026-10-11: 28 of 28 checks passed, 0 findings. 4 open questions (1 must answer, 1 should answer, 2 can move ahead).
