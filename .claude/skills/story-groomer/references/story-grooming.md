# Story grooming — style rules and examples

How `story-groomer` writes each story's grooming. The shape of the grooming sections is in `../../_shared/templates/story.md`: dependencies, scope, roles when they differ, the FRD rules quoted by ID in flow order with each one's step, metrics traceability and design links.

## Style rules

| Do | Don't |
|----|-------|
| Use the Glossary's agreed terms. When the sources define a term with two meanings, define it once. | Don't use a word from the "Words that can't be checked" list in `../../_shared/simple-writing-rules.md`, part 7. "Quickly" with no time can't be checked either. |
| Make scope boundaries explicit, in and out. It supports sizing. | Don't embed critical rules inside long paragraphs. List them instead. |
| Keep it scannable: short paragraphs and bullets | Don't prescribe technical solutions unless the sources mandate them |
| One story = one primary capability. If several appear, propose a split as a question | — |

## Appendix A: story grooming examples

### A.1 A groomed story (good)

The grooming of "Reject a Claim", from the made-up Expense claims product:

**Dependencies**

- Approve a Claim (work item pending): a claim must reach its line manager first. Proved by FRD-3a, Gate In.

**Scope**

- Reject a claim
- A reason is required: a rejection without a reason is not accepted
- Send a rejected claim again: the claimant can send it again

**Rules**

| Step | FRD rule ID | Rule |
|---|---|---|
| Alternate | F-04.3 | let a line manager reject a claim waiting for them |
| Alternate | F-04.4 | **not** accept a rejection that gives no reason |
| Alternate | F-04.6 | let a claimant send a rejected claim again |

*Why it's good:* The dependency says why it comes first, and which FRD gate proves it. The scope is short bullets, and the Rules table traces each one to the FRD. The rules are quoted from the FRD, word for word, by ID, in the order of the FRD's flow. Each rule has the step it belongs to. A program checks each quote and each step against the FRD. The story has no Roles section, because only the line manager rejects a claim.

### A.1b When Roles says something

In "Approve a Claim over 500", two actors differ, so the Roles section stays:

| Role | Approve a claim over 500 |
|---|---|
| Finance approver | Yes |
| Line manager | No |

### A.2 Scope statements

**Do:**
- "In scope: attach a receipt to an expense line of a claim that is still a draft."

**Don't:**
- "Enable receipts." Too vague.

### A.3 Dependency lines (good)

One line each, in the order they must be built: the story, its work item, why it comes first, and the proof.

- Send a Claim (1201): a claim must be sent before it can be rejected. Proved by FRD-3a, Gate In.
- Approve a Claim (work item pending): that story lists the claims waiting for a manager. Proved by FRD-3a, step 2.
- Pay a claim (EXTERNAL): work outside this EPIC. Proved by the EPIC register.

### A.4 Dependency rationale

**Good:**
- "Sends the claim this story rejects"
- "Records the reason the claimant reads when the claim comes back"

**Bad:**
- "Related to claims". Too vague: it names no concrete dependency.
- "Might need this later". Speculative: it is not grounded in the text.
