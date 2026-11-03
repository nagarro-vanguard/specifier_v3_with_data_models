---
name: feature-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Turns the PRD's requirements into the Feature catalog: features in the Glossary's
  agreed words, each with a description, a "Done when" cut into numbered pieces,
  the requirements it covers, a MoSCoW priority with its basis, what it depends on,
  and the FRD it belongs to, checked so every requirement lands in a feature. One
  gate, "Accept the Feature catalog?". Use once the data model is accepted, for
  example "define the features for expense-claims". Not for grouping features into
  EPICs (use epic-grouping-author) or writing the PRD (use prd-author).
---

# feature-author

> **What this is:** The skill that turns the requirements into features: something a user can recognise and use, each traced to the requirements it covers and to the FRD that will hold its rules.
>
> **What it is not:** The grouping into EPICs, which is epic-grouping-author's, or the detailed rules, which frd-author writes.
>
> **Who uses it:** `features-and-epics-workflow`, as its first step. A specifier, on its own, with the project's name.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md`, `../_shared/atomic-rules.md` and `../_shared/decision-review-gates.md`. It writes from `../_shared/templates/feature-catalog.md`. Its rules, field contract and checklist are in `references/feature-catalog.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## What a feature is

A **unit of capability** that holds together and means something to a user. A stakeholder would name it and value it on its own, such as "Manager approval" or "Receipts". A set of related requirements makes it real. It is not a single requirement, because that is too small. It is not a whole EPIC, because that is too broad. If a feature needs an "and" to describe it, it is probably two.

## What it reads and writes

- **Reads:** the accepted PRD, and the accepted data model files the things file names.
- **Looks up:** the Glossary, for the agreed words, and the BRD, by its IDs.
- **Writes:**
  - `frd/feature-catalog.md`
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.ts`
- **Its gate:** "Accept the Feature catalog?"
- **Its check:** `check-features.ts`

## Steps

### 1. Set up

Run `node tools/scaffold-project.ts --project {project}`. If the PRD isn't accepted, there is no Glossary, or a data model file the things file names isn't accepted, say so and stop.

### 2. Derive and name

Group related requirements into features, **one capability each**. Split anything bundled, as Q1 says. `../_shared/atomic-rules.md` says when to split a feature's name and description, and when to keep them together. Give each feature a business name, a **Description** and a **Done when**. The Description says what the feature is. The Done when is the signal anyone can see once the feature is realized. The two must not restate each other. The ⊆ test in `references/feature-catalog.md`, section 1, checks this. Every word is the Glossary's agreed word: where the PRD keeps the client's own word, use the agreed one.

### 3. Prioritize and link

For each feature:
- a MoSCoW priority **and** a basis from the fixed list in the template, or Proposed (needs confirmation) with its question
- the requirement IDs it covers, from the PRD only
- each feature it depends on, proven from the sources
- its capability: the FRD it goes in, FRD-, the PRD section number and a letter, then the capability's name, such as "FRD-3a Claim approval". Start with one capability for each PRD section, and split one only as FR-7 in `references/feature-catalog.md` says.

### 4. Cut each "Done when" into pieces

Cut each feature's Done when into separate conditions, F-01.dw1 onward, using only its own words, in its own order. Read together in order, a feature's pieces give back its Done when. Every piece must later be proved by at least one rule in the feature's FRD.

Write each feature's pieces under their own heading. The heading is the feature's ID, then its name, exactly as section 2 has them. So a reader sees a feature and its pieces together.

### 5. Check coverage

Every Requirement row in the PRD lands in at least one feature. A row of any other kind gets no feature. A Requirement row nothing covers is a Gap, and names its question.

### 6. Check every action and move has a feature

List every row of every Actions table and every Moves table in the data model files. Write them in section 5 of the catalog, in the files' order. Write a move as its From, then →, then its To. Give each row to the one feature whose requirements or Done when name it. For a row no feature names, ask two questions:
1. **Does the PRD say it?** It does when one of its requirements names the action or the move.
2. **Is it big enough to be a feature?** Answer it with the test in `../_shared/data-model-design.md`, section 2, "Is it big enough to be a feature?". The data model uses the same test, so the two steps always agree.

| PRD says it? | Big enough? | Recommend |
|---|---|---|
| yes | no | Add a piece to the Done when of the feature that owns the thing's first action |
| yes | yes | A new feature |
| no | no | Give it to the feature that owns the thing's first action. Its FRD proves it from the data model, with no new piece. |
| no | yes | A new requirement first, through `change-request-workflow`, then a new feature. Until that change is done, the row waits on it. |

**A row that no feature names.** Until the gate settles it, its Feature cell shows "?". List the row under "To settle at the gate", in section 5, with its two answers and the recommendation they give. Write the recommendation as the template says, with the feature that owns the thing's first action, such as "Give it to F-03". The data model shows an open decision the same way. It writes a "?" in the cell, and lists the recommended answer for the gate. The catalog can't be accepted while a row shows "?".

**A row that waits on a change.** At the gate, the specifier may pick "a new requirement first" for a row. Then only step 1 of `change-request-workflow` runs at the gate. It writes the change's statement, and gives the change its number. The row's Feature cell then reads "waits on change" and that number, such as "waits on change 004". The change's analysis and its own gate come after the catalog's gate. The change must be in the project's `changes/` folder. A waiting row is not a finding, and it doesn't count as having a feature. So the catalog can be accepted while the row waits, and the gate shows the row. When the change is done, its path runs feature-author, and the row gets its feature. A row that still waits once its change is closed is a finding.

### 7. Run the checklist

Work through `references/feature-catalog.md`, section 3, and fix anything that fails.

### 8. Raise the questions

Run probing-questions-author on the catalog, write each question's number at its gap, then run `node tools/grade-questions.ts --project {project}`.

### 9. Check

Run `node tools/check-features.ts --project {project}`. Fix every finding and run it again, until every check passes.

### 10. The gate

Hold the gate exactly as `decision-review-gates.md` says, with probing-questions-author asking each decision in its Ask mode. The order:
- first, the two "For the person" blocks: the check program's, then `grade-questions.ts`'s. The check program's block lists each row that shows "?", with its recommendation. It also lists each row that waits on a change, with the change's number.
- then the questions the catalog raised or builds on, one at a time, in the order `grade-questions.ts` sets, and the Can move ahead list
- then the decisions about capabilities and pieces, where a feature could reasonably go in another FRD, or its Done when could be cut another way
- then each row that shows "?", with the recommendation step 6 gave it, one at a time. Write the answer in the row's Feature cell, and take the row out of "To settle at the gate". For "I don't know yet", the recommendation is used, as `decision-review-gates.md`, rule 9, says. The row gets the recommended answer, and its Decision record entry marks it Proposed. A later change can still move it.
- when the specifier picks "a new requirement first" for a row, run only step 1 of `change-request-workflow`. It writes the change's statement, and gives the change its number. Then write "waits on change" and the change's number in the row's Feature cell. The rest of the change runs after this gate: its analysis, then its own gate.
- when an answer adds a feature or a piece, write it, then run step 9's check again
- then the gate's own question, **Accept the Feature catalog?**

**The catalog's guard.** While a row of section 5 shows "?", the catalog can't be accepted. Ask the gate's own question only once every "?" is settled. Until then, the check program's block says the catalog can't be accepted yet.

Record each answer straight away, in the Decision record and the Question log. When the specifier accepts, run `node tools/accept.ts --project {project} --document feature-catalog`, then close with `status.ts`.

The Feature catalog covers the whole product, so after a third "no" the skill offers only "accept it as it is" and "one more round" (`decision-review-gates.md`, rule 11). It offers "accept it as it is" only when no row shows "?".

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When the recommendation in a Change impact report names the Feature catalog, read the report too, and change only the features and pieces it names. Everything else stays as it is. A feature ID already accepted never changes, and a new feature takes the next free number. A row of section 5 that waits on this change gets its new feature. The feature's ID takes the place of "waits on change" and the change's number. The catalog then goes through its check and its gate again, and acceptance saves a new version.

## Rules

Each row must satisfy the quality characteristics and the rules in `references/feature-catalog.md`. The most important ones:
- **One capability per feature,** Q1. Split anything joined by `and` or `/`, or that bundles two verb and object pairs.
- **Description is not the Done when,** Q3 and Q5. The Done when can be observed. It adds a condition the Description lacks.
- **Trace with real tokens,** FR-2. `Covers` uses the PRD's requirement IDs only.
- **Priority with a named basis,** Q8 and FR-3. Each feature has a MoSCoW rank and one basis from the list, or Proposed (needs confirmation).
- **Nothing invented,** Q9 and `conventions.md`, "Nothing invented". Every specific has its source, or is marked TBD.
- **100% coverage,** FR-4. Every Requirement row lands in at least one feature. A dropped requirement is a dropped scope item.
- **Group by source category,** FR-5. Write one sub-table for each PRD section, with the section's heading word for word. The IDs run on across the whole catalog.
- **Every action and move has a feature,** FR-6. Each row of the data model's Actions and Moves tables lands in exactly one feature. Or it waits on a change, until the change adds its feature. Until the gate settles a row, it shows "?", and the catalog can't be accepted.
- **A capability is one FRD,** FR-7. One for each PRD section, unless a section holds two sets of rules that don't depend on each other.
- **Template only.** The saved file holds exactly the template's sections. Narration and prompts stay in the conversation.

## Quality

From `../_shared/quality-characteristics.md`, every feature must pass Q1 to Q10. The word-flag threshold for Q10 is 30 words per Description.

## Handoff

The accepted catalog feeds `epic-grouping-author`, which groups the features into EPICs, and later `frd-author`, which writes one FRD per capability.
