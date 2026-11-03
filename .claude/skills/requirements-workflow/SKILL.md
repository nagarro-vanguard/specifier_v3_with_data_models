---
name: requirements-workflow
allowed-tools: Read, Glob, Grep, Bash, Skill
description: >-
  The first workflow: takes one product from its requirement files to an accepted
  PRD by running discovery-author, then brd-author, then prd-author, in order,
  stopping at each skill's own gate. Use when a project's requirement files are in
  Output/{project}/sources/, for example "run the requirements workflow for
  expense-claims". It picks up at the first step whose document isn't accepted
  yet, or starts at a named step, such as "from prd-author". Also the way to
  start the project again from nothing, after a change so large that most of the
  work would change, but only when the specifier asks for it in words, such as
  "start the project again from nothing", and says yes to what will move.
---

# requirements-workflow

> **What this is:** The workflow that connects the three skills that read the requirement files: discovery-author, brd-author and prd-author. It runs them in order for one product, and stops at each one's gate.
>
> **What it is not:** A skill. It writes nothing, checks nothing and decides nothing itself: each skill holds its own check and its own gate, and each can be run on its own.
>
> **Who uses it:** A specifier, at the start of a project, and to pick up where the project stopped. A specifier who asks to start the project again from nothing, after a change so large that most of the work would change. A change's path, from step 2 or step 3.

This workflow follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`. Each skill it calls loads what it needs.

## One run

- **Covers:** the whole product.
- **Starts when:**
  - the specifier puts the requirement files in `Output/{project}/sources/`
  - the specifier asks, in words, to start the project again from nothing, after a change so large that most of the work would change. "Starting again from nothing", below, says how.
  - a change's path names step 2 or step 3, in section 15 of its Change impact report
- **Ends with:** an accepted PRD.
- **Next:** `glossary-author`. In a change, the next row of the change's path.

## The steps

| Step | Done by | Previous step | Reads | Looks up by ID | Writes | Check before the gate | Gate | Next step |
|---|---|---|---|---|---|---|---|---|
| 1 | `discovery-author`, which runs `list-sources.cjs` first | start: the specifier brings the sources | Sources | none | • Discovery brief<br>• Question log | `check-discovery-brief.cjs` | Accept the Discovery brief? | 2 |
| 2 | `brd-author` | 1 | • Sources<br>• Discovery brief | none | • BRD<br>• Question log | `check-brd.cjs` | Accept the BRD? | 3 |
| 3 | `prd-author` | 2 | • Sources<br>• Discovery brief<br>• BRD | none | • PRD<br>• Question log | `check-prd.cjs` | Accept the PRD? | run `glossary-author` |

## How it runs

1. Run `node tools/scaffold-project.cjs --project {project}`.
2. Find the starting step. Say it in one sentence, first.
   - **Picking up is the normal mode.** Start at the first step whose document isn't accepted yet, as `data-model-workflow` does. On a new project, that is step 1. When all three documents are accepted, there is nothing to do: say so, and print the last line of step 5.
   - **A named step:** when the specifier names a step, such as "from prd-author", start at that step. The skill at that step checks its own inputs, and stops if one is missing or not accepted. Step 1, named once the Discovery brief exists, starts the project again from nothing. So it follows "Starting again from nothing", below, and waits for its yes.
   - **In a change:** run only the steps the change's path names, for the items it names. Give each skill the change's number. The skill then works in its "In a change" mode, and changes only what the recommendation names.
   - **Starting again from nothing:** only when the specifier asks for it in words, such as "start the project again from nothing". Follow "Starting again from nothing", below. A plain "run the requirements workflow" never starts again from nothing: it picks up.
3. Call the step's skill with the project's name, and wait for its gate to end:
   - **Accepted:** go on to the next step.
   - **Anything else,** such as "one more round": the skill handles it inside its own gate. The workflow waits.
4. Add nothing between the steps. Each skill runs probing-questions-author and `grade-questions.cjs` inside itself, before its check and its gate, so the workflow has no steps of its own.
5. After step 3 is accepted, print exactly: **Next: run glossary-author.** In a change, print the next row of the change's path instead.

## How it goes back

- **A mistake in a document already accepted.** A later step pauses, and the specifier raises the mistake as a change, through `change-request-workflow`. The change's path runs step 2 or step 3 again, for what it names.
- **A PRD row that disagrees with the BRD,** such as a Scope row outside the BRD's scope: prd-author raises a question. Then the BRD can be updated through a change.

## Starting again from nothing

When a change is so large that most of the work would change, the specifier can start the project again from nothing. It takes the place of a change (`conventions.md`, "Ask, don't assume"). It happens only when the specifier asks for it in words, such as "start the project again from nothing". Then, before step 1:

1. **Show what will move.** List every file and folder in `Output/{project}/` except `sources/`, one per line. Say where they move to: `_archive/Output-{date}/{project}/`, at the top of the kit, beside `Output/`. {date} is today, as YYYY-MM-DD. Say that `sources/` stays where it is, with the requirement files. If `_archive/Output-{date}/{project}/` already exists, say so, and stop.
2. **Ask for a yes,** as multiple choice, with the client's control for picking one answer, as `decision-review-gates.md`, rule 4, says:
   - **Move them, and start again from nothing.** Why you'd pick it: most of the work would change. What happens next: every file and folder listed moves, and step 1 runs fresh.
   - **Keep the project as it is.** Why you'd pick it: the work is worth keeping. What happens next: nothing moves. The workflow picks up where the project stopped, or you raise the change through `change-request-workflow`.
   - **I don't know yet.** What happens next: nothing moves, and nothing runs.

   Recommend the first, because the specifier asked for it. Any answer but the first moves nothing.
3. **Move them, by hand.** No program does this move yet, so the workflow does it, by these words. Move every file and folder listed to `_archive/Output-{date}/{project}/`, each one to the same place under that folder. Delete nothing. Then check that `Output/{project}/` holds only `sources/`, and show what moved. The archive is outside the project's layout, so `scaffold-project.cjs` still passes.
4. **Start fresh.** Go on with step 1 of "How it runs", as for a new project:
   - Every step runs fresh, from the Discovery brief on. The Discovery brief runs once for each start of a project, and never in a change.
   - It doesn't ask each earlier question again. Each step raises its questions fresh, from the requirement files.
   - No step reads the archive.
