---
name: change-orchestration-workflow
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Skill
description: >-
  The second of the two change workflows: makes every update after your one
  yes. It reads the change's to-do list, enters each update at the step its
  type of change names, and runs the kit's own workflows from that step, for
  that update only, with no "accept?" questions. It stops only for a question
  only you can answer. When every update is saved, the change closes and you
  get one summary. Starts by itself after your yes in change-request-workflow.
  Use on its own to go on with a change that stopped, for example "go on with
  change 004 for city-library". Not for working out the change (use
  change-request-workflow).
---

# change-orchestration-workflow

> **What this is:** The workflow that makes every update a change needs, after your one yes. It decides which workflow and which step each update needs, and calls it.
>
> **What it is not:** The analysis. `change-request-workflow` works out the type, what it touches and what changes, and gets your yes first.
>
> **Who uses it:** `change-request-workflow`, which starts it by itself after your yes. A specifier, on its own, to go on with a change that stopped.

This workflow follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`.

## One run

- **Covers:** one change, with every request in it.
- **Starts when:** you say yes at step 5 of `change-request-workflow`, or you ask to go on with a change that stopped.
- **Ends with:** the change closed, and one summary of every update.
- **Next:** whatever you were doing before the change. `status.ts` says what is next.

## Where each update enters

The route comes from `recommend.ts`, in section 15 of the report. It starts at the first step with work to do, and skips each step with none. Examples:

| The request | Type | Enters at | Skips |
|---|---|---|---|
| new request: members can reserve a book | Net new | the requirements, or the BRD first when it falls outside the product's scope | nothing |
| change request: a librarian can also extend a loan | Extend or enhance | the requirements | the Glossary and the EPICs, when no word or EPIC changes |
| change request: a loan can be extended twice, not once | Update or optimize | the requirements | the Glossary, the features and the EPICs |
| change request: call it Renew, not Extend | a renamed word | the Glossary | the requirements, which keep the client's words |
| a mistake in a feature's "Done when" | a mistake | the features | the requirements, the Glossary and the data model |
| question 7 is answered: 14 days | a late answer | the places the answer belongs, by `insert-answer.ts` | every workflow |
| REQ-4.2 now reads: "…" | wording only | every place the wording is quoted, by `copy-wording.ts` | every workflow |

## The steps

| Step | Done by | What it does | Next step |
|---|---|---|---|
| 1. The next update | `next-change-step.ts` | reads the to-do list and section 15, and names the next workflow, its step and its items, or says every update is made | • an update: 2<br>• every update made: 4 |
| 2. Make it | the workflow it names, from that step, in change mode | changes only the items named, runs its check, and saves the new version with `accept.ts`, which ticks the row | • saved: 1<br>• it stops for you: 3 |
| 3. A question only you can answer | the workflow | asks it through probing-questions-author, as multiple choice, with the recommended answer first and "I don't know yet" | 2 |
| 4. Close | `close-change.ts`, then `change-summary.ts` | closes the change, and shows one summary | end |

## How it runs

1. Run `node tools/next-change-step.ts --project {project} --change {nnn}`.
2. **An update.** Call the workflow it names, from the step it names, with the change number and the items, in change mode:
   - `requirements-workflow`, from `brd-author` or `prd-author`
   - `glossary-disposition`, for a renamed word, or `glossary-author`, for a new word
   - `data-model-workflow`, from `things-author` or `data-model-author`
   - `features-and-epics-workflow`, from `feature-author` or `epic-grouping-author`
   - `frd-workflow`, for each FRD named
   - `stories-workflow`, from `story-drafter`, `story-groomer` or `ac-author`, for each EPIC named
   - `insert-answer.ts` or `copy-wording.ts`, for a small update

   In change mode, each skill:
   - changes only what the change names. Everything else stays as it is.
   - runs its own check, and fixes what the files settle
   - asks no "accept?". Your yes covered it. On a pass, it runs `accept.ts`, which saves the new version and ticks the row.
   - stops only for one of the reasons below

   Then go back to 1.
3. **It stops, and asks you, only when:**
   - an update needs an answer only you can give, such as a limit the request doesn't give. It is raised in the Question log and asked by probing-questions-author, as multiple choice. It never makes up an answer.
   - a check fails, and the files don't say how to fix it
   - an update finds something the analysis didn't list, such as a second FRD rule about extending. It asks whether to add it to this change or leave it for a new one.

   Once you answer, go back to 1. The run goes on from the same row.
4. **Close.** When every row is ticked, `track-change.ts` runs `close-change.ts`, which writes the closing entry. Then run `node tools/change-summary.ts --project {project} --change {nnn}`, and show its summary: each document, its old and new version, and what changed, in one line each.

## Rules

- Never update anything the to-do list doesn't name, unless you said to add it at step 3.
- Never ask "accept?" for an update. Your yes covered every update.
- Never make up an answer. Ask instead.
- A document still being written, such as a draft FRD, gets the update in its draft. Nothing is paused.
- Each document is updated once for the whole change, even when several requests touch it.

