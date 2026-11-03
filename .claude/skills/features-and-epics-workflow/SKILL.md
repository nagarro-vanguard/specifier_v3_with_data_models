---
name: features-and-epics-workflow
allowed-tools: Read, Glob, Grep, Bash, Skill
description: >-
  The workflow after the data model: takes the product from its PRD and its data
  model to its EPICs by running feature-author, then epic-grouping-author, then
  epic-author in register mode, then the register's copy check, then
  build-sequencing-mapping.ts, stopping at each skill's own gate. Use once the
  data model is accepted, for example "run the features
  and EPICs workflow for expense-claims", or from a named step for named items,
  such as "epic-grouping-author, place F-06 only". Not for the FRDs (use
  frd-workflow) or the stories (use stories-workflow).
---

# features-and-epics-workflow

> **What this is:** The workflow that connects the skills that turn the requirements into features, the features into EPICs, and the EPICs into the order they are built in.
>
> **What it is not:** A skill. It writes nothing, checks nothing and decides nothing itself: each skill holds its own check and its own gate, and each can be run on its own.
>
> **Who uses it:** A specifier, once the data model is accepted. A change's paths, from a named step.

This workflow follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`. Each skill it calls loads what it needs.

## One run

- **Covers:** the whole product.
- **Starts when:**
  - `data-model-workflow` has ended, and every data model file is accepted
  - a change's path names step 1, 2 or 3, in section 15 of its Change impact report
- **Ends with:** the EPIC register, EPIC sequencing and EPIC mapping.
- **Next:** `frd-workflow`. In a change, the next row of the change's path.

## The steps

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `feature-author` | start: data model accepted | • PRD<br>• data model files | • Glossary<br>• BRD | • Feature catalog<br>• Question log | `check-features.ts` | Accept the Feature catalog? | 2 |
| 2 | `epic-grouping-author` | 1 | Feature catalog | none | • EPIC grouping<br>• Question log | `check-epic-grouping.ts` | Pick a grouping, settle its clashes, confirm the EPIC brief list | 3 |
| 3 | `epic-author`, register mode | 2 | EPIC grouping | Feature catalog | EPIC register | `check-register.ts`. On a fail, back to step 3. | none: accepted when the copy check passes | 4 |
| 4 | `build-sequencing-mapping.ts` | 3 | • EPIC register<br>• EPIC grouping | Feature catalog | • EPIC sequencing<br>• EPIC mapping | none | none | run `frd-workflow` |

## How it runs

1. Run `node tools/scaffold-project.ts --project {project}`.
2. Find the starting step. By default it is step 1. When the specifier names a step, and the items it covers, start at that step, for those items only, such as "epic-grouping-author, place F-06 only". The skill at that step checks its own inputs, and stops if one is missing or not accepted.
   - **In a change:** run only the steps the change's path names, for the items it names. Give each skill the change's number. The skill then works in its "In a change" mode.
3. Call each step in order, and wait for its gate to end:
   - **Step 1:** feature-author holds its own gate. In section 5 of the catalog, it gives every action and move of the data model files to a feature. A row that no feature names shows "?", and the catalog can't be accepted until the gate settles it. When the specifier picks "a new requirement first" for a row, feature-author runs only step 1 of `change-request-workflow`, at the gate. The row then reads "waits on change" and the change's number, and the rest of the change runs after the gate. Accepted: go on.
   - **Step 2:** epic-grouping-author holds its own gate. In a change that places one new feature, its gate is "Confirm the placement?". Accepted: go on.
   - **Step 3:** epic-author copies the register and runs `check-register.ts`. On a fail it corrects the copy and runs the check again. A pass is the acceptance.
   - **Step 4:** run `node tools/build-sequencing-mapping.ts --project {project}`. A loop in the dependencies stops the run: it goes back to step 2, where the grouping's dependencies are settled.
4. Add nothing between the steps. Each skill runs probing-questions-author and `grade-questions.ts` inside itself, before its check and its gate, so the workflow has no steps of its own.
5. After step 4, print exactly: **Next: run frd-workflow.** In a change, print the next row of the change's path instead.

## How it goes back

- **An action or a move no feature names,** in section 5 of the catalog: a "?" row, settled at the catalog's gate. When it needs a new requirement first, it waits on a change. When that change is done, its path runs feature-author again, and the row gets its feature.
- **A loop in the EPICs' dependencies,** found at step 4: back to step 2, where the grouping's dependencies are settled.
- **A mistake in a field the register copies from the EPIC grouping:** the grouping changes only through a change, through `change-request-workflow`.
