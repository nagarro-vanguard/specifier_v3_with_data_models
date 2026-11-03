---
name: discovery-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes the Discovery brief, always the first step of the Requirements workflow:
  lists every requirement file in the project's sources folder, proposes which kind
  of document wins when two disagree, compares what the files say topic by topic,
  turns every clash, silence and assumption into a question, and records the
  specifier's answers at one gate, "Accept the Discovery brief?". Use when a
  project's requirement files are in place and nothing has been written from them
  yet, for example "start discovery for expense-claims". Not for the BRD (use
  brd-author) or the PRD (use prd-author). A gap found later comes in as a change.
---

# discovery-author

> **What this is:** The skill that takes the first look at a project's requirement files and writes the Discovery brief: which files there are, which kind of file wins when two disagree, what the files say topic by topic, what they only imply, and what could go wrong.
>
> **What it is not:** The requirements. Nothing in the brief is decided until the BRD and the PRD say so. It is run once, at the start: a gap found later comes in as a change, through `change-request-workflow`.
>
> **Who uses it:** `requirements-workflow`, as its first step. A specifier, on its own, with the project's name.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`. It writes from `../_shared/templates/discovery-brief.md`, and `../_shared/examples/discovery-brief.md` shows a finished one. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## What it reads and writes

- **Reads:** every file in `Output/{project}/sources/`.
- **Writes:**
  - `{product}-discovery-brief.md`
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
- **Its gate:** "Accept the Discovery brief?"
- **Its check:** `check-discovery-brief.cjs`

## Steps

### 1. Set up

Run `node tools/scaffold-project.cjs --project {project}`. If `sources/` is empty or missing, say so and stop: the files go in `sources/` first.

### 2. List every file

Run `node tools/list-sources.cjs --project {project}`. It prints two blocks:
- **"For the brief":** paste it into section 1 as it is. Every file, its folder and the "same as" and "older version" marks come from it, so no file is missed or counted twice. Then read each file and fill the columns only a reader can fill: kind of document, version or date, owner and standing, each as the file itself states it, or [Not specified in provided sources].
- **"For discovery-author":** each set of files whose names differ only by a date. Read each set. If one replaces another, mark the earlier one "No: older version of" the later one. If they are a series, such as notes from different meetings, use them all.

A file that looks out of scope, such as a policy for something the product doesn't do, is proposed as out of scope at the gate, never dropped on its own. Until the specifier decides, it reads "No: out of scope, to be decided at the gate". Once the decision is recorded, it names it, such as "No: out of scope, Decision 6", or becomes "Yes" if the specifier keeps it.

Fill the "At a glance" counts from the tables.

### 3. Propose the order of authority

List every kind of document marked Used, and rank them in section 2, the most authoritative first, each with why it has that rank. A policy approved by the business usually outranks a requirements document, which outranks notes of what people said. The specifier confirms or changes the order at the gate.

### 4. Compare every topic

Read the used files folder by folder, and build section 3 as you go, so hundreds of files are handled in parts:
- Take the topics from two places: the files' own section headings, and the nine areas in the template, so a topic no file mentions is still checked.
- Quote each file that speaks to the topic, in its own words, with its place.
- Give each topic its verdict: Agree, One source, Differ or Silent, as the template defines them.

Restate without inventing anything. Each point is either:
- **Known:** stated in a file, with its source
- **Assumed:** implied but not confirmed. An assumption is never promoted to fact: it goes in section 5, with why we think so.

### 5. Settle each clash

Every topic marked Differ becomes a row in section 4, with its kind of clash. Where the order of authority settles it, the file of the highest kind wins: name the rank, and write what that file says, in simple words, into "What now holds". The quotes in "What each file says" stay exactly as each file writes them: they are the notes on what each file says. This follows BABOK 10.18, Document Analysis. Where it can't, or where the winning file is plainly out of date, the clash becomes a question, settled by a decision at the gate. When nothing differs, the section says None.

Two files using different words for the same thing is not a clash: the Glossary records both words later.

### 6. Name the risks

List what could go wrong, and each unhappy path the files don't cover, with what it would cost if nobody plans for it.

### 7. Raise the questions

Run probing-questions-author on the brief. It drafts and rates a question for every Silent topic, every clash the order of authority can't settle, and every assumption, and hands back each gap's place and its question's number. Write each number in, such as "Silent, question 2". Then run `node tools/grade-questions.cjs --project {project}`, which places each question in its group and sets the order.

### 8. Check

Run `node tools/check-discovery-brief.cjs --project {project}`. Fix every finding and run it again, until every check passes.

### 9. The gate

Hold the gate exactly as `decision-review-gates.md` says:
- first, the two "For the person" blocks: the check program's, then `grade-questions.cjs`'s
- then the questions this brief raised, one at a time, in the order `grade-questions.cjs` sets, and the Can move ahead list
- then the decisions about the brief itself, each with "Question: None":
  - the order of authority
  - each file proposed as out of scope
- then the gate's own question, **Accept the Discovery brief?**

Record each answer straight away, in the Decision record and the Question log. When the specifier accepts, run `node tools/accept.cjs --project {project} --document discovery-brief`, then close with `status.cjs`.

The Discovery brief covers the whole product, so after a third "no" the skill offers only "accept it as it is" and "one more round" (`decision-review-gates.md`, rule 11).

## Quality

From `../_shared/quality-characteristics.md`, every line of the brief must pass:
- Q4, one reading
- Q7, business language
- Q9, every fact cited to its file

## Handoff

The accepted brief feeds `brd-author`, then `prd-author`. Only the files marked Used are read after this step.
