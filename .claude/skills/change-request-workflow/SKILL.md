---
name: change-request-workflow
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Skill
description: >-
  The first of the two change workflows: takes one or several requests, from
  your words to your one yes. It writes your requests down, then
  change-request-disposition says what type of change each one is,
  change-impact-author finds what it touches and how big it is, feature-impact
  says what changes in each thing it touches, and you say yes once. Then
  change-orchestration-workflow starts by itself. Use whenever a request comes
  after documents exist: "change request: a loan can be extended twice, not
  once", "new request: members can reserve a book", a mistake found in an
  accepted document, or a late answer, such as "question 7 is answered". Not
  for making the updates (change-orchestration-workflow does that).
---

# change-request-workflow

> **What this is:** The workflow that takes one or several requests, from your words to your one yes. Before your yes, no document changes.
>
> **What it is not:** The updates. After your yes, `change-orchestration-workflow` starts by itself and makes them.
>
> **Who uses it:** A specifier, whenever a request comes after documents exist: from the client, from you, from a step that found a mistake in an accepted document, or as a late answer to an open question.

This workflow follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`. Each skill loads what it needs.

## How you call it

| You say | It means | Example |
|---|---|---|
| change request: {your words} | something that exists must change | change request: a loan can be extended twice, not once |
| new request: {your words} | something new is asked for | new request: members can reserve a book that is on loan |

- Use your own words. You never need the Glossary's words.
- Several requests can come together. List them one after the other. They are worked out together, you say yes once, and they close together.
- The name you use is a hint. Step 2 still works out the type itself. When it differs, your yes shows both. For example: "You called this a new request. The library already allows it, so it is already covered."
- A late answer reads: `question {n} is answered: {the answer}`.
- Bring any files that back the request up: a new version of a client's file, or a document from outside, such as stories from a tracker.

## One run

- **Covers:** one request, or several brought together.
- **Starts when:** you call it.
- **Ends with:** your yes, or your correction, or "I don't know yet".
- **Next:** after your yes, `change-orchestration-workflow` starts by itself.

## The steps

| Step | Done by | Reads | Writes | Next step |
|---|---|---|---|---|
| 1. Change request | the workflow | your words and your files | sections 1 to 4 of a new Change impact report | 2 |
| 2. Disposition | `change-request-disposition`, then `adversarial-check` inside it | • the report, sections 1 to 4<br>• the Glossary<br>• the FRDs | sections 5 and 7 to 11 | • blocked: 5, where its question comes first<br>• otherwise: 3 |
| 3. Impact | `change-impact-author` | • the report<br>• the PRD, the features, the EPICs, the FRDs<br>• the things file and the data model files<br>• the Traceability map | • section 6: where it lands<br>• section 12, by `find-linked.cjs`: everything linked to it<br>• section 14, by `size-rules.cjs`: how big, as a hint | 4 |
| 4. Affect | `feature-impact`, once for each thing in section 12 | the report, and that thing | section 13: no change, update, new story or split, with the exact edits | 5 |
| 5. Acknowledge | the workflow: `recommend.cjs`, `check-change-report.cjs`, then your one yes | the report | • section 15: the updates, in order, from the step each one enters at<br>• section 16: your decision | • yes: `change-orchestration-workflow`<br>• a correction: back to 2<br>• I don't know yet: end |

Each step does one job. When a run stops, the report shows the last section written, so you can see where it stopped.

## How it runs

1. **Change request.** Take the next change number, from 001, and a short name. Run `node tools/scaffold-project.cjs --project {project} --change {nnn}-{short-name}`. Create `impact-report.md` in that folder from `../_shared/templates/change-impact-report.md`, with `Status: drafted`, and write:
   - section 1: each request, word for word, numbered, with the name you called it by
   - section 2: every file you brought, and what it is
   - **a new version of a client's file:** run `node tools/compare-versions.cjs --project {project} --change {nnn} --new {file} --old {file}`. It writes section 3. Each changed requirement in section 3 says the kind the PRD gives it, so step 2 sees a line that moves between scope and requirement.
   - **a document from outside:** run `glossary-check` on it, and save its findings as `changes/{change}/check-findings.md`. When they hold a word that doesn't match the Glossary, run `glossary-disposition` for each one. Write how each word was settled in section 4.
   - a section that doesn't apply says why, in one line
2. **Disposition.** Call `change-request-disposition` with the project and the change.
3. **Impact.** Call `change-impact-author` with the project and the change.
4. **Affect.** Call `feature-impact` once for each thing in section 12, several at once when there are many. Write each answer into section 13.
5. **Acknowledge.**
   - Run `node tools/recommend.cjs --project {project} --change {nnn}`. It writes section 15: each update, the step it enters at, and the steps it skips.
   - Run `node tools/check-change-report.cjs --project {project} --change {nnn}`. While it finds anything, fix the section's writer's part and run it again. Never show you anything while a check fails.
   - Show the check's and `grade-questions.cjs`'s "For the person" blocks.
   - When the change is blocked, its question comes first. Once it is answered, go back to step 2.
   - Then ask **Make these updates?** The answers are the choices in section 15, then "Correct the analysis", then "I don't know yet". The size is shown as a hint for priority. It pauses nothing.
   - Write your answer as the next decision in section 16.
   - On yes, run `node tools/accept.cjs --project {project} --document change-impact-report --change {nnn}`. It saves the report and writes the change's to-do list. Then start `change-orchestration-workflow` with the project and the change.

## Rules

- Before your yes, no document changes, except the report and the Question log.
- Your yes covers every update in section 15. No update asks "accept?" again.
- The data model never raises a request. Two requirements that disagree are a data model decision.
- A decision at an FRD's gate that changes a data model answer stays in the FRD, with its note. It raises no request.

