# Data model — {product name}

> **What this is:** What the product holds, at the conceptual level and in business words: its entities, the attributes each one holds, what tells one apart from another, how many of one each other is related to, and how each entity starts and ends. Built from the Glossary, without repeating it.
>
> **What it is not:** What a term means or how terms nest, which are the Glossary's; which values an attribute allows, which is the Data Dictionary's; or a database design.
>
> **Written by:** data-model-author, from `templates/data-model.md`. Checked by check-data-information.cjs before its gate.

> **Lineage**
> - **Previous step:** Glossary
> - **Primary source:** [glossary/](../glossary/)
> - **Supporting sources:**
>   - [{product}-prd.md](../{product}-prd.md)
>   - [inventory.json](inventory.json)
> - **Next step:** every attribute is described in the Data Dictionary, by data-dictionary-author -> [data-dictionary.md](data-dictionary.md)

Status: drafted

## Entities

*One row for each Glossary object the product keeps data about, linked to its Glossary definition. Every other cell is an answer "per" its source, "TBD, question {n}", or "Does not apply:" and the reason.*

| Entity | Identifier | Starts when | Ends when |
|---|---|---|---|
| {entity link} | {identifier} | {starts when} | {ends when} |

## Attributes

*Every attribute of every entity, with the exact words that name it. A value-set in the Glossary is an attribute of the entity it belongs to, and so is a Glossary object that is one piece of information about another: "From the Glossary" names it.*

| Entity | Attribute | Evidence | From the Glossary |
|---|---|---|---|
| {entity} | {attribute} | {evidence} | {from the glossary} |

## Relationships

*How many of the second each one of the first is related to, one row for each direction. The Glossary's own links are the starting rows.*

| Relationship | How many |
|---|---|
| {entity} → {other entity} | {how many} |

## Metadata

*For each entity: whether who created or changed it, and when, is recorded; any restriction on creating, changing or using it; and any security, privacy or audit limit.*

| Entity | Recorded | Restrictions | Security, privacy or audit |
|---|---|---|---|
| {entity} | {recorded} | {restrictions} | {limits} |

## Not data

*Every Glossary object or value-set that is neither an entity nor an attribute, and why. None. when there are none.*

| Glossary term | Why |
|---|---|
| {glossary term} | {reason} |

## Diagram

*The entities and how many of each relate, drawn from the tables above. It never adds to them.*

```mermaid
erDiagram
    {ENTITY} {cardinality} {OTHER_ENTITY} : "{relationship}"
```

## The workflows that follow

*Whether each of the two conditional workflows runs, and why, as the specifier confirms at this document's gate.*

| Workflow | Runs | Why |
|---|---|---|
| state-model-workflow | {runs} | {why} |
| data-flow-workflow | {runs} | {why} |

## Decision record

*Every decision made at the data model's gate, including which workflows follow, in the order made, in the shape of `templates/parts/decision-record.md`.*

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
| {entity link} | the entity, in the Glossary's word, linked to its definition | [Claim](../glossary/object-terms.md#claim) |
| {identifier} | what tells one apart from another | TBD, question 4 |
| {starts when} | the event that brings one into being | when an employee sends it, per REQ-1.1 |
| {ends when} | how one ends, if it does | Does not apply: a claim is kept once paid, per REQ-4.2 |
| {entity} | the entity, in the Glossary's word | Claim |
| {attribute} | the attribute's name, in lowercase with hyphens between words. Its ID is the entity, a dot and this name | amount |
| {evidence} | the exact words that name it, in quotes, then where they are | "the total amount claimed", REQ-1.1 |
| {from the glossary} | the Glossary value-set or object it comes from, or - | Claim stage |
| {other entity} | the entity at the other end | Expense line |
| {how many} | exactly 1, 0 or 1, 1 or more, or 0 or more | 1 or more, per REQ-1.1 |
| {recorded} | whether who created or changed it, and when, is recorded | who sent it and when, per REQ-1.4 |
| {restrictions} | any restriction on creating, changing or using it | an approved claim can't be changed, per REQ-2.4 |
| {limits} | any security, privacy or audit limit | TBD, question 8 |
| {glossary term} | the object or value-set, in the Glossary's word | Home |
| {reason} | why it is not data | a page, nothing is kept about it, per Glossary |
| {ENTITY} and {OTHER_ENTITY} | the two entities, in capitals with underscores | CLAIM and EXPENSE_LINE |
| {cardinality} | how many on each side, in diagram marks | the marks for exactly one, and one or more |
| {relationship} | the link, in a few words | contains |
| {runs} | Runs, or Does not run | Runs |
| {why} | the reason. For state-model-workflow, it names by ID every attribute whose values are states | Claim.stage moves through its values, per REQ-2.1 |
