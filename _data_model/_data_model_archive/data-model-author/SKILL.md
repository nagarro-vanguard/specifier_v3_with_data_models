---
name: data-model-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the product's data model, BABOK's Data Modelling at the conceptual level:
  every Glossary object sorted into an entity, an attribute or not data; every
  attribute the Glossary and the PRD name, each with its quote; each entity's
  identifier, lifespan and metadata; every relationship with how many on each
  side; and which Data and Information workflows follow, never restating the
  Glossary. One gate, "Accept the
  data model, and confirm which workflows follow?". Use once the Glossary is
  written, as step 1 of data-model-workflow, or on its own, for example "write the
  data model for expense-claims". Not for allowed values (use
  data-dictionary-author).
---

# data-model-author

> **What this is:** The skill that turns the Glossary's terms into the product's data model: what it keeps data about, what each thing holds, what tells one from another, and how things relate.
>
> **What it is not:** The Glossary, which settles the words and their meanings, or the Data Dictionary, which settles the values each attribute allows.
>
> **Who uses it:** `data-model-workflow`, at step 1. A specifier, on its own, with the project's name.

- You **draft**; the specifier **decides** every question the data model raises, and whether to accept it.
- The data model is a **living document**: its status line says only drafted, accepted or parked, and only programs change it.

## Words used in this skill

| Word | What it means | Example |
|---|---|---|
| Inventory | every term, link, value-set, state and noticed attribute the Glossary run holds, kept current by `build-data-inventory.cjs` | `data/inventory.json` |
| Entity | something the product keeps data about, with its own identity | Claim |
| Attribute | one piece of information an entity holds | Claim.amount |
| Identifier | what tells one entity apart from another | a claim number |
| Relationship | a link between two entities, with how many on each side | each claim has one or more expense lines |
| Not data | a Glossary object nothing is kept about, such as a page or a stage | Home |
| The workflows that follow | the section that says whether state-model-workflow and data-flow-workflow run, confirmed at the gate | state-model-workflow: Runs |

## Invoke it with

| You give | Example |
|---|---|
| the **project** | `expense-claims` |

- It finds the inventory, the Glossary and the PRD itself.
- Use only these inputs, never facts from chat or memory.
- If the Glossary isn't written, say so and stop.

## Load first

- `../_shared/data-information.md`: the rules. **Enforce them; don't restate them.**
- `../_shared/templates/data-model.md`: the document's layout. **Fill it; don't re-describe it here.**
- `../_shared/decision-review-gates.md`: how you speak at the gate.

## Step 1: Draft

1. Run `node tools/scaffold-project.cjs --project {project}`, then `node tools/build-data-inventory.cjs --project {project}` if the inventory is older than the Glossary.
2. Create `data/data-model.md` from the template, with `Status: drafted`.
3. **Sort every Glossary object** in the inventory into an entity, an attribute of another entity, or not data, by the rules' "Sorting what the Glossary holds". Every object lands in exactly one of the three. An object that is an attribute is named in that attribute's "From the Glossary" column.
4. **Find every attribute,** by the rules' "Finding attributes": the value-sets and the attributes the section drafts noticed first, then each definition, then every PRD requirement. Each attribute gets its evidence: the exact words, and where they are. A value-set becomes the attribute that holds it, named in the "From the Glossary" column; a value-set that belongs to no entity goes under Not data, with why.
5. **Restate nothing the Glossary holds** (the rules' "Never restate the Glossary"): link each entity to its definition, and name a value-set instead of listing its values.
6. **Answer each entity's items:** its identifier, when it starts, when it ends, and its metadata. Each is an answer "per" its source, "TBD, question {n}", or "Does not apply:" and why.
7. **Write every relationship,** one row for each direction: each Glossary `contains` and `reveals` link between two entities, and each one a definition or requirement states. "How many" comes from the source's own words, such as "exactly one" or "one or more"; when the source has none, it is a question. The Glossary's `kind of` links are not repeated.
8. **Draw the diagram** from the tables, adding nothing.
9. **Fill "The workflows that follow",** for the specifier to confirm at the gate:
   - `state-model-workflow` **runs** when any value-set on an entity is a state, by the rules' "Value-sets". Its "Why" names every such attribute by ID.
   - `data-flow-workflow` **runs** when the Glossary names a role, or the PRD names a person or system outside the product, that sends or receives data.

## Step 2: Questions and the check

- Run probing-questions-author on the data model, write each question's number where its gap is, then run `node tools/grade-questions.cjs --project {project}`.
- Run `node tools/check-data-information.cjs --project {project} --document data-model`. On any finding, fix the document by the rules, then run it again. **Never show the specifier anything while a check fails.**
- Then read the document for what the program can't check: that every sort and every quote is right, and that no attribute in the PRD was missed.

## Step 3: The gate and acceptance

Hold the gate exactly as `../_shared/decision-review-gates.md` says:
- First, the check's "For the person" block, then the grader's.
- The Must answer questions first, one at a time; then the others in the grader's order. Record each answer as soon as it is given, and apply it: the TBD becomes the answer "per your decision at Accept the data model?".
- Never decide a question yourself.
- Then "The workflows that follow", one workflow at a time: "Runs" or "Does not run", with its reason. A change from the draft is a decision, recorded like any other.
- Run the check again, then ask **Accept the data model, and confirm which workflows follow?**
- After **Accept**, run `node tools/accept.cjs --project {project} --document data-model`, paste the check's "For the file" block into the Check record, and close with `status.cjs`.

## In a change

When a Change impact report names the data model, read the report too, and change only what it names. An accepted ID never changes.

## Output

- The file `data/data-model.md`. It holds the data model only: everything said to the specifier goes in the message.
