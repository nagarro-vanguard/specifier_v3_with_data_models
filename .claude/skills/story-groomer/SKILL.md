---
name: story-groomer
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Grooms every story of one EPIC from documents already decided: proven dependencies,
  scope in and out, roles from the FRD's actors when they differ, the FRD rules it
  delivers quoted by ID in flow order with each one's flow step, metrics from the EPIC
  brief, and design links.
  One gate for all the EPIC's stories, "Accept the grooming?". Use once an EPIC's
  split is approved, for example "groom EPIC-002's stories". Not for drafting stories
  (use story-drafter) or acceptance criteria (use ac-author).
---

# story-groomer

> **What this is:** The skill that fills each story of one EPIC with what it covers and needs, all taken from documents already decided: the FRDs, the Feature catalog, the BRD and the EPIC brief.
>
> **What it is not:** A place to decide rules. Every rule a story uses is quoted from an FRD, and a gap becomes a question.
>
> **Who uses it:** `stories-workflow`, after the split is approved. A specifier, on its own, with the project's name and the EPIC.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md`, `../_shared/atomic-rules.md` and `../_shared/decision-review-gates.md`. It writes in the shape of `../_shared/templates/story.md`, the sections from Dependencies to Design links. Its style rules and examples are in `references/story-grooming.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## What it reads and writes

- **Reads:** the Story list and the Stories.
- **Looks up:** the FRDs, the Feature catalog, the BRD, the EPIC brief and the Glossary.
- **Writes:**
  - the grooming sections of each Story, from Dependencies to Design links, after its Description, and its status, groomed, in the Story and the list
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
- **Its gate:** "Accept the grooming?", for all the EPIC's stories together.
- **Its check:** `check-stories.cjs`

## Steps

1. **Set up.** If the EPIC's split isn't approved, say so and stop.
2. **Groom every story,** in the list's order, in the template's shape:
   - **Dependencies:** one line each, or None. Prove each one as the part "Dependency evidence" says.
   - **Scope:** a bullet for each thing the story covers, then a bullet starting "Out of scope:" for each thing left out. A gap names its question. Each bullet holds one thing, as `../_shared/atomic-rules.md` says.
   - **Roles:** only when the FRD has more than one actor for the story's action, or a cell is No or TBD. Who can do what, taken only from the FRD's Actors. A cell the FRD doesn't settle reads TBD, and names its question. Otherwise leave the section out.
   - **Rules:** every FRD rule the story delivers, quoted word for word by its ID, in the order of the FRD's flow. Its Step is the number of the flow step tagged with the rule, or Alternate.
   - **Metrics traceability:** the EPIC brief's success measures this story helps move, or None when the EPIC has no brief
   - **Design links:** when a design exists. Otherwise None.
   - **Sizing alert:** when a story may take more than two days, as the template sets out, at the top of Scope. The ways to split it become a question.
3. **Raise the questions.** Run probing-questions-author on the Stories, write each question's number where its gap is, then run `node tools/grade-questions.cjs --project {project}`.
4. **Check.** Run `node tools/check-stories.cjs --project {project} --epic {epic}`. Fix every finding and run it again.
5. **The gate.** Hold it as `../_shared/decision-review-gates.md` says: the two "For the person" blocks, the questions in order, then **Accept the grooming?**, covering all the EPIC's stories together. Record each answer straight away. On acceptance, set each story's status to groomed, in the Story and the list. Run the check again, and paste its "For the file" block into the Story list's Check record. Then run `node tools/accept.cjs --project {project} --document story-list --epic {epic}`, which saves this version of the Story list, and close with `status.cjs`.

An EPIC's gates offer "park it" after a third "no", with "accept it as it is" and "one more round" (`../_shared/decision-review-gates.md`, rule 11).

## Dependency evidence (no guessing)

Prove every dependency from the text. The proof is one of these:
- explicit sequencing, such as "requires" or "after"
- data or a state that one story produces and another needs
- a flow or an entry point
- roles or setup that are required

If you can't prove it, **ask and stop**. Never assert an inferred dependency as fact.

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When the recommendation in a Change impact report names a story, read the report too, and change only the grooming it names: the scope items and rules the change touches. Every other part of the story stays as it is. A story already ready is never groomed again: the difference comes as a new story, through story-drafter.

## Rules

- **State In and Out of scope explicitly.** Use no vague words, such as "properly" or "as needed".
- **No acceptance criteria in grooming.** They are ac-author's.
- **One capability per story** — if grooming reveals a bundle, raise the sizing alert, and propose the split as a question.

## Handoff

The groomed Stories feed `ac-author`, which writes their acceptance criteria in the same files.
