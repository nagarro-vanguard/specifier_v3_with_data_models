---
name: data-model-workflow
allowed-tools: Read, Edit, Glob, Grep, Bash, Skill
description: >-
  Takes the product from its Glossary to its data model: things-author lists the
  things, data-model-author writes one data model file per Glossary family, and once
  every file is accepted, every Glossary change the data model found goes to
  glossary-disposition together, in one run. Then the data model is brought back
  in step with the Glossary. Stops at each skill's own gate. Says up front which
  mode it is in: a change, a new build, picking up where it stopped, or nothing
  to do. Use once the Glossary is written, for example "run the data model
  workflow for city-library", or from a named step for named files, such as
  "data-model-author, lending.md only". Not for the features (use
  features-and-epics-workflow) or the FRDs (use frd-workflow).
---

# data-model-workflow

> **What this is:** The workflow that turns the Glossary into the data model. First comes the list of things, then one data model file for each family. Then every Glossary change the data model found goes to the Glossary together, and the data model is brought in step with the answers.
>
> **What it is not:** A skill. It checks nothing and decides nothing itself: each skill holds its own check and its own gate, and each can be run on its own. It writes only the status of each Glossary change, in the decisions file. It never comments on the requirements: the data model works from the Glossary.
>
> **Who uses it:** A specifier, once the Glossary is written. A change's path, from step 1 or step 2.

This workflow follows `../_shared/data-model-design.md` and `../_shared/simple-writing-rules.md`. Each skill it calls loads what it needs.

## One run

- **Covers:** the whole product.
- **Starts when:**
  - the Glossary is written
  - a change's path names step 1 or step 2, in section 15 of its Change impact report
- **Ends with:**
  - every data model file accepted
  - every Glossary change sent to the Glossary, and each one the Glossary settled brought into the data model
- **Next:** `features-and-epics-workflow`. In a change, the next row of the change's path.

## The steps

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `things-author` | start: Glossary written | • Glossary<br>• BRD<br>• PRD | none | • `glossary/data-models/{product}-glossary-things.md`<br>• its product-wide decisions and Glossary changes, in the decision register, `glossary/data-models/{product}-data-model-decisions.md` | `check-data-model.ts` | Gate 1: the product-wide decisions, as multiple choice, then Accept the things? | 2 |
| 2 | `data-model-author`, once for each family the things file names | 1 | • the things file<br>• the settled product-wide decisions<br>• Glossary<br>• BRD<br>• PRD | none | • one data model file, such as `glossary/data-models/lending.md`<br>• its decisions and Glossary changes, in the decision register | `check-data-model.ts` | Gate 2: the decisions, as multiple choice, then Accept the {family name} data model? | • 2, for the next family<br>• 3, after the last family |
| 3 | `glossary-disposition`, once, with every Glossary change as one batch | 2, every file accepted | the decision register's Glossary changes marked "To raise", from every family | Glossary | • Glossary<br>• Glossary gate log<br>• a ripple list of the documents that use each term<br>• the new words, through `glossary-author`, in one run | none before its gate. After it: the method's character sweep and link check, and `check-simple-writing.ts` | How should the Glossary settle each change? One at a time:<br>• change the Glossary<br>• add new words, through `glossary-author` and its gates<br>• I don't know yet | 4 |
| 4 | `things-author`, then `data-model-author`, each in a change | 3, the batch settled | the changed Glossary | none | • the things file and the data model files, for the changed terms only<br>• the decision register, for a decision that changes | `check-data-model.ts` | their own gates, for what changed | end |

## How it runs

1. **Find the mode and the starting step.** Say the mode in one sentence, first. Take the first of these that fits:
   - a change's path names step 1 or step 2 → a change: follow "In a change", below
   - no things file → new build: start at step 1. A start again from `requirements-workflow`, step 1, is always a new build, as the project starts again from nothing.
   - the things file, not yet accepted → picking up: start at step 1
   - a product-wide decision answered "I don't know yet", or a Glossary change raised from the things file and marked "Left open on {date}" → picking up: start at step 1, for that entry. `things-author` asks it again first. It asks the product-wide decisions, and their Glossary changes.
   - a decision of one family's own, answered "I don't know yet", or a Glossary change raised from that family's file and marked "Left open on {date}" → picking up: start at step 2, for that family only. `data-model-author` asks it again first.
   - a product-wide decision now settled, while a family's file still shows its "? (DM-{n})" → picking up: start at step 2, for that family only. `data-model-author` writes the answer into those cells, in a change.
   - a family the things file names, with no accepted file → picking up: start at step 2, with the first such family
   - a Glossary change marked "To raise" or "Raised" → picking up: start at step 3
   - a Glossary change marked "Settled in the Glossary on {date}", and not yet "Brought into the data model on {date}" → picking up: start at step 4
   - none of these → nothing to do: say so, and print the last line

   A run asks each entry still open once. Once those are asked, find the next row that fits, leaving out the entries this run has asked, and go on from it. An entry answered "I don't know yet" again stays open, and waits for the next run. It holds up no other step. `node tools/status.ts --project {project}` names, under "Next:", the skill that asks each one.

   When the specifier names a step and the items it covers, start at that step, for those items only, such as "data-model-author, lending.md only". The skill at that step checks its own inputs, and stops if one is missing or not accepted.

   **In a change:** run only the steps the change's path names, for the things and files it names. Give each skill the change's number. The skill then works in its "In a change" mode.

   **What is still open:** at every step, things-author and data-model-author first ask again each decision answered "I don't know yet", and each Glossary change left open, that they own. `data-model-design.md`, section 3, "What is still open is asked again first", says how. `node tools/status.ts --project {project}` lists each one.
2. **Step 1:** call `things-author`, and wait for its gate to end. The product-wide decisions are settled at its gate, once, before any family's file is written. Accepted: go on to step 2.
3. **Step 2:** for each family section of the accepted things file, in order, call `data-model-author` with that family. In each file, the actions come before the fields. The whole file is written, its moves included, before its one gate. Gate 2 asks the file's decisions first, then whether to accept it. Then go on to the next family. Every Glossary change a skill finds waits, marked "To raise", until step 3.
4. **Step 3, only once every data model file is accepted:** collect every Glossary change marked "To raise" in the decision register, from every family. Mark each one "Raised". Then call `glossary-disposition` once, with the whole batch, as `data-model-design.md`, step 8, says. Its gate asks each change on its own, and offers only the answers that fit it:
   - change the Glossary: rename, redefine, split, merge or withdraw
   - add new words: `glossary-disposition` sends every new word of the batch to `glossary-author` together, in one run
   - "I don't know yet"

   A Glossary change is not a requirement change, so `change-request-workflow` is not used. As the batch settles each change, mark it:
   - settled in the Glossary: "Settled in the Glossary on {date}"
   - "I don't know yet", or a new word `glossary-author` left open: "Left open on {date}". `glossary-author` leaves a word open when the sources don't name it, or when its gate is answered "I don't know yet". The change stays open in the decision register, and never goes into the Question log.

   When no Glossary change is marked "To raise", step 3 has nothing to do. Go on to step 4 when a change is settled in the Glossary but not yet brought into the data model. Otherwise the run ends.
5. **Step 4:** call `things-author`, then `data-model-author`, each in a change, so every data model file uses the Glossary's new words. Tell each skill that it works in a change, and name the Glossary changes settled at step 3:
   - `things-author` changes only the rows for those terms
   - `data-model-author` changes only the data model files that use them

   Once every file they changed is accepted again, mark each of those changes "Settled in the Glossary on {date}. Brought into the data model on {date}". Until then, `status.ts` shows step 4 as still to do.
6. **Each mark this workflow writes** goes in the decision register. Then run the quick check on it, `node tools/check-simple-writing.ts --project {project} --file {the decision register}`, and fix what it lists to fix.
7. **Add nothing between the steps.** Each skill holds its own check and its own gate.
8. **At the end,** print exactly: **Next: run features-and-epics-workflow.** In a change, print the next row of the change's path instead.

## How it goes back

Each gap the data model finds goes where its kind sends it, as `data-model-design.md`, "Where each gap goes", says. The data model never sends anything back to the BRD or the PRD. The examples are from a City library.

| What the data model finds | For example | Where it goes |
|---|---|---|
| a rule the sources leave open | no length for a book's title | a data model decision, DM-1 onward. It is asked at the gate of the file it belongs to. It stays in the decision register, never in the Question log. |
| a word the Glossary doesn't settle | Shelf status belongs to no thing | a Glossary change, GC-1 onward. Step 3 sends every one to the Glossary together, and step 4 brings the answers into the files. |
| two requirements that disagree | one says 3 loans at a time, and another says 5 | a data model decision, DM-1 onward. Its options are the answers the requirements give, and the specifier picks one at the gate. The requirements stay as they are. |
| an answer at a gate that adds an action big enough to be a feature | members reserve a book that is on loan | the action is written only when the Glossary names it. Otherwise the decision is asked again. |
| an action big enough to be a feature, which the Glossary names, but no requirement does | the Glossary names reserving a book | an action in the file. feature-author decides, at the Feature catalog's gate, whether it needs a feature or a new requirement. |
| a question the PRD left open | how many times a loan can be extended | the question's recommended answer, marked "Proposed (needs confirmation)" with its number. A late answer comes in as a change. When it confirms the answer in use, `insert-answer.ts` takes the mark away. When it differs, the change's path runs `data-model-author`. |

Later steps come back to the data model only through a change, such as a late answer to a question. An FRD never sends a change back. It may differ from the data model, in a data model rule or in a Data cell, when a decision at its own gate says so. Its note "Updated from the data model on the basis of Decision {n}" then names that decision. The data model file is never changed for it.
