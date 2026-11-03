---
name: data-flow-workflow
allowed-tools: Read, Glob, Grep, Bash, Skill
description: >-
  The third Data and Information workflow, run only when the accepted data model
  confirms it: shows where data moves and settles every exchange with the outside,
  BABOK's Data Flow Diagrams and Interface Analysis, by running data-flow-author,
  then interface-author, stopping at each skill's own gate, then
  route-data-workflows.cjs. Use when route-data-workflows.cjs names it, for example
  "run the data flow workflow for expense-claims", or from a named step, such as
  "from interface-author". Not for the data model (use data-model-workflow).
---

# data-flow-workflow

> **What this is:** The workflow that settles where the product's data comes from and goes to, and, for every exchange with someone or something outside the product, what passes, what is checked, and what happens when it fails.
>
> **What it is not:** A skill. It writes nothing, checks nothing and decides nothing itself: each skill holds its own check and its own gate.
>
> **Who uses it:** A specifier, when `route-data-workflows.cjs` names it; and a change's paths, from a named step.

This workflow follows `../_shared/conventions.md`, `../_shared/decision-review-gates.md` and `../_shared/data-information.md`.

## One run

- **Covers:** the whole product.
- **Starts when:** the data model is accepted and confirms this workflow runs, and the workflows before it are accepted.
- **Ends with:** the data flows and the interfaces, both accepted.
- **Next:** `features-and-epics-workflow`.

## The steps

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `data-flow-author` | start: data model confirms it; the workflows before it accepted | • data model<br>• Data Dictionary | • Glossary<br>• PRD | • data flows<br>• Question log | `check-data-information.cjs --document data-flows` | Accept the data flows? | 2 |
| 2 | `interface-author` | 1 | • data flows<br>• Data Dictionary | PRD | • interfaces<br>• Question log | `check-data-information.cjs --document interfaces` | Accept the interfaces? | 3 |
| 3 | `route-data-workflows.cjs` | 2 | data model | none | none | none | none | `features-and-epics-workflow` |

## How it runs

1. Run `node tools/route-data-workflows.cjs --project {project}`. If it doesn't name this workflow, print its last line and stop.
2. Find the starting step. By default it is step 1. When the specifier names a step, start there.
3. **Steps 1 and 2:** call each skill and wait for its gate to end. Accepted: go on.
4. **Step 3:** run `node tools/route-data-workflows.cjs --project {project}`, and print its last line exactly.
