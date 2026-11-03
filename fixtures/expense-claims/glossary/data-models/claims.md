# Data model — Claims, Expense claims

Status: accepted on 2026-10-11, version 1

Next step: None: this file is accepted.

## Things and their fields

| Thing | Fields it gives |
|---|---|
| Claim | expense lines, stage, amount |
| Expense line | receipt |
| Receipt | – |

## Claim

Definition: what it is, in one plain sentence

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| Make | Send | Claimant | The new claim is **Draft**. |
| Browse | – | • Claimant<br>• Line manager<br>• Finance approver | A claimant sees their own claims. A line manager sees the claims waiting for them. A finance approver sees the claims waiting for them. |
| Open | – | • Claimant<br>• Line manager<br>• Finance approver | A claimant opens their own claims. A line manager opens the claims waiting for them. A finance approver opens the claims waiting for them. |
| Change | Send | Claimant | Only while the claim is **Draft**. |
| Send | Send | Claimant | Only while the claim is **Draft**. Refused while the claim holds no expense line. Refused while an expense line has no receipt. |
| Approve | Approve | Line manager | Only while the claim is **Submitted**. Only the claimant's own line manager approves it. |
| Reject | Reject | Line manager | Only while the claim is **Submitted**. Only the claimant's own line manager rejects it. |
| Approve over the limit | Approve | Finance approver | Only for a claim over 500. Only while the claim is **Approved**. |
| Remove | Send | Claimant | Only while the claim is **Draft**. |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|
| expense lines | several Expense lines | yes, only when it is sent | 1 or more | no | only while Draft | – |
| stage | one of:<br>• Draft<br>• Submitted<br>• Approved<br>• Rejected<br>• Paid | yes | – | – | moves: see How stage moves | Draft |
| amount | number | yes, only when it is sent | in euros, Proposed (needs confirmation), question 4 | – | only while Draft | – |

**How stage moves**

```
Start → Draft → Submitted → Approved → Paid
```

| From | To | When | Who |
|---|---|---|---|
| Start | Draft | a claimant makes a claim | Claimant |
| Draft | Submitted | the claimant sends it | Claimant |
| Submitted | Approved | its line manager approves it | Line manager |
| Submitted | Rejected | its line manager rejects it | Line manager |
| Approved | Paid | the monthly payroll run pays it. A claim that needs finance approval is paid only once a finance approver approves it. | the product |

No stage moves back. A **Rejected** claim stays **Rejected**.

| State | The claim… |
|---|---|
| Draft | can be changed or removed by its claimant. It is sent once it holds its expense lines and their receipts. |
| Submitted | waits for its line manager to approve it or reject it. |
| Approved | is paid with the next monthly payroll run. A claim approved after the 20th is paid with the run of the month after. A claim that needs finance approval waits for a finance approver first. |
| Rejected | is kept as a record. Its claimant can make a new claim. |
| Paid | is kept as a record. |

## Expense line

Definition: what it is, in one plain sentence

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| Add | Send | Claimant | For one claim. Only while the claim is **Draft**. |
| Browse | – | • Claimant<br>• Line manager<br>• Finance approver | Seen with its claim, by each person who sees the claim. |
| Open | – | • Claimant<br>• Line manager<br>• Finance approver | Opened with its claim, by each person who opens the claim. |
| Change | Send | Claimant | Only while its claim is **Draft**. |
| Remove | Send | Claimant | Only while its claim is **Draft**. |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|
| receipt | one Receipt | yes, only when its claim is sent | – | no | yes | – |

## Receipt

Definition: what it is, in one plain sentence

**Actions**

| Action | In step | Who | Rules |
|---|---|---|---|
| Attach | Send | Claimant | For one expense line. Only while its claim is **Draft**. |
| Browse | – | • Claimant<br>• Line manager<br>• Finance approver | Seen with its expense line, by each person who sees the claim. |
| Open | – | • Claimant<br>• Line manager<br>• Finance approver | Opened with its expense line, by each person who opens the claim. |
| Change | Send | Claimant | Only while its claim is **Draft**. |
| Remove | Send | Claimant | Only while its claim is **Draft**. |

| Field | Type | Required | Limits | Can two share it | Can change | Starts as |
|---|---|---|---|---|---|---|

## Check record

check-data-model.cjs, 2026-10-11: 28 of 28 checks passed, 0 findings. 4 open questions (1 must answer, 1 should answer, 2 can move ahead).
