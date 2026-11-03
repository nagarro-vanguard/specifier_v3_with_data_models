# State models — {product name}

> **What this is:** For each entity that moves through states: what can be done in each state, every move between states with the event and condition behind it, and where it starts and ends.
>
> **What it is not:** The names of the states, which are the Glossary's value-sets, or the order of the product's stages, which is the Glossary's flow.
>
> **Written by:** state-model-author, from `templates/state-models.md`. Checked by check-data-information.cjs before its gate.

> **Lineage**
> - **Previous step:** Data Dictionary
> - **Primary source:** [data-model.md](data-model.md)
> - **Supporting sources:**
>   - [glossary/states-and-values.md](../glossary/states-and-values.md)
>   - [{product}-prd.md](../{product}-prd.md)
> - **Next step:** {next step}

Status: drafted

## Entities that move through states

*Every entity whose attribute the data model's "The workflows that follow" names as a state. Every cell is an answer "per" its source, "TBD, question {n}", or "Does not apply:" and the reason.*

| Entity | State held in | Starts in | Ends in | Can go back or skip |
|---|---|---|---|---|
| {entity} | {attribute} | {starting state} | {final state} | {back or skip} |

## Each model

*One part for each entity above, in the same order: what can be done in each state, then every move. Every value of its Glossary value-set is a state.*

### {entity}

| State | What can be done in it |
|---|---|
| {state} | {what can be done} |

| Move | Event | Condition | Actions |
|---|---|---|---|
| {from state} → {to state} | {event} | {condition} | {actions} |

```mermaid
stateDiagram-v2
    [*] --> {starting state}
    {from state} --> {to state} : "{event}"
```

## Decision record

*Every decision made at the state models' gate, in the order made, in the shape of `templates/parts/decision-record.md`.*

None yet.

## Check record

*The record of the last check, pasted exactly as check-data-information.cjs printed it.*

None yet.

## Placeholders

*What to write for each label in this template, with an example from the made-up Expense claims product. This section is never copied into the document.*

| Label | What to write | Example |
|---|---|---|
| {product name} | the project's name | Expense claims |
| {product} | the project's name, as its folder has it | expense-claims |
| {next step} | data-flow-workflow, when the data model's "The workflows that follow" confirms it, or features-and-epics-workflow | data flows are drawn, by data-flow-workflow -> [data-flows.md](data-flows.md) |
| {entity} | an entity that moves through states | Claim |
| {attribute} | the attribute that holds its state, by name | stage |
| {starting state} | the state it starts in | Submitted, per REQ-1.1 |
| {final state} | the state it ends in, or Does not apply: and why | Paid, per REQ-4.2 |
| {back or skip} | whether it can go back to an earlier state, or skip one | TBD, question 6 |
| {state} | a state, in the Glossary's word | Rejected |
| {what can be done} | what can be done while in it | the claimant reads why, per REQ-2.2 |
| {from state} and {to state} | the state the move leaves, and the one it reaches | Submitted → Approved |
| {event} | what causes the move | the line manager approves it, per REQ-2.1 |
| {condition} | what decides whether it happens, or Does not apply: and why | within the limit, per REQ-2.3 |
| {actions} | what happens with the move, or Does not apply: and why | the claimant is told, per REQ-2.5 |
