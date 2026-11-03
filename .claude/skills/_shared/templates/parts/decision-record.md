# Decision record — template

> **What this is:** The shape of the Decision record: the section near the end of every document that holds each decision the specifier made at its gate.
>
> **What it is not:** The questions themselves. Every question, open or answered, is kept in the Question log, with its ratings and its answers. Each entry records what the specifier decided, and names its question.
>
> **Who uses it:** Every skill that has a gate, and `close-change.ts`.

## 1. Where it goes

The Decision record is the second-last section of every document that has a gate, under the heading "Decision record". Only the Check record comes after it. Until the first decision is made, it says "None yet."

## 2. The rules

- **One entry per decision,** in the order the decisions were made, numbered from Decision 1 onward, with no gaps.
- **A past entry is never edited.** If a decision changes later, a new entry is added, and its question starts with "Replaces Decision {n}:".
- **An answer that wasn't one of the options** is added to the options as "Other: {the specifier's words}", and chosen.
- **"I don't know yet"** is recorded as chosen, like any other answer. The entry then also says which answer is in use for now: the recommended one, marked Proposed (needs confirmation). The question stays open in the Question log, with who can answer it and by which step. When the decision had no question of its own ("Question: None"), choosing "I don't know yet" adds one to the Question log.
- **Who decided** is always one of the specifiers: the BA or the PO.

## 3. What each entry holds

Each entry is a level-3 heading, then these lines:

| Part | What it holds |
|---|---|
| The heading | "Decision {n} — " and then the question, exactly as it was asked |
| Question | its number in the Question log. For the Can move ahead list, the number of every question it settles. "None" for a decision about the draft itself, not about the product. |
| Asked at | the gate, named by its question, such as "Accept the FRD?". For glossary-author, Gate 1 or Gate 2. |
| Options offered | every option, exactly as offered: at least two real answers, never "yes" or "no", then "I don't know yet". Each has its label, why the specifier would pick it, and what happens next. |
| Recommended | the label of the option the skill recommended |
| Chosen | the label of the option the specifier chose, exactly one |
| Answer in use for now | only when the chosen answer is "I don't know yet": the recommended answer, marked Proposed (needs confirmation), used until the question is answered |
| Decided by | BA or PO, and the date as YYYY-MM-DD |

## 4. Example

This is Decision 4 from the Claim approval FRD of the made-up Expense claims product, as it appears in the document:

### Decision 4 — When a claim is rejected, what does the claimant do next?
- **Question:** 11
- **Asked at:** Accept the FRD?
- **Options offered:**
  - **Fix it and send it again** — Why: the claimant only has to correct what the manager pointed out. What happens next: a rule is added that a rejected claim can be changed and sent again.
  - **Start a new claim** — Why: every claim that is sent is kept exactly as it was. What happens next: a rule is added that a rejected claim cannot be changed.
  - **I don't know yet** — What happens next: "Fix it and send it again" is used, marked Proposed (needs confirmation), and the question stays open for the finance team.
- **Recommended:** Fix it and send it again
- **Chosen:** Fix it and send it again
- **Decided by:** PO, 2026-10-13

Had the specifier chosen "I don't know yet", the entry would end like this instead:

- **Chosen:** I don't know yet
- **Answer in use for now:** Fix it and send it again, Proposed (needs confirmation). Question 11 stays open for the finance team, and goes on the list for the client.
- **Decided by:** PO, 2026-10-13

## 5. The closing entry of a change

When a change is complete, `close-change.ts` adds one more entry to the Decision record of the first document the change touched. It takes that record's next decision number.

| Part | What it holds |
|---|---|
| The heading | "Decision {n} — Change {nnn} closed" |
| Change | the change's number and short name |
| Applied in | each document the change was applied in, with its version, one per line |
| Closed on | the date, as YYYY-MM-DD |

Example:

### Decision 14 — Change 001 closed
- **Change:** 001, receipt limit
- **Applied in:**
  - expense-claims-prd.md, version 3
  - frd/frd-claim-submission.md, version 2
- **Closed on:** 2026-11-02
