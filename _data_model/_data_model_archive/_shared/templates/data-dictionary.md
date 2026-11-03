# Data Dictionary — {product name}

> **What this is:** One entry for every attribute in the data model: what it means, the values it allows, whether it can be left out, and whether it repeats. The one home of every attribute's allowed values, except a Glossary value-set's, which stay in the Glossary.
>
> **What it is not:** What a term means, which is the Glossary's, or which entities there are and how they relate, which is the data model's.
>
> **Written by:** data-dictionary-author, from `templates/data-dictionary.md`. Checked by check-data-information.cjs before its gate.

> **Lineage**
> - **Previous step:** Data model
> - **Primary source:** [data-model.md](data-model.md)
> - **Supporting sources:**
>   - [glossary/](../glossary/)
>   - [{product}-prd.md](../{product}-prd.md)
> - **Next step:** {next step}

Status: drafted

## Elements

*One row for every attribute in the data model, in the data model's order. Every cell after the first two is an answer "per" its source, "TBD, question {n}", or "Does not apply:" and the reason. An attribute that holds a Glossary value-set names it, and its values stay in the Glossary.*

| Entity | Attribute | Meaning | Allowed values | Can be left out | Repeats |
|---|---|---|---|---|---|
| {entity} | {attribute} | {meaning} | {allowed values} | {can be left out} | {repeats} |

## Composite elements

*Every element made of other elements, and what it is made of, in order. None. when there are none.*

| Composite | Made of, in order |
|---|---|
| {composite} | {parts} |

## Decision record

*Every decision made at the Data Dictionary's gate, in the order made, in the shape of `templates/parts/decision-record.md`.*

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
| {next step} | the next workflow, as the data model's "The workflows that follow" confirms, or features-and-epics-workflow when neither runs | each entity that moves through states is modelled, by state-model-workflow -> [state-models.md](state-models.md) |
| {entity} | the entity, as the data model names it | Claim |
| {attribute} | the attribute's name, as the data model gives it | amount |
| {meaning} | what it means in this product; another name a source uses for it, in brackets | the total of the claim's expense lines (also "total"), per REQ-1.1 |
| {allowed values} | the Glossary value-set it holds, by name; otherwise a format: its kind, its length or range, its characters | Claim stage, per Glossary |
| {can be left out} | yes or no | no, per REQ-1.1 |
| {repeats} | once, or how many times | once, per REQ-1.1 |
| {composite} | an element made of others, by its ID | Claim.claimant |
| {parts} | the elements it is made of, in order, one per line | • Employee.name<br>• Employee.number |
