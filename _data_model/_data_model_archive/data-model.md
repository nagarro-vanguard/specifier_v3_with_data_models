# Data model — {product name}

> **What this is:** The objects the product keeps details about, the details each one holds, and how many of one each other is linked to, laid out object by object. Built from the Glossary, without repeating it.
>
> **What it is not:** What a term means, which is the Glossary's; the rules for each detail, which are the Data Dictionary's; how an object moves through its stages, which is the state models'; or how the data is stored, which is the delivery team's.
>
> **Written by:** data-model-author, from `templates/data-model.md`. Checked by check-data-information.cjs before its gate.

> **Lineage**
> - **Previous step:** Glossary
> - **Primary source:** [glossary/](../glossary/)
> - **Supporting sources:**
>   - [{product}-prd.md](../{product}-prd.md)
> - **Next step:** every detail gets its field rules in the Data Dictionary, by data-dictionary-author -> [data-dictionary.md](data-dictionary.md)

Status: drafted

## Where each Glossary term goes

*Every term in the Glossary, in the Glossary's order, and the one place it goes, so nothing in the Glossary is lost on the way to the stories. "Goes to" is one of the four places below, then "per" its source:*
- *an object: a Glossary object, or a role the product keeps details about*
- *a detail of {object}: a Glossary object with no details of its own, or a set of states or values, which brings its values with it*
- *a value of {detail ID}: a step, or a role that is only a label*
- *Not data: and why, such as a screen nothing is kept about*

| Glossary term | Kind | Goes to |
|---|---|---|
| {glossary term} | {kind} | {goes to} |

## Objects

*One part for each object in "Where each Glossary term goes", in the same order. Each part links the object's Glossary definition and lists every detail it holds, with the exact words that name it, found anywhere in the PRD, not only in the object's own section. A detail's ID is the object, a dot and the detail's name, such as {detail ID}. The rules for each detail, such as whether it is required, are not written here: they are the Data Dictionary's.*

### {object}

[{object}]({object link}), {kind}

| Detail | Evidence | From the Glossary |
|---|---|---|
| {detail} | {evidence} | {from the glossary} |

## Links

*How many of the second each one of the first is linked to, one row for each direction, so every link has two rows. The Glossary's "part of" links are the starting rows. "How many" is exactly 1, 0 or 1, 1 or more, or 0 or more, then "per" its source; or "TBD, question {n}" when the sources are silent. A detail that belongs to the link itself, not to either object, is named in "Holds", and gets its field rules in the Data Dictionary like any other detail.*

| Link | How many | Holds |
|---|---|---|
| {object} → {other object} | {how many} | {link details} |

## Diagram

*The objects and how many of each are linked, drawn from the tables above. It never adds to them.*

```mermaid
erDiagram
    {OBJECT} {cardinality} {OTHER_OBJECT} : "{link}"
```

## Decision record

*Every decision made at the data model's gate, in the order made, in the shape of `templates/parts/decision-record.md`.*

None yet.

## Check record

*The record of the last check, pasted exactly as check-data-information.cjs printed it.*

None yet.

## Placeholders

*What to write for each label in this template, with an example from the made-up City library product. This section is never copied into the document.*

| Label | What to write | Example |
|---|---|---|
| {product name} | the project's name | City library |
| {product} | the project's name, as its folder has it | city-library |
| {glossary term} | a term, in the Glossary's word | Loan state |
| {kind} | the term's kind in the Glossary: object, role, step, or state or value | state or value |
| {goes to} | one of the four places, then "per" its source | a detail of Loan, per Glossary: belongs to Loan |
| {object} | an object, in the Glossary's word | Loan |
| {object link} | the link to its Glossary definition | ../glossary/object-terms.md#loan |
| {detail} | the detail's name, in lowercase with hyphens between words | due-date |
| {detail ID} | the object, a dot and the detail's name | Loan.due-date |
| {evidence} | the exact words that name it, in quotes, then where they are | "each book is due back three weeks after it is lent", REQ-2.1 |
| {from the glossary} | the Glossary term the detail comes from, or - | Loan state |
| {other object} | the object at the other end | Book |
| {how many} | exactly 1, 0 or 1, 1 or more, or 0 or more, then "per" its source; or TBD, question {n} | exactly 1, per REQ-2.1 |
| {link details} | each detail the link holds, by name, or None. | None. |
| {OBJECT} and {OTHER_OBJECT} | the two objects, in capitals with underscores | LOAN and BOOK |
| {cardinality} | how many on each side, in diagram marks | the marks for zero or more, and exactly one |
| {link} | the link, in a few words | lends |
