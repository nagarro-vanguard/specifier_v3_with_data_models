---
name: probing-questions-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Drafts the question behind every gap in a specifier document, and rates each
  question's impact and severity, writing it into the project's Question log.
  Runs inside every author skill except the data model's two skills, after the
  skill drafts and before its check program, never as a workflow step of its own. Run it on its
  own with a project and a document to raise the questions for that document alone,
  for example "raise the questions for the expense-claims BRD". It never asks the
  questions or decides them: they are asked at the calling skill's gate. Not for
  the data model's files, which things-author and data-model-author write: their
  decisions stay in the data model's own decisions file, never in the Question log.
---

# probing-questions-author

> **What this is:** The skill that turns every gap in a document into a question for the specifier: what is missing, why it matters, what each answer would change, and how much harm and rework a wrong answer would cause.
>
> **What it is not:** The gate where the questions are asked, which belongs to the skill that wrote the document. It doesn't set the order the questions are asked in: `grade-questions.cjs` does. It doesn't hold the answers: the Decision record does.
>
> **Who uses it:** Every author skill, after it drafts, except the data model's two skills, things-author and data-model-author. They don't use it, on purpose: their decisions stay in the data model's own decisions file, never in the Question log (`../_shared/data-model-design.md`, "Where each gap goes"). A specifier, on its own, for one document.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`, and writes in the shape of `../_shared/templates/question-log.md`. Its question bank is `references/probe-dimensions.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## What it reads and writes

- **Reads:**
  - the document the calling skill just drafted, and every gap in it
  - the Question log, `Output/{project}/{product}-question-log.md`, so a question is never asked twice
  - the requirement files the document cites, to say what each file says and leaves open
  - `references/probe-dimensions.md`
- **Writes:** new questions, and changes to open ones, in the Question log. `grade-questions.cjs` then places each in its group and sets the order.
- **Its gate:** none. Its questions are asked at the calling skill's gate.

## Steps

### 1. Load

If the document is one of the data model's files, stop, and say so. The data model's decisions stay in its own decisions file, never in the Question log. The data model's files are the things file, each data model file and the decisions file, all in `glossary/data-models/`. things-author and data-model-author open each decision in the decisions file themselves.

Otherwise, read the document, and find the Question log through `tools/lib/run-paths.cjs`. When the project has no Question log yet, write one from `templates/question-log.md`: fill in its opening, keep sections 1 to 4 exactly as the template has them, and leave every group "None yet".

### 2. Find the gaps

Restate what the document holds, without inventing anything:
- **Known:** stated in a file, with its source.
- **Assumed:** implied but not confirmed. An assumption is never promoted to fact. It gets a question.

Then find every gap:
- every gap label in the document that names no question: TBD, Proposed (needs confirmation), [Not specified in provided sources] and [Needs source excerpt] (`conventions.md`, "Unknowns")
- in a Discovery brief, every Silent topic, every clash the order of authority can't settle, and every assumption
- in a PRD, every Requirement row whose simple words fail Q4. A part has two meanings, or can't be checked yes or no.
- every area of `references/probe-dimensions.md` that fits the document, walked for what is missing

Keep only a gap whose answer is missing and material: one that would change the design or the scope. A gap the files already settle is not a question, and neither is a field a program fills in, such as the date a check program writes.

### 3. One question for each decision, asked once

- Each question is one decision, worded so its answers are the real choices, ending in a question mark.
- Before drafting, look in the Question log for a question about the same decision, open or answered. If there is one, the gap names that question, and no new question is drafted.
- A new question takes the log's next number. A number is never reused, and a question keeps its number for life.

### 4. Draft every part

Write each question as a block in the template's shape, with every part filled. The template's Placeholders table says what each part holds, with an example:
- **Raised in:** a link to the document, and the place in it
- **Why I'm asking:** one or two plain sentences on what the files say and what they leave open, citing each file, or saying that no file speaks to it
- **For example:** a real case, with a person and an amount where that helps
- **What it changes:** the parts of the product that depend on the answer
- **Impact** and **Severity:** step 5
- **Answers:** at least two real choices. No answer starts with "Yes" or "No". Each says why the specifier would pick it, and what happens next. Then **I don't know yet**, with what happens next: the recommended answer is used, marked Proposed, and who is asked by which step.
- **Recommended:** the answer the skill recommends, and why, in one sentence
- **Answer in use for now:** the recommended answer, marked Proposed (needs confirmation), or TBD when no answer can be used
- **Who can answer:** the specifier, or someone named whom the specifier asks
- **Answer by:** the step by which it must be answered
- **Next best action:** what the specifier should do now

When two readings of the same source text are possible, the answers are the two readings.

### 5. Rate it

Rate each question from the tables in sections 1 and 2 of the Question log template, each level with its reason in one sentence:
- **Severity:** how much harm is done if work goes ahead on a wrong answer. Anything touching the law, a policy, a contract, money, personal data, or whether people can do their job is High.
- **Impact:** how much is redone if the answer turns out to be wrong.

Put the question in the group the grid in section 3 gives it. `grade-questions.cjs` moves any question that sits in the wrong group, and sets the order.

### 6. Name the question at the gap

Every gap names its question in the same place, such as "TBD, question 12" or "Euros only, Proposed (needs confirmation), question 4" (`conventions.md`, "Unknowns"):
- **Inside a calling skill:** hand the skill each gap's place and its question's number. The calling skill writes them in.
- **On its own:** write the numbers in yourself when the document is drafted, changing nothing else. A document already accepted changes only through a change (`conventions.md`, "A mistake found later"), so list each gap and its question for the specifier instead.

### 7. On a re-run of the whole workflow

A run of the whole workflow from step 1 starts the project again from nothing (`../requirements-workflow/SKILL.md`, "Starting again from nothing"). It happens only when the specifier asks for it in words, and says yes to what will move. Every file and folder in `Output/{project}/` except `sources/` moves to `_archive/Output-{date}/{project}/`, the Question log too. No program does this move yet: the workflow does it by hand. So raise every question fresh, as for a new project. Never ask an earlier question again.

### 8. Check

Run `node tools/grade-questions.cjs --project {project}`. Inside a calling skill, the calling skill runs it straight after this skill. It checks that every part is filled in, both ratings have a reason, the answers are real choices plus "I don't know yet", and every gap names a question in the log. Fix every finding in the questions this skill wrote, and run it again until it reports none.

Then run the quick check on the Question log, as `../_shared/simple-writing-rules.md` says: `node tools/check-simple-writing.cjs --project {project} --file Output/{project}/{product}-question-log.md`. Fix what it lists to fix in the questions this skill wrote, and run it again. It prints one line, such as "Simple writing, city-library-question-log.md: 0 to fix, 3 to look at." Inside a calling skill, hand that line to the calling skill, for its gate. On its own, show it.

## Quality

Each question must pass, from `../_shared/quality-characteristics.md`:
- Q1, one decision per question
- Q4, one reading
- Q7, business language
- Q9, every fact in "Why I'm asking" cited
- Q10, readable on the first pass

## What it never does

- It never asks a question itself, or records an answer: the calling skill's gate does both, as `decision-review-gates.md`, rules 3 to 5, says.
- It never invents a value to close a gap (`conventions.md`, "Nothing invented"). A surfaced gap is a success, not a failure.
- It never asks a question whose answers are "yes" and "no".
