---
name: state-model-workflow
allowed-tools: Read, Glob, Grep, Bash, Skill
description: >-
  The second Data and Information workflow, run only when the accepted data model
  confirms it: models how each entity moves through its states, BABOK's State
  Modelling, by running state-model-author, stopping at its gate, then
  route-data-workflows.cjs, which names the next workflow. Use when
  route-data-workflows.cjs names it, for example "run the state model workflow for
  expense-claims". Not for the data model (use data-model-workflow) or data flows
  (use data-flow-workflow).
---

# state-model-workflow

> **What this is:** The workflow that settles how the things the product holds change: their states, the moves between them, and what triggers each move.
>
> **What it is not:** A skill. It writes nothing, checks nothing and decides nothing itself.
>
> **Who uses it:** A specifier, when `route-data-workflows.cjs` names it; and a change's paths.

This workflow follows `../_shared/conventions.md`, `../_shared/decision-review-gates.md` and `../_shared/data-information.md`.

## One run

- **Covers:** every entity the data model confirms moves through states.
- **Starts when:** the data model is accepted and confirms this workflow runs, and the Data Dictionary is accepted.
- **Ends with:** the state models, accepted.
- **Next:** the workflow `route-data-workflows.cjs` names.

## The steps

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `state-model-author` | start: data model confirms it; Data Dictionary accepted | • data model<br>• Data Dictionary | • Glossary<br>• PRD | • state models<br>• Question log | `check-data-information.cjs --document state-models` | Accept the state models? | 2 |
| 2 | `route-data-workflows.cjs` | 1 | data model | none | none | none | none | the workflow it names |

## How it runs

1. Run `node tools/route-data-workflows.cjs --project {project}`. If it doesn't name this workflow, print its last line and stop.
2. **Step 1:** call `state-model-author` and wait for its gate to end.
3. **Step 2:** run `node tools/route-data-workflows.cjs --project {project}`, and print its last line exactly.
