---
name: epic-author
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Writes EPIC documents, in one of two modes. Register mode copies the chosen
  grouping, field for field, into the EPIC register, and a program proves the copy.
  A pass is its acceptance, with no gate. Brief mode writes one EPIC brief, for an
  EPIC the EPIC brief list says gets one, as the first gate of that EPIC's stories:
  "Accept the EPIC brief?". Use after the EPIC grouping is accepted, for example
  "write the EPIC register for expense-claims", or "write the EPIC brief for
  EPIC-002". Not for deciding the grouping (use epic-grouping-author) or writing
  stories (use story-drafter).
---

# epic-author

> **What this is:** The skill that writes the EPIC register, copied from the chosen grouping, and each EPIC brief the EPIC brief list asks for.
>
> **What it is not:** A place to decide how the features are grouped, which is the EPIC grouping's, or the stories, which come after.
>
> **Who uses it:** `features-and-epics-workflow`, in register mode, as its third step. `stories-workflow`, in brief mode, as the first step of an EPIC that gets a brief. A specifier, on its own, with the project's name and the mode, and in brief mode the EPIC.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md` and `../_shared/decision-review-gates.md`. It writes from `../_shared/templates/epic-register.md` and `../_shared/templates/epic-brief.md`. How to fill each section of a brief is in `references/epic-generation.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## Register mode

- **Reads:** the accepted EPIC grouping. **Looks up:** the Feature catalog.
- **Writes:** `epics/register.md`.
- **Its gate:** none. **Its check:** `check-register.cjs`, and a pass is the acceptance.

1. Run `node tools/scaffold-project.cjs --project {project}`. If the EPIC grouping isn't accepted, say so and stop.
2. Copy the chosen grouping into the register, each field as the template's "What each section holds" says: **transcribe, enum or derive, never compose**. Nothing is written fresh, so two runs over the same grouping give the same register. Write "Copy checked on: not yet": the check writes the date.
3. Run `node tools/check-register.cjs --project {project}`. On a mismatch, correct the copy, never the grouping, and run it again.
   - The check also checks the register's simple writing. It prints one line for it, such as "Simple writing: 0 to fix, 1 to look at." Show that line when the check passes.
   - Fix anything it lists to fix in the register's own words, and run it again. A finding in a copied field belongs to the grouping. Say so, and stop. The grouping changes only through a change (`conventions.md`, "A mistake found later").
4. When it passes, run `node tools/accept.cjs --project {project} --document epic-register`. The workflow's next step builds the EPIC sequencing and mapping from it.

Register mode only copies, so it raises no questions.

## Brief mode

- **Reads:** the EPIC register. **Looks up:** the BRD, the PRD and the Feature catalog.
- **Writes:**
  - `epics/{epic}/brief.md`
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
- **Its gate:** "Accept the EPIC brief?" **Its check:** `check-epic-brief.cjs`.

1. Run `node tools/scaffold-project.cjs --project {project} --epic {epic}`. Run only for an EPIC the EPIC grouping's brief list marks "yes". For any other, say so and stop.
2. Write each section of the template as `references/epic-generation.md` says. Section 7 lists only the IDs of the PRD's NFRs that apply.
3. Run probing-questions-author on the brief, write each question's number at its gap, then run `node tools/grade-questions.cjs --project {project}`.
4. Run `node tools/check-epic-brief.cjs --project {project} --epic {epic}`. Fix every finding and run it again, until every check passes.
5. Hold the gate exactly as `decision-review-gates.md` says: the two "For the person" blocks, then the questions the brief raised or builds on, then each AI-RECOMMENDED measure, then **Accept the EPIC brief?** Record each answer straight away. When the specifier accepts, run `node tools/accept.cjs --project {project} --document epic-brief --epic {epic}`.

An EPIC's gates offer "park it" after a third "no", with "accept it as it is" and "one more round" (`decision-review-gates.md`, rule 11).

## In a change

When a change's recommendation names the EPIC register or an EPIC brief, read the Change impact report too, and change only what it names. In register mode, copy the changed rows from the EPIC grouping again, and run the copy check. In brief mode, change only the parts of the brief the report names.

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

## Rules

- **Features are a table**, one row per feature.
- **No acceptance criteria** in an EPIC. They belong to the stories.
- **Never invent** measures, baselines or targets. Tag every measure's confidence (`conventions.md`, "Confidence").
- **Every tracker work item ID is TBD.**
- **Readability:** one idea per sentence, active voice, no stacked clauses.

## Handoff

The register feeds `build-sequencing-mapping.cjs`, then `frd-workflow`. An EPIC brief opens that EPIC's stories, in `stories-workflow`.
