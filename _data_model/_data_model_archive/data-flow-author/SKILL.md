---
name: data-flow-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the data flows, BABOK's Data Flow Diagrams: every external that sends or
  receives data, every process named with a verb and a noun, every data store, and
  every data flow between them, as a context diagram and, when there is more than
  one process, a level 1 diagram. Runs only when the accepted data model confirms
  data-flow-workflow runs. One gate, "Accept the data flows?". Use as step 1 of
  data-flow-workflow, or on its own, for example "draw the data
  flows for expense-claims". Not for what each exchange involves (use
  interface-author).
---

# data-flow-author

> **What this is:** The skill that shows where the product's data comes from, which processes change it, where it is kept, and who or what receives it.
>
> **What it is not:** The Glossary's flow, which is the order of the stages, or the interfaces, which say what each exchange with the outside involves.
>
> **Who uses it:** `data-flow-workflow`, at step 1. A specifier, on its own, with the project's name.

- You **draft**; the specifier **decides** every question it raises, and whether to accept it.
- If the accepted data model says `data-flow-workflow` does not run, say so, with its reason, and stop. Write nothing.

## Words used in this skill

| Word | What it means | Example |
|---|---|---|
| External | a person, organization or system outside the product that sends or receives data | Employee |
| Process | an activity that turns data in into data out, named with a verb and a noun | P1 Send a claim |
| Data store | where an entity's data is kept for later | Claims |
| Data flow | a movement of data, named with a noun | Claim details |
| Context diagram | the product as one process, with its externals | Expense claims, with Employee and Line manager |
| Level 1 diagram | the product's processes, data stores and externals | P1 Send a claim, P2 Decide a claim, and Claims |

## Invoke it with

| You give | Example |
|---|---|
| the **project** | `expense-claims` |

- It reads the accepted data model and Data Dictionary, and the state models when they ran, and looks up the Glossary and the PRD by ID.

## Load first

- `../_shared/data-information.md`: the rules. **Enforce them; don't restate them.**
- `../_shared/templates/data-flows.md`: the document's layout.
- `../_shared/decision-review-gates.md`: how you speak at the gate.

## Step 1: Draft

1. Create `data/data-flows.md` from the template, with `Status: drafted`.
2. **Externals:** each Glossary role that sends or receives data, and each outside system or organization the PRD names, such as a payment provider.
3. **Processes:** one for each Glossary step that takes data in and gives data out, renamed with a verb and a noun; and any other the requirements describe.
4. **Data stores:** one for each entity in the data model whose data a process keeps.
5. **Data flows:** every movement the requirements describe, from an external, process or store to another, each naming the entities or attribute IDs that move. Every flow starts or ends at a process.
6. Every external, store and process has a flow, and every process has one in and one out. When the sources don't say what one receives or sends, it is a question, never an invented flow.
7. Draw the context diagram and, with more than one process, the level 1 diagram, from the tables, adding nothing.

## Step 2: Questions and the check

- Run probing-questions-author on the data flows, then `node tools/grade-questions.cjs --project {project}`.
- Run `node tools/check-data-information.cjs --project {project} --document data-flows`. Fix every finding, and run it again.

## Step 3: The gate and acceptance

Hold the gate as `../_shared/decision-review-gates.md` says, with **Accept the data flows?**. After **Accept**, run `node tools/accept.cjs --project {project} --document data-flows`, paste the "For the file" block into the Check record, and close with `status.cjs`.

## Output

- The file `data/data-flows.md`, holding the data flows only.
