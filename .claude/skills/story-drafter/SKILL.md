---
name: story-drafter
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
description: >-
  Splits one EPIC into INVEST user stories, in the order they are worked: each a
  title and an "As a / I want / So that" statement, one capability each, from the
  EPIC's register row and its FRDs' flows. One gate for all the EPIC's stories,
  "Approve the split?". The Story files are created only after approval. Use when
  stories-workflow reaches an EPIC, or on its own, for example "split EPIC-002 into
  stories". Not for grooming (use story-groomer) or acceptance criteria (use
  ac-author).
---

# story-drafter

> **What this is:** The skill that splits one EPIC into stories, single capabilities a person can use, and decides their order.
>
> **What it is not:** The stories' detail: their grooming is story-groomer's, and their acceptance criteria ac-author's.
>
> **Who uses it:** `stories-workflow`, for each EPIC. A specifier, on its own, with the project's name and the EPIC.

This skill follows `../_shared/conventions.md`, `../_shared/simple-writing-rules.md`, `../_shared/atomic-rules.md` and `../_shared/decision-review-gates.md`. It writes from `../_shared/templates/story-list.md` and `../_shared/templates/story.md`. Its quality standard and examples are in `references/story-creation.md`. It loads them, and never restates them. If any of them is missing, it names the file and stops.

## What it reads and writes

- **Reads:** the EPIC's register row, the FRDs of its features, and the design, if there is one.
- **Looks up:** the Glossary, the BRD and the PRD.
- **Writes:**
  - `epics/{epic}/story-list.md`
  - one Story per story, `epics/{epic}/{story}.md`, only after approval
  - its questions, in `{product}-question-log.md`, through probing-questions-author and `grade-questions.cjs`
- **Its gate:** "Approve the split?", for all the EPIC's stories together.
- **Its check:** `check-stories.cjs`

## Steps

Steps 1 to 6 run without stopping.

1. **Set up.** Run `node tools/scaffold-project.cjs --project {project} --epic {epic}`. If an FRD the EPIC's features need isn't accepted, say so and stop.
2. **Restate** the EPIC from its register row, and its brief if it has one, in plain words.
3. **Personas.** Take the "As a" personas from the PRD, in the Glossary's role words.
4. **Capabilities.** Take the capabilities from the FRDs' flows: each step a person takes is a candidate. Split any bundle. Expand any "manage" into what it really means.
5. **Split and order.** Choose how to split, recommend it, and order the stories in the order they are worked. Every feature of the EPIC is told by at least one story, or routed elsewhere with its reason.
6. **Draft the Story list** from its template: each story's title and statement, its requirement and feature, status drafted, the routed items, and the coverage. Add design links when a design exists. Check each story against Q1, one capability, and Q10, legible at one altitude. A long "I want", or one with many clauses, is the signal to split it or thin it.
7. **Raise the questions.** Run probing-questions-author on the list, write each question's number where its gap is, then run `node tools/grade-questions.cjs --project {project}`.
8. **Check.** Run `node tools/check-stories.cjs --project {project} --epic {epic}`. Fix every finding and run it again.
9. **The gate.** Hold it as `../_shared/decision-review-gates.md` says: the two "For the person" blocks, the questions in order, then **Approve the split?**, covering all the EPIC's stories together, with their order. Record each answer straight away.
10. **After approval,** create one Story per story from its template, named by its title in lowercase with hyphens: its status rows, and its statement, word for word from the list, under Description. The grooming sections and the Acceptance criteria are added later, by story-groomer and ac-author. Run the check again, and paste its "For the file" block into the Story list's Check record. Then run `node tools/accept.cjs --project {project} --document story-list --epic {epic}`, which saves this version of the Story list, and close with `status.cjs`.

An EPIC's gates offer "park it" after a third "no", with "accept it as it is" and "one more round" (`../_shared/decision-review-gates.md`, rule 11).

## In a change

Inside a change you said yes to, `../_shared/decision-review-gates.md`, rule 12, says what to do in place of the gate: no gate question, and the skill asks you something only for the reasons it gives.

When the recommendation in a Change impact report names this EPIC's stories, read the report too, and change only what it names. A story's title is its identity, so every story already in the list keeps its title and its place. A story the change adds, such as a new story for the difference, gets a title of its own and goes at the end of the list. A story already ready is never changed: the difference becomes a new story. The list then goes through its check and its gate again.

## Rules

- **One capability per story** — one verb and one object. No "and/or/also", and no list of several objects or outcomes in the "I want". Split instead. This is Q1. Each story's title and "I want" follow `../_shared/atomic-rules.md`.
- **One altitude** — the "I want" names the capability only. Listed outputs, mechanisms and conditions go to the acceptance criteria, never into the statement.
- **Legible** — the "I want" states one idea and reads on the first pass: no stacked relative clauses, no dashed or bracketed aside. This is Q10.
- **INVEST** — Independent, Negotiable, Valuable, Estimable, Small, Testable.
- **User-facing only** — what the *user* does, never "the system…". A developer isn't a persona.
- **Use only sourced capabilities and personas** — nothing like an invented "user can also export".
- **No acceptance criteria, no rules, no estimates** in a drafted story. Those come later.

## Handoff

The approved list feeds `story-groomer`, which fills each Story's grooming in the same file.
