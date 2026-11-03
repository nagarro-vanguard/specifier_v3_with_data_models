---
name: data-model-workflow
allowed-tools: Read, Glob, Grep, Bash, Skill
description: >-
  The first Data and Information workflow: takes the product from its Glossary to
  its data model and Data Dictionary, BABOK's Data Modelling and Data Dictionary,
  by running data-model-author, then data-dictionary-author, stopping at each
  skill's own gate, then route-data-workflows.cjs, which names the next workflow
  the data model confirmed. Use once the Glossary is written, for example "run the
  data model workflow for expense-claims", or from a named step, such as "from
  data-dictionary-author". Not for the Glossary (use glossary-author), state models
  (use state-model-workflow) or data flows (use data-flow-workflow).
---

# data-model-workflow

> **What this is:** The workflow that settles what the product holds: its entities, their attributes and relationships, and the values each attribute allows.
>
> **What it is not:** A skill. It writes nothing, checks nothing and decides nothing itself: each skill holds its own check and its own gate, and each can be run on its own.
>
> **Who uses it:** A specifier, once the Glossary is written; and a change's paths, from a named step.

This workflow follows `../_shared/conventions.md`, `../_shared/decision-review-gates.md` and `../_shared/data-information.md`. Each skill it calls loads what it needs.

## One run

- **Covers:** the whole product.
- **Starts when:** the Glossary is written. Its inventory is kept current by `glossary-author` as the Glossary is built.
- **Ends with:** the data model and the Data Dictionary, both accepted, and the specifier's confirmation of which workflows follow.
- **Next:** the workflow `route-data-workflows.cjs` names.

## The steps

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `data-model-author` | start: Glossary written | • inventory<br>• Glossary<br>• PRD | none | • data model<br>• Question log | `check-data-information.cjs --document data-model` | Accept the data model, and confirm which workflows follow? | 2 |
| 2 | `data-dictionary-author` | 1 | data model | • Glossary<br>• PRD | • Data Dictionary<br>• Question log | `check-data-information.cjs --document data-dictionary` | Accept the Data Dictionary? | 3 |
| 3 | `route-data-workflows.cjs` | 2 | data model | none | none | none | none | the workflow it names |

## How it runs

1. Run `node tools/scaffold-project.cjs --project {project}`.
2. Find the starting step. By default it is step 1. When the specifier names a step, start there; the skill at that step checks its own inputs, and stops if one is missing or not accepted.
3. **Steps 1 and 2:** call each skill and wait for its gate to end. Accepted: go on.
4. **Step 3:** run `node tools/route-data-workflows.cjs --project {project}`, and print its last line exactly.
5. Add nothing between the steps. Each skill runs probing-questions-author and `grade-questions.cjs` inside itself, before its check and its gate.
