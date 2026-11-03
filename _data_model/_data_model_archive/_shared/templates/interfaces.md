# Interfaces — {product name}

> **What this is:** For each external the data flows name, the exchange between it and the product: who uses it and why, what passes in and out, how much and how often, the checks on what comes in, what starts an exchange, and what happens when one fails.
>
> **What it is not:** How an exchange is built, such as its method or message format, which is design; or the values an element allows, which are the Data Dictionary's.
>
> **Written by:** interface-author, from `templates/interfaces.md`. Checked by check-data-information.cjs before its gate.

> **Lineage**
> - **Previous step:** Data flows
> - **Primary source:** [data-flows.md](data-flows.md)
> - **Supporting sources:**
>   - [data-dictionary.md](data-dictionary.md)
>   - [{product}-prd.md](../{product}-prd.md)
> - **Next step:** the requirements are turned into features, by features-and-epics-workflow -> [feature-catalog.md](../frd/feature-catalog.md)

Status: drafted

## The interfaces

*One interface for each external in the data flows, in their order, and the data flows it carries.*

| Interface | External | Data flows |
|---|---|---|
| {interface ID} | {external} | {data flows} |

## Each interface

*One part for each interface above, in the same order, answering the same nine items. Every answer is "per" its source, "TBD, question {n}", or "Does not apply:" and the reason. What passes in and out, and the checks, name elements by their IDs in the Data Dictionary; the allowed values themselves stay there.*

### {interface ID} {external}

| Item | Answer |
|---|---|
| Who uses it | {who} |
| Why it is needed | {why} |
| What passes in | {in} |
| What passes out | {out} |
| How much | {volume} |
| When, and how often | {when} |
| Checks on what comes in | {checks} |
| What starts an exchange | {events} |
| When an exchange fails | {failure} |

## Decision record

*Every decision made at the interfaces' gate, in the order made, in the shape of `templates/parts/decision-record.md`.*

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
| {interface ID} | IF- and a number, from 1 | IF-1 |
| {external} | the external, as the data flows name it | Employee |
| {data flows} | the data flows to and from it, one per line | • Claim details<br>• Claim decision |
| {who} | who uses it, with its source | employees and contractors, per REQ-1.1 |
| {why} | why it is needed, with its source | to send a claim, per REQ-1.1 |
| {in} | the elements that pass into the product, one per line | • Claim.amount<br>• Receipt |
| {out} | the elements that pass out of it, one per line | • Claim.stage |
| {volume} | how much data, with its source | TBD, question 9 |
| {when} | when, and how often, with its source | whenever an employee sends a claim, per REQ-1.1 |
| {checks} | each element that is checked as it comes in, by its ID, and what the check refers to | • Claim.amount: its allowed values, per the Data Dictionary |
| {events} | what starts an exchange, with its source | an employee sends a claim, per REQ-1.1 |
| {failure} | what happens when an exchange fails, and what the person or system is told | TBD, question 7 |
