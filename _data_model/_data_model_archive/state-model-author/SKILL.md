---
name: state-model-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the state models, BABOK's State Modelling: for each entity the data model
  says moves through states, its states and what can be done in each, every move
  with its event, condition and actions, and where it starts and ends. Runs only
  when the accepted data model confirms state-model-workflow runs. One gate,
  "Accept the state models?". Use as step 1 of state-model-workflow, or
  on its own, for example "write the state models for expense-claims". Not for the
  names of the states (the Glossary) or their allowed values (use
  data-dictionary-author).
---

# state-model-author

> **What this is:** The skill that works out, for each thing that moves through states, how it moves: what starts it, what moves it on, what can happen in each state, and how it ends.
>
> **What it is not:** The Glossary, which names the states, or the order of the product's stages, which is the Glossary's flow.
>
> **Who uses it:** `state-model-workflow`, at step 1. A specifier, on its own, with the project's name.

- You **draft**; the specifier **decides** every question it raises, and whether to accept it.
- If the accepted data model says `state-model-workflow` does not run, say so, with its reason, and stop. Write nothing.

## Words used in this skill

| Word | What it means | Example |
|---|---|---|
| State | a condition the entity is in, from the Glossary's value-set | Approved |
| Move | a change from one state to another | Submitted to Approved |
| Event | what causes a move | the line manager approves it |
| Condition | what decides whether the move happens | the amount is within the limit |
| Actions | what happens along with the move | the claimant is told |
| Starts in, ends in | the state it begins in, and the one it ends in, if it ends | Submitted; Paid |

## Invoke it with

| You give | Example |
|---|---|
| the **project** | `expense-claims` |

- It reads the accepted data model and Data Dictionary, and looks up the Glossary, its `deep-dives/` and the PRD by ID.
- If either isn't accepted, say so and stop.

## Load first

- `../_shared/data-information.md`: the rules. **Enforce them; don't restate them.**
- `../_shared/templates/state-models.md`: the document's layout.
- `../_shared/decision-review-gates.md`: how you speak at the gate.

## Step 1: Draft

1. Create `data/state-models.md` from the template, with `Status: drafted`.
2. List every entity whose attribute the data model's "The workflows that follow" names as a state, with that attribute.
3. For each one:
   - **States:** every value of its Glossary value-set, word for word, and any state the Glossary's section drafts found for it in `deep-dives/`. What can be done in each state comes from the requirements.
   - **Moves:** from the requirements' own words, such as "once approved", "can be reopened", and from the Glossary's flow links (`locks`, `unlocks`) that name the entity's states. Each move has an event; a condition and actions where the sources give them.
   - **Starts in, ends in, can go back or skip:** from the sources; otherwise questions.
   - A state no move reaches, or none leaves, is a gap: a question, never an invented move.
4. Draw each diagram from its tables, adding nothing.

## Step 2: Questions and the check

- Run probing-questions-author on the state models, then `node tools/grade-questions.cjs --project {project}`.
- Run `node tools/check-data-information.cjs --project {project} --document state-models`. Fix every finding, and run it again.

## Step 3: The gate and acceptance

Hold the gate as `../_shared/decision-review-gates.md` says, with **Accept the state models?**. After **Accept**, run `node tools/accept.cjs --project {project} --document state-models`, paste the "For the file" block into the Check record, and close with `status.cjs`.

## Output

- The file `data/state-models.md`, holding the state models only.
